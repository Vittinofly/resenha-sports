'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { AlertTriangle, CalendarDays, Clock, Dumbbell, Loader2, Timer } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { DURACOES } from '@/lib/config';
import { useEmpresa } from '@/components/empresa-contexto';
import { useHoje, useMinutoAtual, useContatoSalvo } from '@/lib/hooks';
import { hhmm, horaParaMinutos, minutosParaHora, intervalosSobrepoem, formatarDataLonga, formatarData, formatarMoeda, somarDias, telefoneValido } from '@/lib/formatadores';
import { mensagemSolicitacao, ERRO_CONFLITO_DB } from '@/lib/reservas';
import { inserirReservaPublica } from '@/lib/reservas-publicas';
import { calcularSinal } from '@/lib/pix';
import { CamposContato } from '@/components/campos';
import SeletorData from '@/components/seletor-data';
import SucessoReserva from '@/components/sucesso-reserva';
import { useFeedback } from '@/components/feedback';

// Lê ?quadra=q2 (links da home). Fica em Suspense para não bloquear o prerender.
function LerQuadraDaUrl({ aoLer }) {
  const { quadras } = useEmpresa();
  const params = useSearchParams();
  const id = params.get('quadra');
  useEffect(() => {
    if (id && quadras.some((q) => q.id === id)) aoLer(id);
  }, [id, aoLer, quadras]);
  return null;
}

function Etapa({ numero, titulo, children, acao }) {
  return (
    <section className="cartao p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h2 className="flex items-center gap-3 font-display font-bold uppercase text-xl text-slate-900">
          <span className="w-7 h-7 rounded-full bg-slate-900 text-white text-sm flex items-center justify-center font-sans">{numero}</span>
          {titulo}
        </h2>
        {acao}
      </div>
      {children}
    </section>
  );
}

export default function ReservaQuadra() {
  const { toast } = useFeedback();
  const empresa = useEmpresa();
  const { quadras, horariosQuadra, fechamentoQuadras } = empresa;
  const hoje = useHoje();
  const minutoAtual = useMinutoAtual();
  const [contatoSalvo, salvarContato] = useContatoSalvo();

  const [quadraId, setQuadraId] = useState(quadras[0].id);
  const [dataEscolhida, setDataEscolhida] = useState('');
  const [duracao, setDuracao] = useState(1);
  const [inicio, setInicio] = useState('');
  const [contato, setContato] = useState({ cliente_nome: '', cliente_whatsapp: '' });
  const [ocupacao, setOcupacao] = useState({ data: '', reservas: [], carregando: true });
  const [enviando, setEnviando] = useState(false);
  const [mostrarErros, setMostrarErros] = useState(false);
  const [erroConflito, setErroConflito] = useState('');
  const [sucesso, setSucesso] = useState(null);

  // Depois do último horário do dia, abre direto em amanhã
  const hojeEncerrado = hoje && minutoAtual >= horaParaMinutos(horariosQuadra.at(-1));
  const data = dataEscolhida || (hojeEncerrado ? somarDias(hoje, 1) : hoje);
  const quadra = quadras.find((q) => q.id === quadraId);

  const carregarOcupacao = useCallback(async (dataAlvo) => {
    const { data: rows, error } = await supabase
      .from('reservas_quadras')
      .select('quadra_nome, horario_inicio, horario_fim, status')
      .eq('empresa_id', empresa.id)
      .eq('data_reserva', dataAlvo)
      .neq('status', 'cancelado');
    // Em caso de erro não exibimos a grade: mostrar tudo "livre" levaria a reservas em horário ocupado
    setOcupacao({
      data: dataAlvo,
      carregando: false,
      erro: !!error,
      reservas: (rows || []).map((r) => ({ ...r, horario_inicio: hhmm(r.horario_inicio), horario_fim: hhmm(r.horario_fim) })),
    });
  }, [empresa.id]);

  // Carrega a ocupação do dia e atualiza a cada minuto / ao voltar para a aba
  useEffect(() => {
    if (!data) return;
    let ativo = true;
    const atualizar = () => ativo && carregarOcupacao(data);
    atualizar();
    const intervalo = setInterval(atualizar, 60 * 1000);
    window.addEventListener('focus', atualizar);
    return () => {
      ativo = false;
      clearInterval(intervalo);
      window.removeEventListener('focus', atualizar);
    };
  }, [data, carregarOcupacao]);

  const erroGrade = !ocupacao.carregando && ocupacao.data === data && ocupacao.erro;
  const carregandoGrade = ocupacao.carregando || ocupacao.data !== data || erroGrade;
  const reservasQuadra = ocupacao.data === data ? ocupacao.reservas.filter((r) => r.quadra_nome === quadra.nome) : [];

  const slotOcupado = (hora, nomeQuadra = quadra.nome) =>
    ocupacao.reservas.some(
      (r) => r.quadra_nome === nomeQuadra && intervalosSobrepoem(hora, minutosParaHora(horaParaMinutos(hora) + 60), r.horario_inicio, r.horario_fim)
    );
  const slotPassado = (hora) => data === hoje && minutoAtual >= 0 && horaParaMinutos(hora) <= minutoAtual;

  // Um início "cabe" se todas as horas da duração estiverem livres e antes do fechamento
  const cabe = (hora) => {
    const h = horaParaMinutos(hora) / 60;
    if (h + duracao > fechamentoQuadras || slotPassado(hora)) return false;
    for (let i = 0; i < duracao; i++) {
      if (slotOcupado(minutosParaHora((h + i) * 60))) return false;
    }
    return true;
  };

  const livresPorQuadra = (nomeQuadra) =>
    ocupacao.data === data && !ocupacao.erro ? horariosQuadra.filter((h) => !slotPassado(h) && !slotOcupado(h, nomeQuadra)).length : null;

  // A seleção é descartada automaticamente se deixar de caber (troca de quadra/data/duração)
  const inicioValido = inicio && !carregandoGrade && cabe(inicio) ? inicio : '';
  const fim = inicioValido ? minutosParaHora(horaParaMinutos(inicioValido) + duracao * 60) : '';
  const dentroDaSelecao = (hora) => inicioValido && hora >= inicioValido && hora < fim;
  const sinal = calcularSinal('quadras', { data, inicio: inicioValido, fim }, empresa.sinal, !!empresa.pix.chave);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErroConflito('');
    setMostrarErros(true);

    if (!inicioValido) {
      toast('Escolha um horário livre na grade.', 'erro');
      return;
    }
    if (!telefoneValido(contato.cliente_whatsapp)) {
      toast('Confira o número de WhatsApp (DDD + número).', 'erro');
      return;
    }

    setEnviando(true);

    // Revalida no servidor imediatamente antes de inserir
    const { data: existentes, error: erroBusca } = await supabase
      .from('reservas_quadras')
      .select('horario_inicio, horario_fim')
      .eq('empresa_id', empresa.id)
      .eq('quadra_nome', quadra.nome)
      .eq('data_reserva', data)
      .neq('status', 'cancelado');

    if (erroBusca) {
      setEnviando(false);
      toast('Não foi possível verificar a disponibilidade. Tente novamente.', 'erro');
      return;
    }

    if (existentes.some((r) => intervalosSobrepoem(inicioValido, fim, hhmm(r.horario_inicio), hhmm(r.horario_fim)))) {
      setEnviando(false);
      setErroConflito(`Alguém acabou de reservar parte do horário ${inicioValido}–${fim}. Escolha outro horário.`);
      carregarOcupacao(data);
      return;
    }

    const nome = contato.cliente_nome.trim().replace(/\s+/g, ' ');
    const { error, token, sinal: sinalGravado } = await inserirReservaPublica(empresa.id, 'quadras',
      {
        cliente_nome: nome,
        cliente_whatsapp: contato.cliente_whatsapp,
        quadra_nome: quadra.nome,
        data_reserva: data,
        horario_inicio: inicioValido,
        horario_fim: fim,
        status: 'pendente',
      },
      { sinal }
    );

    setEnviando(false);

    if (error) {
      if (error.code === ERRO_CONFLITO_DB) {
        setErroConflito('Esse horário acabou de ser reservado. Escolha outro horário.');
        carregarOcupacao(data);
      } else {
        toast(error.code === 'P0001' ? error.message : 'Não foi possível enviar sua reserva. Tente novamente ou fale conosco pelo WhatsApp.', 'erro');
      }
      return;
    }

    salvarContato(nome, contato.cliente_whatsapp);
    setSucesso({
      titulo: 'Quadra solicitada!',
      tipo: 'quadras',
      token,
      sinal: sinalGravado,
      linhas: [
        ['Quadra', quadra.nome],
        ['Data', formatarDataLonga(data)],
        ['Horário', `${inicioValido} às ${fim} (${duracao}h)`],
        ['Nome', nome],
      ],
      mensagemWhatsApp: mensagemSolicitacao({ tipo: 'quadras', nome, local: quadra.nome, data, inicio: inicioValido, fim }),
      agenda: { titulo: `${quadra.curto} · ${empresa.nomeCurto}`, data, inicio: inicioValido, fim, detalhes: `${quadra.nome} — reserva solicitada pelo site.` },
    });
    setInicio('');
    carregarOcupacao(data);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (sucesso) {
    return (
      <div className="cartao p-6 sm:p-10">
        <SucessoReserva resumo={sucesso} aoNovaReserva={() => setSucesso(null)} />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-6 items-start">
      <Suspense fallback={null}>
        <LerQuadraDaUrl aoLer={setQuadraId} />
      </Suspense>

      <div className="space-y-4 min-w-0">
        {/* 1. QUADRA */}
        <Etapa numero={1} titulo="Escolha a quadra">
          <div className="grid sm:grid-cols-3 gap-3" role="radiogroup" aria-label="Quadra">
            {quadras.map((q) => {
              const ativa = q.id === quadraId;
              const livres = livresPorQuadra(q.nome);
              return (
                <button
                  key={q.id}
                  type="button"
                  role="radio"
                  aria-checked={ativa}
                  onClick={() => setQuadraId(q.id)}
                  className={`text-left p-4 rounded-2xl border-2 transition ${
                    ativa ? 'border-red-600 bg-red-50/60' : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <span className="flex items-center justify-between">
                    <span className="font-display font-black uppercase text-xl text-slate-900">{q.curto}</span>
                    <Dumbbell className={`w-5 h-5 ${ativa ? 'text-red-600' : 'text-slate-300'}`} />
                  </span>
                  <span className="block text-xs font-semibold text-slate-600 mt-0.5">{q.esportes}</span>
                  <span className="flex items-center justify-between mt-3 text-[11px]">
                    <span className="text-slate-500">{q.piso}</span>
                    {livres !== null && (
                      <span className={`font-bold ${livres ? 'text-emerald-700' : 'text-slate-400'}`}>
                        {livres ? `${livres} horário${livres > 1 ? 's' : ''} livre${livres > 1 ? 's' : ''}` : 'Lotada'}
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </Etapa>

        {/* 2. DATA */}
        <Etapa numero={2} titulo="Escolha o dia">
          <SeletorData valor={data} aoMudar={setDataEscolhida} />
        </Etapa>

        {/* 3. HORÁRIO */}
        <Etapa
          numero={3}
          titulo="Escolha o horário"
          acao={
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl" role="radiogroup" aria-label="Duração">
              <Timer className="w-4 h-4 text-red-600 mx-1.5 hidden sm:block" />
              {DURACOES.map((d) => (
                <button
                  key={d}
                  type="button"
                  role="radio"
                  aria-checked={duracao === d}
                  onClick={() => setDuracao(d)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-black transition ${duracao === d ? 'bg-white text-red-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  {d}h
                </button>
              ))}
            </div>
          }
        >
          {erroConflito && (
            <div role="alert" className="mb-4 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-sm text-rose-800">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
              {erroConflito}
            </div>
          )}

          {erroGrade ? (
            <div role="alert" className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-center text-sm text-slate-600">
              Não conseguimos carregar os horários agora.
              <button type="button" onClick={() => carregarOcupacao(data)} className="btn-secundario mt-3 mx-auto flex">Tentar novamente</button>
            </div>
          ) : carregandoGrade ? (
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2" aria-busy="true">
              {horariosQuadra.map((h) => (
                <div key={h} className="h-14 rounded-xl bg-slate-100 animate-pulse" />
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                {horariosQuadra.map((hora) => {
                  const ocupado = slotOcupado(hora);
                  const passado = slotPassado(hora);
                  const selecionado = dentroDaSelecao(hora);
                  const possivel = cabe(hora);
                  const bloqueado = ocupado || passado;
                  return (
                    <button
                      key={hora}
                      type="button"
                      disabled={bloqueado}
                      onClick={() => {
                        setErroConflito('');
                        if (possivel) setInicio(hora);
                        else toast(`Não há ${duracao}h livres seguidas a partir das ${hora}.`, 'info');
                      }}
                      aria-pressed={selecionado}
                      className={`h-14 rounded-xl border text-center transition ${
                        selecionado
                          ? 'bg-red-600 border-red-600 text-white shadow-md'
                          : bloqueado
                          ? 'bg-slate-100 border-slate-100 text-slate-300 cursor-not-allowed'
                          : possivel
                          ? 'bg-white border-slate-200 text-slate-900 hover:border-red-400 hover:bg-red-50'
                          : 'bg-white border-dashed border-slate-200 text-slate-400'
                      }`}
                    >
                      <span className={`block text-sm font-black tabular-nums ${ocupado && !passado ? 'line-through' : ''}`}>{hora}</span>
                      <span className="block text-[9px] font-semibold uppercase mt-0.5 opacity-80">
                        {selecionado ? 'Seu jogo' : passado ? 'Encerrado' : ocupado ? 'Ocupado' : 'Livre'}
                      </span>
                    </button>
                  );
                })}
              </div>
              <div className="flex flex-wrap gap-4 mt-4 text-[11px] font-semibold text-slate-500">
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-white border border-slate-300" /> Livre</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-600" /> Selecionado</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-slate-200" /> Ocupado / encerrado</span>
              </div>
              {reservasQuadra.length === 0 && !horariosQuadra.every(slotPassado) && (
                <p className="text-xs text-emerald-700 font-semibold mt-3">Agenda livre nesse dia — escolha o melhor horário!</p>
              )}
            </>
          )}
        </Etapa>

        {/* 4. DADOS */}
        <Etapa numero={4} titulo="Seus dados">
          <CamposContato
            nome={contato.cliente_nome}
            whatsapp={contato.cliente_whatsapp}
            aoMudar={(parcial) => setContato((c) => ({ ...c, ...parcial }))}
            contatoSalvo={contatoSalvo}
            mostrarErros={mostrarErros}
          />
        </Etapa>
      </div>

      {/* RESUMO */}
      <aside className="lg:sticky lg:top-24 cartao p-5 space-y-4">
        <h2 className="font-display font-bold uppercase text-lg text-slate-900">Resumo</h2>
        <dl className="space-y-3 text-sm">
          {/* dt com ícone + texto só para leitor de tela (estrutura válida de <dl>) */}
          <div className="flex gap-3">
            <dt className="mt-0.5 shrink-0"><Dumbbell className="w-4 h-4 text-red-600" aria-hidden="true" /><span className="sr-only">Quadra</span></dt>
            <dd className="font-bold text-slate-900">{quadra.nome}</dd>
          </div>
          <div className="flex gap-3">
            <dt className="mt-0.5 shrink-0"><CalendarDays className="w-4 h-4 text-red-600" aria-hidden="true" /><span className="sr-only">Data</span></dt>
            <dd className="font-bold text-slate-900">{data ? formatarDataLonga(data) : '—'}</dd>
          </div>
          <div className="flex gap-3">
            <dt className="mt-0.5 shrink-0"><Clock className="w-4 h-4 text-red-600" aria-hidden="true" /><span className="sr-only">Horário</span></dt>
            <dd className={inicioValido ? 'font-bold text-slate-900' : 'text-slate-500'}>
              {inicioValido ? `${inicioValido} às ${fim} · ${duracao}h de jogo` : 'Selecione um horário na grade'}
            </dd>
          </div>
        </dl>

        <button type="submit" disabled={enviando || !inicioValido} className="btn-primario w-full !py-3.5 !text-base">
          {enviando ? (
            <><Loader2 className="w-5 h-5 animate-spin" /> Enviando...</>
          ) : (
            'Solicitar reserva'
          )}
        </button>
        {sinal > 0 && (
          <p className="text-xs text-amber-900 bg-amber-50 border border-amber-200 rounded-xl p-3">
            Horário nobre: sinal de <strong>{formatarMoeda(sinal)}</strong> via Pix para garantir. O QR Code aparece ao concluir.
          </p>
        )}
        <p className="text-[11px] text-slate-500 text-center leading-relaxed">
          {sinal > 0 ? 'Nada é cobrado pelo site.' : 'Sem pagamento agora.'} A reserva fica <strong>pendente</strong> até a confirmação da equipe pelo WhatsApp{data ? ` para ${formatarData(data)}` : ''}.
        </p>
      </aside>
    </form>
  );
}
