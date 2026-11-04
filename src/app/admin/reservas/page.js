'use client';

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, Download, Flag, Inbox, Loader2, MessageCircle, RefreshCw, Search, ShoppingBag, StickyNote, Users, X } from 'lucide-react';
import { useHoje } from '@/lib/hooks';
import { buscarReservas, atualizarReserva, baixarCSV } from '@/lib/admin';
import { STATUS, STATUS_ATIVOS } from '@/lib/config';
import { MODELOS_MENSAGEM, TIPOS_RESERVA } from '@/lib/reservas';
import { formatarData, formatarDataLonga, formatarTelefone, linkWhatsApp, rotuloDia, somarDias } from '@/lib/formatadores';
import { normalizarBusca } from '@/lib/cardapio';
import { useFeedback } from '@/components/feedback';
import { useAdmin } from '@/components/admin/shell';
import { BadgeStatus, CabecalhoPagina, IconeTipo, Segmentado, Vazio } from '@/components/admin/ui';
import ModalReserva from '@/components/admin/modal-reserva';

const PERIODOS = {
  proximos: { label: 'Próximos 30 dias', intervalo: (h) => [h, somarDias(h, 30)] },
  hoje: { label: 'Hoje', intervalo: (h) => [h, h] },
  semana: { label: 'Próximos 7 dias', intervalo: (h) => [h, somarDias(h, 7)] },
  passados: { label: 'Últimos 30 dias', intervalo: (h) => [somarDias(h, -30), somarDias(h, -1)] },
  tudo: { label: 'Todo o período', intervalo: () => [null, null] },
};

const FILTROS_STATUS = [
  { valor: 'ativas', label: 'Ativas', testa: (s) => STATUS_ATIVOS.includes(s) },
  { valor: 'pendente', label: 'Pendentes', testa: (s) => s === 'pendente' || s === 'agendada' },
  { valor: 'confirmado', label: 'Confirmadas', testa: (s) => s === 'confirmado' },
  { valor: 'concluido', label: 'Concluídas', testa: (s) => s === 'concluido' },
  { valor: 'cancelado', label: 'Canceladas', testa: (s) => s === 'cancelado' },
  { valor: 'todas', label: 'Todas', testa: () => true },
];

function LerFiltrosDaUrl({ aoLer }) {
  const status = useSearchParams().get('status');
  useEffect(() => {
    if (status && FILTROS_STATUS.some((f) => f.valor === status)) aoLer(status);
  }, [status, aoLer]);
  return null;
}

export default function AdminReservasPage() {
  const hoje = useHoje();
  const { toast, confirmar } = useFeedback();
  const { atualizarPendentes, pendentes: pendentesGlobais } = useAdmin();

  const [periodo, setPeriodo] = useState('proximos');
  const [tipo, setTipo] = useState('todas');
  const [filtroStatus, setFiltroStatus] = useState('ativas');
  const [busca, setBusca] = useState('');
  const [reservas, setReservas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [selecionada, setSelecionada] = useState(null);
  const [processando, setProcessando] = useState(null);

  const carregar = useCallback(async () => {
    if (!hoje) return;
    setCarregando(true);
    const [de, ate] = PERIODOS[periodo].intervalo(hoje);
    const { reservas: lista, erro } = await buscarReservas({ de, ate });
    if (erro) toast('Erro ao carregar reservas: ' + erro.message, 'erro');
    setReservas(periodo === 'passados' ? lista.reverse() : lista);
    setCarregando(false);
  }, [hoje, periodo, toast]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga de dados ao trocar filtros
    carregar();
  }, [carregar]);

  // Recarrega quando chegam novas solicitações (contador global do shell aumentou)
  const pendentesVistos = useRef(pendentesGlobais);
  useEffect(() => {
    if (pendentesGlobais > pendentesVistos.current) carregar();
    pendentesVistos.current = pendentesGlobais;
  }, [pendentesGlobais, carregar]);

  const aoAtualizar = (nova) => {
    setReservas((lista) => lista.map((r) => (r.chave === nova.chave ? nova : r)));
    atualizarPendentes();
  };

  const mudarStatus = async (r, status) => {
    setProcessando(r.chave);
    const { error } = await atualizarReserva(r, { status });
    setProcessando(null);
    if (error) return toast('Erro: ' + error.message, 'erro');
    aoAtualizar({ ...r, status });
    toast(`${r.nome}: ${STATUS[status].label.toLowerCase()}.`);
  };

  const termo = normalizarBusca(busca);
  const testeStatus = FILTROS_STATUS.find((f) => f.valor === filtroStatus).testa;
  const filtradas = useMemo(
    () =>
      reservas.filter(
        (r) =>
          (tipo === 'todas' || r.tipo === tipo) &&
          testeStatus(r.status) &&
          (!termo || normalizarBusca(r.nome).includes(termo) || r.cliente_whatsapp?.includes(termo.replace(/\D/g, '') || '#') || normalizarBusca(r.local).includes(termo))
      ),
    [reservas, tipo, testeStatus, termo]
  );

  const porDia = useMemo(() => {
    const grupos = new Map();
    for (const r of filtradas) {
      if (!grupos.has(r.data_reserva)) grupos.set(r.data_reserva, []);
      grupos.get(r.data_reserva).push(r);
    }
    return [...grupos.entries()];
  }, [filtradas]);

  const contagemTipo = (t) => reservas.filter((r) => (t === 'todas' || r.tipo === t) && (r.status === 'pendente' || r.status === 'agendada')).length;

  // Reservas confirmadas de dias que já passaram ainda aparecem como "ativas"
  const antigasAbertas = reservas.filter((r) => r.data_reserva < hoje && r.status === 'confirmado');

  const concluirAntigas = async () => {
    const ok = await confirmar({
      titulo: 'Concluir reservas antigas?',
      mensagem: `${antigasAbertas.length} reserva(s) confirmada(s) de dias anteriores serão marcadas como concluídas.`,
      textoConfirmar: 'Concluir todas',
    });
    if (!ok) return;
    setProcessando('lote');
    const resultados = await Promise.all(antigasAbertas.map((r) => atualizarReserva(r, { status: 'concluido' })));
    setProcessando(null);
    const falhas = resultados.filter((r) => r.error).length;
    toast(falhas ? `${falhas} não puderam ser atualizadas.` : 'Reservas antigas concluídas.', falhas ? 'erro' : 'sucesso');
    carregar();
  };

  const exportar = () => {
    baixarCSV(
      `reservas-${hoje}.csv`,
      ['Tipo', 'Data', 'Início', 'Fim', 'Local', 'Cliente', 'WhatsApp', 'Pessoas', 'Status', 'Pré-pedido', 'Observações'],
      filtradas.map((r) => [
        TIPOS_RESERVA[r.tipo].label,
        formatarData(r.data_reserva),
        r.inicio,
        r.fim,
        r.local,
        r.nome,
        formatarTelefone(r.cliente_whatsapp),
        r.pessoas || '',
        STATUS[r.status]?.label || r.status,
        r.itens.join(', '),
        r.observacoes || '',
      ])
    );
  };

  return (
    <>
      <Suspense fallback={null}>
        <LerFiltrosDaUrl aoLer={setFiltroStatus} />
      </Suspense>

      <CabecalhoPagina titulo="Reservas" descricao="Quadras, mesas e quiosques em um só lugar.">
        <button onClick={carregar} disabled={carregando} className="btn-secundario">
          <RefreshCw className={`w-4 h-4 ${carregando ? 'animate-spin' : ''}`} /> Atualizar
        </button>
        <button onClick={exportar} disabled={!filtradas.length} className="btn-secundario">
          <Download className="w-4 h-4" /> Exportar CSV
        </button>
      </CabecalhoPagina>

      {/* FILTROS */}
      <div className="cartao p-4 space-y-3">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input type="search" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por nome, telefone ou local..." className="input pl-10" aria-label="Buscar reservas" />
            {busca && (
              <button onClick={() => setBusca('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" aria-label="Limpar busca"><X className="w-4 h-4" /></button>
            )}
          </div>
          <select value={periodo} onChange={(e) => setPeriodo(e.target.value)} className="input lg:w-56" aria-label="Período">
            {Object.entries(PERIODOS).map(([k, p]) => <option key={k} value={k}>{p.label}</option>)}
          </select>
        </div>
        <div className="flex flex-col xl:flex-row gap-3 xl:items-center justify-between">
          <Segmentado
            rotulo="Tipo"
            valor={tipo}
            aoMudar={setTipo}
            opcoes={[{ valor: 'todas', label: 'Todas' }, ...Object.entries(TIPOS_RESERVA).map(([k, t]) => ({ valor: k, label: t.plural }))].map((o) => ({ ...o, contagem: contagemTipo(o.valor) }))}
          />
          <Segmentado rotulo="Status" valor={filtroStatus} aoMudar={setFiltroStatus} opcoes={FILTROS_STATUS} />
        </div>
      </div>

      {antigasAbertas.length > 0 && periodo !== 'proximos' && periodo !== 'hoje' && periodo !== 'semana' && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-900">
          <span><strong>{antigasAbertas.length}</strong> reserva(s) confirmada(s) de dias anteriores ainda estão abertas.</span>
          <button onClick={concluirAntigas} disabled={processando === 'lote'} className="btn-escuro !py-2 !text-xs">
            {processando === 'lote' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Flag className="w-3.5 h-3.5" />} Concluir todas
          </button>
        </div>
      )}

      {/* LISTA */}
      {carregando && reservas.length === 0 ? (
        <div className="cartao p-12 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
      ) : filtradas.length === 0 ? (
        <div className="cartao">
          <Vazio icone={Inbox} titulo="Nenhuma reserva encontrada">Ajuste os filtros ou o período.</Vazio>
        </div>
      ) : (
        <div className="space-y-5">
          <p className="text-xs font-semibold text-slate-500">{filtradas.length} reserva(s)</p>
          {porDia.map(([data, lista]) => (
            <section key={data}>
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-2">
                <span className={data === hoje ? 'text-red-600' : ''}>{rotuloDia(data, hoje)}</span>
                <span className="font-semibold normal-case tracking-normal text-slate-400">{formatarDataLonga(data)}</span>
              </h2>
              <ul className="cartao divide-y divide-slate-100 overflow-hidden">
                {lista.map((r) => (
                  <li key={r.chave} className="p-4 flex flex-col md:flex-row md:items-center gap-3 hover:bg-slate-50/60">
                    <button onClick={() => setSelecionada(r)} className="flex items-start gap-3 flex-1 min-w-0 text-left group">
                      <span className="w-14 shrink-0 text-center">
                        <span className="block font-display font-black text-xl text-slate-900 tabular-nums leading-none">{r.inicio || '—'}</span>
                        {r.fim && r.tipo === 'quadras' && <span className="block text-[10px] text-slate-400 tabular-nums">até {r.fim}</span>}
                      </span>
                      <span className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                        <IconeTipo tipo={r.tipo} />
                      </span>
                      <span className="min-w-0">
                        <span className="block font-bold text-slate-900 truncate group-hover:text-red-600">{r.nome}</span>
                        <span className="block text-xs text-slate-500 truncate">
                          {r.local}{r.evento && ` · ${r.evento}`} · {formatarTelefone(r.cliente_whatsapp)}
                        </span>
                        <span className="flex flex-wrap gap-2 mt-1 text-[11px] text-slate-500">
                          {r.pessoas && <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {r.pessoas}</span>}
                          {r.itens.length > 0 && <span className="flex items-center gap-1 text-red-600 font-semibold"><ShoppingBag className="w-3 h-3" /> {r.itens.length} item(ns) no pré-pedido</span>}
                          {r.observacoes && <span className="flex items-center gap-1 truncate max-w-xs"><StickyNote className="w-3 h-3" /> {r.observacoes}</span>}
                        </span>
                      </span>
                    </button>

                    <div className="flex items-center gap-2 md:shrink-0 pl-[5.75rem] md:pl-0">
                      <BadgeStatus status={r.status} />
                      <a
                        href={linkWhatsApp(r.cliente_whatsapp, (r.status === 'confirmado' ? MODELOS_MENSAGEM.confirmacao : MODELOS_MENSAGEM.lembrete).texto(r))}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                        aria-label={`WhatsApp de ${r.nome}`}
                      >
                        <MessageCircle className="w-4 h-4" />
                      </a>
                      {(r.status === 'pendente' || r.status === 'agendada') && (
                        <button onClick={() => mudarStatus(r, 'confirmado')} disabled={processando === r.chave} className="btn-escuro !py-1.5 !px-3 !text-xs">
                          {processando === r.chave ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />} Confirmar
                        </button>
                      )}
                      {r.status === 'confirmado' && r.data_reserva <= hoje && (
                        <button onClick={() => mudarStatus(r, 'concluido')} disabled={processando === r.chave} className="btn-secundario !py-1.5 !px-3 !text-xs">
                          <Flag className="w-3.5 h-3.5" /> Concluir
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      {selecionada && <ModalReserva key={selecionada.chave} reserva={selecionada} aoFechar={() => setSelecionada(null)} aoAtualizar={aoAtualizar} />}
    </>
  );
}
