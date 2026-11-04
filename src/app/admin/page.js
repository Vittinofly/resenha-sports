'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, ArrowRight, CalendarCheck, CheckCircle2, Clock, Copy, Gauge, Loader2, MessageCircle, Megaphone, RefreshCw } from 'lucide-react';
import { useHoje } from '@/lib/hooks';
import { buscarReservas, atualizarReserva } from '@/lib/admin';
import { QUADRAS, HORARIOS_QUADRA, STATUS_ATIVOS, NEGOCIO } from '@/lib/config';
import { MODELOS_MENSAGEM } from '@/lib/reservas';
import { formatarDataLonga, horaParaMinutos, linkWhatsApp, rotuloDia, somarDias } from '@/lib/formatadores';
import { useFeedback } from '@/components/feedback';
import { useAdmin } from '@/components/admin/shell';
import { BadgeStatus, CabecalhoPagina, IconeTipo, Indicador, Vazio } from '@/components/admin/ui';
import ModalReserva from '@/components/admin/modal-reserva';
import ModalNovaReserva from '@/components/admin/nova-reserva';

const LINKS_DIVULGACAO = [
  { rotulo: 'Reservar quadra', caminho: '/reservas/quadras' },
  { rotulo: 'Reservar mesa', caminho: '/reservas/mesas' },
  { rotulo: 'Quiosques para eventos', caminho: '/reservas/quiosques' },
  { rotulo: 'Cardápio digital', caminho: '/cardapio' },
];

export default function AdminVisaoGeralPage() {
  const hoje = useHoje();
  const { toast } = useFeedback();
  const { atualizarPendentes } = useAdmin();
  const [reservas, setReservas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [selecionada, setSelecionada] = useState(null);
  const [confirmando, setConfirmando] = useState(null);
  const [novo, setNovo] = useState(null);

  const carregar = useCallback(async () => {
    if (!hoje) return;
    setCarregando(true);
    const { reservas: lista, erro } = await buscarReservas({ de: somarDias(hoje, -14), ate: somarDias(hoje, 30) });
    if (erro) toast('Erro ao carregar reservas: ' + erro.message, 'erro');
    setReservas(lista);
    setCarregando(false);
  }, [hoje, toast]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga inicial de dados
    carregar();
  }, [carregar]);

  const aoAtualizar = (nova) => {
    setReservas((lista) => lista.map((r) => (r.chave === nova.chave ? nova : r)));
    atualizarPendentes();
  };

  const confirmarRapido = async (r) => {
    // A aba é aberta ainda no clique: depois de um `await`, navegadores (Safari
    // principalmente) tratam window.open como pop-up e bloqueiam.
    const janela = window.open('', '_blank');
    if (janela) janela.opener = null;
    setConfirmando(r.chave);
    const { error } = await atualizarReserva(r, { status: 'confirmado' });
    setConfirmando(null);
    if (error) {
      janela?.close();
      return toast('Erro ao confirmar: ' + error.message, 'erro');
    }
    aoAtualizar({ ...r, status: 'confirmado' });
    toast(`Reserva de ${r.nome} confirmada.`);
    const url = linkWhatsApp(r.cliente_whatsapp, MODELOS_MENSAGEM.confirmacao.texto({ ...r, status: 'confirmado' }));
    if (janela) janela.location.href = url;
    else window.open(url, '_blank', 'noopener');
  };

  const copiar = async (texto) => {
    try {
      await navigator.clipboard.writeText(texto);
      toast('Link copiado!');
    } catch {
      toast('Não foi possível copiar. Selecione e copie manualmente.', 'erro');
    }
  };

  const ativas = reservas.filter((r) => STATUS_ATIVOS.includes(r.status));
  const pendentes = ativas.filter((r) => r.status === 'pendente' || r.status === 'agendada');
  const pendentesFuturas = pendentes.filter((r) => r.data_reserva >= hoje);
  const pendentesAtrasadas = pendentes.filter((r) => r.data_reserva < hoje);
  const deHoje = ativas.filter((r) => r.data_reserva === hoje);

  // Ocupação das quadras hoje (horas reservadas / horas disponíveis)
  const horasTotais = QUADRAS.length * HORARIOS_QUADRA.length;
  const horasReservadas = deHoje
    .filter((r) => r.tipo === 'quadras')
    .reduce((acc, r) => acc + Math.max(0, (horaParaMinutos(r.fim) - horaParaMinutos(r.inicio)) / 60), 0);
  const ocupacao = horasTotais ? Math.round((horasReservadas / horasTotais) * 100) : 0;

  const proximos7 = hoje
    ? Array.from({ length: 7 }, (_, i) => {
        const data = somarDias(hoje, i);
        const doDia = ativas.filter((r) => r.data_reserva === data);
        return { data, total: doDia.length, quadras: doDia.filter((r) => r.tipo === 'quadras').length };
      })
    : [];
  const maxDia = Math.max(1, ...proximos7.map((d) => d.total));
  const totalSemana = proximos7.reduce((a, d) => a + d.total, 0);

  return (
    <>
      <CabecalhoPagina titulo="Visão geral" descricao={hoje ? `Hoje é ${formatarDataLonga(hoje)}.` : ' '}>
        <button onClick={carregar} disabled={carregando} className="btn-secundario">
          <RefreshCw className={`w-4 h-4 ${carregando ? 'animate-spin' : ''}`} /> Atualizar
        </button>
        <button onClick={() => setNovo({ tipo: 'quadras', data_reserva: hoje })} disabled={!hoje} className="btn-primario">
          <CalendarCheck className="w-4 h-4" /> Agendar no balcão
        </button>
      </CabecalhoPagina>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <Indicador rotulo="Aguardando confirmação" valor={carregando ? '–' : pendentesFuturas.length} detalhe={pendentesAtrasadas.length ? `+${pendentesAtrasadas.length} de datas passadas` : 'Responda rápido para não perder clientes'} icone={AlertCircle} tom="amber" />
        <Indicador rotulo="Reservas hoje" valor={carregando ? '–' : deHoje.length} detalhe={`${deHoje.filter((r) => r.status === 'confirmado').length} confirmadas`} icone={CheckCircle2} tom="emerald" />
        <Indicador rotulo="Ocupação das quadras" valor={carregando ? '–' : `${ocupacao}%`} detalhe={`${horasReservadas}h de ${horasTotais}h hoje`} icone={Gauge} tom="red" />
        <Indicador rotulo="Próximos 7 dias" valor={carregando ? '–' : totalSemana} detalhe="reservas ativas" icone={CalendarCheck} />
      </div>

      <div className="grid xl:grid-cols-[1.4fr_1fr] gap-6 items-start">
        {/* PENDÊNCIAS */}
        <section className="cartao">
          <header className="flex items-center justify-between gap-3 px-5 pt-5 pb-3">
            <h2 className="font-display font-bold uppercase text-xl text-slate-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-500" /> Precisa de atenção
            </h2>
            <Link href="/admin/reservas?status=pendente" className="text-xs font-bold text-red-600 hover:underline flex items-center gap-1">
              Ver todas <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </header>
          {carregando ? (
            <div className="p-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
          ) : pendentesFuturas.length === 0 ? (
            <Vazio icone={CheckCircle2} titulo="Tudo em dia!">Nenhuma solicitação aguardando confirmação.</Vazio>
          ) : (
            <ul className="divide-y divide-slate-100">
              {pendentesFuturas.slice(0, 8).map((r) => (
                <li key={r.chave} className="px-5 py-3 flex flex-col sm:flex-row sm:items-center gap-3">
                  <button onClick={() => setSelecionada(r)} className="flex items-center gap-3 flex-1 min-w-0 text-left group">
                    <span className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                      <IconeTipo tipo={r.tipo} />
                    </span>
                    <span className="min-w-0">
                      <span className="block font-bold text-slate-900 truncate group-hover:text-red-600">{r.nome}</span>
                      <span className="block text-xs text-slate-500 truncate">
                        {rotuloDia(r.data_reserva, hoje)}{r.inicio && ` · ${r.inicio}`} · {r.local}
                      </span>
                    </span>
                  </button>
                  <div className="flex gap-2 shrink-0">
                    <a href={linkWhatsApp(r.cliente_whatsapp, MODELOS_MENSAGEM.lembrete.texto(r))} target="_blank" rel="noreferrer" className="btn-secundario !py-1.5 !px-3 !text-xs" aria-label={`WhatsApp de ${r.nome}`}>
                      <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                    </a>
                    <button onClick={() => confirmarRapido(r)} disabled={confirmando === r.chave} className="btn-escuro !py-1.5 !px-3 !text-xs">
                      {confirmando === r.chave ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />} Confirmar
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* AGENDA DE HOJE */}
        <section className="cartao">
          <header className="px-5 pt-5 pb-3">
            <h2 className="font-display font-bold uppercase text-xl text-slate-900">Agenda de hoje</h2>
          </header>
          {carregando ? (
            <div className="p-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
          ) : deHoje.length === 0 ? (
            <Vazio icone={CalendarCheck} titulo="Nenhuma reserva para hoje" />
          ) : (
            <ol className="px-5 pb-5 space-y-2">
              {deHoje.map((r) => (
                <li key={r.chave}>
                  <button onClick={() => setSelecionada(r)} className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 text-left">
                    <span className="w-12 font-display font-black text-lg text-slate-900 tabular-nums">{r.inicio || '—'}</span>
                    <IconeTipo tipo={r.tipo} className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm font-bold text-slate-900 truncate">{r.nome}</span>
                      <span className="block text-xs text-slate-500 truncate">{r.local}</span>
                    </span>
                    <BadgeStatus status={r.status} />
                  </button>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>

      <div className="grid xl:grid-cols-2 gap-6 items-start">
        {/* PRÓXIMOS 7 DIAS */}
        <section className="cartao p-5">
          <h2 className="font-display font-bold uppercase text-xl text-slate-900">Próximos 7 dias</h2>
          <p className="text-xs text-slate-500 mb-4">Reservas ativas por dia (quadras, mesas e quiosques).</p>
          <ul className="space-y-2.5">
            {proximos7.map((d) => (
              <li key={d.data} className="grid grid-cols-[88px_1fr_32px] items-center gap-3 text-sm">
                <Link href={`/admin/quadras?data=${d.data}`} className="font-semibold text-slate-700 hover:text-red-600 truncate">
                  {rotuloDia(d.data, hoje)}
                </Link>
                <div className="h-3 rounded-full bg-slate-100 overflow-hidden" title={`${d.total} reservas (${d.quadras} de quadra)`}>
                  <div className="h-full rounded-full bg-red-600 transition-all" style={{ width: `${(d.total / maxDia) * 100}%` }} />
                </div>
                <span className="text-right font-bold tabular-nums text-slate-900">{d.total}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* DIVULGAÇÃO */}
        <section className="cartao p-5">
          <h2 className="font-display font-bold uppercase text-xl text-slate-900 flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-red-600" /> Divulgue e traga clientes
          </h2>
          <p className="text-xs text-slate-500 mb-4">Cole esses links na bio do Instagram, no status do WhatsApp e no Google Meu Negócio.</p>
          <ul className="space-y-2">
            {LINKS_DIVULGACAO.map(({ rotulo, caminho }) => {
              const url = `${NEGOCIO.siteUrl}${caminho}`;
              return (
                <li key={caminho} className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl pl-3 pr-1.5 py-1.5">
                  <span className="flex-1 min-w-0">
                    <span className="block text-xs font-bold text-slate-800">{rotulo}</span>
                    <span className="block text-[11px] text-slate-500 truncate">{url}</span>
                  </span>
                  <button onClick={() => copiar(url)} className="btn-secundario !py-1.5 !px-2.5 !text-xs" aria-label={`Copiar link: ${rotulo}`}>
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(`Bora pro ${NEGOCIO.nomeCurto}? ${rotulo} online: ${url}`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-secundario !py-1.5 !px-2.5 !text-xs"
                    aria-label={`Compartilhar no WhatsApp: ${rotulo}`}
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                  </a>
                </li>
              );
            })}
          </ul>
          <Link href="/admin/clientes" className="mt-4 text-xs font-bold text-red-600 hover:underline inline-flex items-center gap-1">
            Reativar clientes que sumiram <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </section>
      </div>

      {selecionada && <ModalReserva key={selecionada.chave} reserva={selecionada} aoFechar={() => setSelecionada(null)} aoAtualizar={aoAtualizar} />}
      {novo && <ModalNovaReserva inicial={novo} aoFechar={() => setNovo(null)} aoCriar={() => carregar()} />}
    </>
  );
}
