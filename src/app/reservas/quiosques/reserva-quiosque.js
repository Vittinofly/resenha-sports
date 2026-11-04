'use client';

import { useEffect, useState } from 'react';
import { Loader2, Minus, PartyPopper, Plus, ShoppingBag, Users } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { QUIOSQUES, TIPOS_EVENTO } from '@/lib/config';
import { useHoje, useContatoSalvo } from '@/lib/hooks';
import { useCardapioDisponivel } from '@/lib/cardapio';
import { formatarDataLonga, formatarMoeda, somarDias, telefoneValido } from '@/lib/formatadores';
import { montarDetalhes, mensagemSolicitacao, resumirPedido, quiosqueDaReserva, ERRO_DUPLICADO_DB } from '@/lib/reservas';
import { CamposContato } from '@/components/campos';
import SeletorData from '@/components/seletor-data';
import PrePedido from '@/components/pre-pedido';
import SucessoReserva from '@/components/sucesso-reserva';
import { useFeedback } from '@/components/feedback';

export default function ReservaQuiosque() {
  const { toast } = useFeedback();
  const hoje = useHoje();
  const [contatoSalvo, salvarContato] = useContatoSalvo();
  const { itens: cardapio, carregando: carregandoCardapio } = useCardapioDisponivel();

  const [dataEscolhida, setDataEscolhida] = useState('');
  const [quiosqueId, setQuiosqueId] = useState(QUIOSQUES[0].id);
  const [tipoEvento, setTipoEvento] = useState(TIPOS_EVENTO[0]);
  const [convidadosTexto, setConvidadosTexto] = useState('20');
  const [itens, setItens] = useState({});
  const [contato, setContato] = useState({ cliente_nome: '', cliente_whatsapp: '' });
  const [ocupados, setOcupados] = useState({ data: '', nomes: [] });
  const [enviando, setEnviando] = useState(false);
  const [mostrarErros, setMostrarErros] = useState(false);
  const [sucesso, setSucesso] = useState(null);

  // Eventos precisam de pelo menos 1 dia de antecedência
  const minimo = hoje ? somarDias(hoje, 1) : '';
  const data = dataEscolhida || minimo;
  const quiosque = QUIOSQUES.find((q) => q.id === quiosqueId);
  const pedido = resumirPedido(itens, cardapio);
  const convidados = Number(convidadosTexto) || 0;
  const acimaCapacidade = convidados > quiosque.capacidade;
  const ajustarConvidados = (delta) => setConvidadosTexto(String(Math.min(999, Math.max(1, convidados + delta))));

  useEffect(() => {
    if (!data) return;
    let ativo = true;
    supabase
      .from('reservas_quiosques')
      .select('tipo_evento, status')
      .eq('data_reserva', data)
      .neq('status', 'cancelado')
      .then(({ data: rows, error }) => {
        if (!ativo) return;
        const reservados = new Set((rows || []).map((r) => quiosqueDaReserva(r.tipo_evento)));
        const nomes = error ? [] : QUIOSQUES.filter((q) => reservados.has(q.nome)).map((q) => q.id);
        setOcupados({ data, nomes });
      });
    return () => {
      ativo = false;
    };
  }, [data]);

  const estaOcupado = (id) => ocupados.data === data && ocupados.nomes.includes(id);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMostrarErros(true);
    if (estaOcupado(quiosqueId)) return toast('Esse quiosque já está reservado nessa data. Escolha outro quiosque ou dia.', 'erro');
    if (convidados < 1) return toast('Informe quantos convidados você espera.', 'erro');
    if (acimaCapacidade) return toast(`O ${quiosque.curto} comporta até ${quiosque.capacidade} pessoas.`, 'erro');
    if (!telefoneValido(contato.cliente_whatsapp)) return toast('Confira o número de WhatsApp (DDD + número).', 'erro');

    setEnviando(true);
    const nome = contato.cliente_nome.trim().replace(/\s+/g, ' ');
    const { error } = await supabase.from('reservas_quiosques').insert([
      {
        cliente_nome: nome,
        cliente_whatsapp: contato.cliente_whatsapp,
        tipo_evento: montarDetalhes(tipoEvento, quiosque.nome, pedido.texto),
        data_reserva: data,
        num_convidados: convidados,
        status: 'pendente',
      },
    ]);
    setEnviando(false);

    if (error) {
      if (error.code === ERRO_DUPLICADO_DB) {
        setOcupados((atual) => ({ data, nomes: [...(atual.data === data ? atual.nomes : []), quiosqueId] }));
        toast('Esse quiosque acabou de ser reservado para essa data. Escolha outro quiosque ou dia.', 'erro');
      } else {
        toast('Não foi possível enviar sua reserva. Tente novamente ou fale conosco pelo WhatsApp.', 'erro');
      }
      return;
    }

    salvarContato(nome, contato.cliente_whatsapp);
    setSucesso({
      titulo: 'Evento solicitado!',
      linhas: [
        ['Quiosque', quiosque.nome],
        ['Evento', tipoEvento],
        ['Data', formatarDataLonga(data)],
        ['Convidados', String(convidados)],
        ['Pré-pedido', pedido.texto || null],
        ['Total estimado', pedido.total ? formatarMoeda(pedido.total) : null],
        ['Nome', nome],
      ],
      mensagemWhatsApp: mensagemSolicitacao({
        tipo: 'quiosques',
        nome,
        local: quiosque.nome,
        evento: tipoEvento,
        data,
        pessoas: convidados,
        pedido: pedido.texto,
        total: pedido.total,
      }),
      agenda: { titulo: `${tipoEvento} no Resenha`, data, detalhes: `${quiosque.nome} — ${convidados} convidados.` },
    });
    setItens({});
    setOcupados({ data: '', nomes: [] });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (sucesso) {
    return (
      <div className="cartao p-6 sm:p-10">
        <SucessoReserva resumo={sucesso} aoNovaReserva={() => setSucesso(null)} textoNova="Nova reserva" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-6 items-start">
      <div className="space-y-4 min-w-0">
        <section className="cartao p-5 sm:p-6 space-y-5">
          <h2 className="font-display font-bold uppercase text-xl text-slate-900">1. Data e espaço</h2>

          <div>
            <span className="rotulo">Data do evento</span>
            {minimo ? (
              <SeletorData valor={data} aoMudar={setDataEscolhida} dias={14} maxDias={365} aPartirDe={1} />
            ) : (
              <div className="h-[74px] rounded-2xl bg-slate-100 animate-pulse" />
            )}
          </div>

          <div className="grid sm:grid-cols-3 gap-3" role="radiogroup" aria-label="Quiosque">
            {QUIOSQUES.map((q) => {
              const ativo = q.id === quiosqueId;
              const ocupado = estaOcupado(q.id);
              return (
                <button
                  key={q.id}
                  type="button"
                  role="radio"
                  aria-checked={ativo}
                  disabled={ocupado}
                  onClick={() => setQuiosqueId(q.id)}
                  className={`text-left p-4 rounded-2xl border-2 transition disabled:cursor-not-allowed disabled:opacity-50 ${
                    ativo && !ocupado ? 'border-red-600 bg-red-50/60' : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <span className="flex items-center justify-between">
                    <span className="font-display font-black uppercase text-lg text-slate-900 leading-tight">{q.curto}</span>
                    <PartyPopper className={`w-5 h-5 shrink-0 ${ativo ? 'text-red-600' : 'text-slate-300'}`} />
                  </span>
                  <span className="block text-xs text-slate-500 mt-1">{q.ideal}</span>
                  <span className="flex items-center justify-between mt-3 text-[11px] font-bold">
                    <span className="flex items-center gap-1 text-slate-700"><Users className="w-3.5 h-3.5" /> até {q.capacidade}</span>
                    <span className={ocupado ? 'text-red-600' : 'text-emerald-700'}>{ocupados.data === data ? (ocupado ? 'Reservado' : 'Disponível') : ''}</span>
                  </span>
                </button>
              );
            })}
          </div>

          {estaOcupado(quiosqueId) && (
            <p role="alert" className="text-sm text-red-800 bg-red-50 border border-red-200 rounded-xl p-3">
              O {quiosque.curto} já está reservado nessa data. Escolha outro quiosque ou outro dia.
            </p>
          )}

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="tipo-evento" className="rotulo">Tipo de evento</label>
              <select id="tipo-evento" value={tipoEvento} onChange={(e) => setTipoEvento(e.target.value)} className="input">
                {TIPOS_EVENTO.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="convidados" className="rotulo">Convidados</label>
              <div className={`flex items-center gap-1 bg-slate-50 border rounded-xl p-1 ${acimaCapacidade ? 'border-red-400 ring-2 ring-red-500/30' : 'border-slate-200'}`}>
                <button type="button" onClick={() => ajustarConvidados(-5)} disabled={convidados <= 1} className="w-10 h-9 rounded-lg hover:bg-white disabled:opacity-30 flex items-center justify-center" aria-label="Menos 5 convidados">
                  <Minus className="w-4 h-4" />
                </button>
                <input
                  id="convidados"
                  type="text"
                  inputMode="numeric"
                  required
                  value={convidadosTexto}
                  onChange={(e) => setConvidadosTexto(e.target.value.replace(/\D/g, '').slice(0, 3))}
                  onBlur={() => !convidados && setConvidadosTexto('1')}
                  aria-invalid={acimaCapacidade || undefined}
                  className="flex-1 min-w-0 bg-transparent text-center font-display font-black text-xl tabular-nums focus:outline-none"
                />
                <button type="button" onClick={() => ajustarConvidados(5)} className="w-10 h-9 rounded-lg hover:bg-white flex items-center justify-center" aria-label="Mais 5 convidados">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <p className={`text-[11px] mt-1 ${acimaCapacidade ? 'text-red-600 font-semibold' : 'text-slate-500'}`}>
                {acimaCapacidade ? `Acima da capacidade (${quiosque.capacidade}). Escolha um quiosque maior.` : `Capacidade: ${quiosque.capacidade} pessoas.`}
              </p>
            </div>
          </div>
        </section>

        <section className="cartao p-5 sm:p-6 space-y-4">
          <div>
            <h2 className="font-display font-bold uppercase text-xl text-slate-900">2. Consumo do evento <span className="text-slate-400 text-base">(opcional)</span></h2>
            <p className="text-xs text-slate-500">Monte uma estimativa de bebidas e porções. A equipe ajusta tudo com você.</p>
          </div>
          <PrePedido cardapio={cardapio} carregando={carregandoCardapio} selecionados={itens} aoMudar={setItens} />
        </section>

        <section className="cartao p-5 sm:p-6 space-y-4">
          <h2 className="font-display font-bold uppercase text-xl text-slate-900">3. Seus dados</h2>
          <CamposContato
            nome={contato.cliente_nome}
            whatsapp={contato.cliente_whatsapp}
            aoMudar={(parcial) => setContato((c) => ({ ...c, ...parcial }))}
            contatoSalvo={contatoSalvo}
            mostrarErros={mostrarErros}
          />
        </section>
      </div>

      <aside className="lg:sticky lg:top-24 cartao p-5 space-y-4">
        <h2 className="font-display font-bold uppercase text-lg text-slate-900">Resumo</h2>
        <dl className="text-sm space-y-2">
          <div className="flex justify-between gap-3"><dt className="text-slate-500">Quiosque</dt><dd className="font-bold text-right">{quiosque.curto}</dd></div>
          <div className="flex justify-between gap-3"><dt className="text-slate-500">Data</dt><dd className="font-bold text-right">{data ? formatarDataLonga(data) : '—'}</dd></div>
          <div className="flex justify-between gap-3"><dt className="text-slate-500">Evento</dt><dd className="font-bold">{tipoEvento}</dd></div>
          <div className="flex justify-between gap-3"><dt className="text-slate-500">Convidados</dt><dd className="font-bold">{convidados || '—'}</dd></div>
        </dl>
        {pedido.linhas.length > 0 && (
          <div className="border-t border-slate-100 pt-3">
            <p className="flex items-center gap-1.5 text-xs font-bold text-slate-600 uppercase mb-2"><ShoppingBag className="w-3.5 h-3.5 text-red-600" /> Consumo</p>
            <ul className="text-xs text-slate-700 space-y-1 max-h-40 overflow-y-auto">{pedido.linhas.map((l) => <li key={l}>{l}</li>)}</ul>
            <p className="flex justify-between font-bold text-sm mt-2"><span>Estimado</span><span className="text-red-600">{formatarMoeda(pedido.total)}</span></p>
          </div>
        )}
        <button type="submit" disabled={enviando || estaOcupado(quiosqueId) || !data} className="btn-primario w-full !py-3.5 !text-base">
          {enviando ? <><Loader2 className="w-5 h-5 animate-spin" /> Enviando...</> : 'Solicitar quiosque'}
        </button>
        <p className="text-[11px] text-slate-500 text-center">Reservas com no mínimo 1 dia de antecedência. Confirmação pelo WhatsApp.</p>
      </aside>
    </form>
  );
}
