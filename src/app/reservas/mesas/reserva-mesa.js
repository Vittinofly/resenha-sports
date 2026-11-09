'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Loader2, Minus, Plus, ShoppingBag, Users } from 'lucide-react';
import { inserirReservaPublica } from '@/lib/reservas-publicas';
import { HORARIOS_RESTAURANTE } from '@/lib/config';
import { useHoje, useMinutoAtual, useContatoSalvo } from '@/lib/hooks';
import { useCardapioDisponivel } from '@/lib/cardapio';
import { formatarDataLonga, formatarMoeda, horaParaMinutos, minutosParaHora, somarDias, telefoneValido } from '@/lib/formatadores';
import { montarDetalhes, mensagemSolicitacao, resumirPedido } from '@/lib/reservas';
import { CamposContato } from '@/components/campos';
import SeletorData from '@/components/seletor-data';
import PrePedido from '@/components/pre-pedido';
import SucessoReserva from '@/components/sucesso-reserva';
import { useFeedback } from '@/components/feedback';

const MAX_PESSOAS = 30;

export default function ReservaMesa() {
  const { toast } = useFeedback();
  const hoje = useHoje();
  const minutoAtual = useMinutoAtual();
  const [contatoSalvo, salvarContato] = useContatoSalvo();
  const { itens: cardapio, carregando: carregandoCardapio } = useCardapioDisponivel();

  const [dataEscolhida, setDataEscolhida] = useState('');
  const [horario, setHorario] = useState('');
  const [pessoas, setPessoas] = useState(2);
  const [itens, setItens] = useState({});
  const [contato, setContato] = useState({ cliente_nome: '', cliente_whatsapp: '' });
  const [enviando, setEnviando] = useState(false);
  const [mostrarErros, setMostrarErros] = useState(false);
  const [sucesso, setSucesso] = useState(null);

  // Para hoje, só horários com pelo menos 30 min de antecedência
  const passouHoje = (h) => minutoAtual >= 0 && horaParaMinutos(h) < minutoAtual + 30;
  // Se hoje não tem mais horários, abre direto no dia seguinte
  const hojeEsgotado = hoje && HORARIOS_RESTAURANTE.every(passouHoje);
  const data = dataEscolhida || (hojeEsgotado ? somarDias(hoje, 1) : hoje);
  const horarioDisponivel = (h) => !(data === hoje && passouHoje(h));
  const horariosDoDia = HORARIOS_RESTAURANTE.filter(horarioDisponivel);
  const horarioValido = horariosDoDia.includes(horario) ? horario : '';
  const pedido = resumirPedido(itens, cardapio);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMostrarErros(true);
    if (!horarioValido) return toast('Escolha o horário de chegada.', 'erro');
    if (!telefoneValido(contato.cliente_whatsapp)) return toast('Confira o número de WhatsApp (DDD + número).', 'erro');

    setEnviando(true);
    const nome = contato.cliente_nome.trim().replace(/\s+/g, ' ');
    // Estimativa de permanência de 2h (limitada às 23:59)
    const saida = minutosParaHora(horaParaMinutos(horarioValido) + 120);

    const { error, token } = await inserirReservaPublica('mesas', {
      cliente_nome: nome,
      cliente_whatsapp: contato.cliente_whatsapp,
      data_reserva: data,
      horario_inicio: horarioValido,
      horario_fim: saida,
      num_pessoas: pessoas,
      tipo_evento: montarDetalhes(`Reserva para ${pessoas} pessoas`, 'Mesa Restaurante', pedido.texto),
      status: 'pendente',
    });
    setEnviando(false);

    if (error) {
      toast(error.code === 'P0001' ? error.message : 'Não foi possível enviar sua reserva. Tente novamente ou fale conosco pelo WhatsApp.', 'erro');
      return;
    }

    salvarContato(nome, contato.cliente_whatsapp);
    setSucesso({
      titulo: 'Mesa solicitada!',
      tipo: 'mesas',
      token,
      linhas: [
        ['Data', formatarDataLonga(data)],
        ['Chegada', horarioValido],
        ['Pessoas', String(pessoas)],
        ['Pré-pedido', pedido.texto || null],
        ['Total estimado', pedido.total ? formatarMoeda(pedido.total) : null],
        ['Nome', nome],
      ],
      mensagemWhatsApp: mensagemSolicitacao({
        tipo: 'mesas',
        nome,
        local: 'Mesa no gastrobar',
        data,
        inicio: horarioValido,
        pessoas,
        pedido: pedido.texto,
        total: pedido.total,
      }),
      agenda: { titulo: 'Mesa no Resenha Gastrobar', data, inicio: horarioValido, fim: saida, detalhes: `Mesa para ${pessoas} pessoas.` },
    });
    setItens({});
    setHorario('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (sucesso) {
    return (
      <div className="cartao p-6 sm:p-10">
        <SucessoReserva resumo={sucesso} aoNovaReserva={() => setSucesso(null)} textoNova="Reservar outra mesa" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-6 items-start">
      <div className="space-y-4 min-w-0">
        <section className="cartao p-5 sm:p-6 space-y-5">
          <h2 className="font-display font-bold uppercase text-xl text-slate-900">1. Quando e quantos?</h2>

          <div>
            <span className="rotulo">Dia</span>
            <SeletorData valor={data} aoMudar={setDataEscolhida} dias={10} maxDias={60} />
          </div>

          <div>
            <span className="rotulo">Horário de chegada</span>
            {!hoje ? (
              <div className="h-24 rounded-2xl bg-slate-100 animate-pulse" />
            ) : horariosDoDia.length === 0 ? (
              <p className="text-sm text-slate-500 bg-slate-50 rounded-xl p-4">Não há mais horários disponíveis hoje. Escolha outro dia.</p>
            ) : (
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2" role="radiogroup" aria-label="Horário de chegada">
                {horariosDoDia.map((h) => (
                  <button
                    key={h}
                    type="button"
                    role="radio"
                    aria-checked={horarioValido === h}
                    onClick={() => setHorario(h)}
                    className={`py-2.5 rounded-xl border text-sm font-bold tabular-nums transition ${
                      horarioValido === h ? 'bg-red-600 border-red-600 text-white shadow-md' : 'bg-white border-slate-200 text-slate-800 hover:border-red-400'
                    }`}
                  >
                    {h}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <span className="rotulo">Número de pessoas</span>
            <div className="inline-flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-2xl p-1">
              <button type="button" onClick={() => setPessoas((p) => Math.max(1, p - 1))} disabled={pessoas <= 1} className="w-11 h-11 rounded-xl hover:bg-white disabled:opacity-30 flex items-center justify-center" aria-label="Menos pessoas">
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-20 text-center flex items-center justify-center gap-1.5 font-display font-black text-2xl tabular-nums" aria-live="polite">
                <Users className="w-4 h-4 text-red-600" /> {pessoas}
              </span>
              <button type="button" onClick={() => setPessoas((p) => Math.min(MAX_PESSOAS, p + 1))} disabled={pessoas >= MAX_PESSOAS} className="w-11 h-11 rounded-xl hover:bg-white disabled:opacity-30 flex items-center justify-center" aria-label="Mais pessoas">
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {pessoas >= 15 && <p className="text-[11px] text-slate-500 mt-1.5">Grupo grande? Um <Link href="/reservas/quiosques" className="font-bold text-red-600 hover:underline">quiosque privado</Link> pode ser mais confortável.</p>}
          </div>
        </section>

        <section className="cartao p-5 sm:p-6 space-y-4">
          <div>
            <h2 className="font-display font-bold uppercase text-xl text-slate-900">2. Pré-pedido <span className="text-slate-500 text-base">(opcional)</span></h2>
            <p className="text-xs text-slate-500">Adiante o que vai querer e encontre tudo encaminhado quando chegar.</p>
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
          <div className="flex justify-between gap-3"><dt className="text-slate-500">Dia</dt><dd className="font-bold text-right">{data ? formatarDataLonga(data) : '—'}</dd></div>
          <div className="flex justify-between gap-3"><dt className="text-slate-500">Chegada</dt><dd className="font-bold">{horarioValido || '—'}</dd></div>
          <div className="flex justify-between gap-3"><dt className="text-slate-500">Pessoas</dt><dd className="font-bold">{pessoas}</dd></div>
        </dl>
        {pedido.linhas.length > 0 && (
          <div className="border-t border-slate-100 pt-3">
            <p className="flex items-center gap-1.5 text-xs font-bold text-slate-600 uppercase mb-2"><ShoppingBag className="w-3.5 h-3.5 text-red-600" /> Pré-pedido</p>
            <ul className="text-xs text-slate-700 space-y-1">{pedido.linhas.map((l) => <li key={l}>{l}</li>)}</ul>
            <p className="flex justify-between font-bold text-sm mt-2"><span>Estimado</span><span className="text-red-600">{formatarMoeda(pedido.total)}</span></p>
          </div>
        )}
        <button type="submit" disabled={enviando || !horarioValido} className="btn-primario w-full !py-3.5 !text-base">
          {enviando ? <><Loader2 className="w-5 h-5 animate-spin" /> Enviando...</> : 'Solicitar mesa'}
        </button>
        <p className="text-[11px] text-slate-500 text-center">O pré-pedido é pago no local. A equipe confirma sua mesa pelo WhatsApp.</p>
      </aside>
    </form>
  );
}
