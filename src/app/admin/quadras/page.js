'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ChevronLeft, ChevronRight, Loader2, Plus, CalendarDays, Clock, CheckCircle2, Gauge } from 'lucide-react';
import { useHoje, useMinutoAtual } from '@/lib/hooks';
import { buscarReservas } from '@/lib/admin';
import { QUADRAS, HORARIOS_QUADRA, ABERTURA_QUADRAS, FECHAMENTO_QUADRAS } from '@/lib/config';
import { formatarDataLonga, horaParaMinutos, intervalosSobrepoem, minutosParaHora, somarDias } from '@/lib/formatadores';
import { useFeedback } from '@/components/feedback';
import { useAdmin } from '@/components/admin/shell';
import { CabecalhoPagina, Indicador } from '@/components/admin/ui';
import ModalReserva from '@/components/admin/modal-reserva';
import ModalNovaReserva from '@/components/admin/nova-reserva';

const ALTURA_HORA = 56; // px por linha da grade
const CORES_STATUS = {
  confirmado: 'bg-emerald-50 border-emerald-300 text-emerald-950 hover:bg-emerald-100',
  pendente: 'bg-amber-50 border-amber-300 text-amber-950 hover:bg-amber-100',
  agendada: 'bg-amber-50 border-amber-300 text-amber-950 hover:bg-amber-100',
  concluido: 'bg-slate-100 border-slate-300 text-slate-600 hover:bg-slate-200',
};

function LerDataDaUrl({ aoLer }) {
  const data = useSearchParams().get('data');
  useEffect(() => {
    if (data && /^\d{4}-\d{2}-\d{2}$/.test(data)) aoLer(data);
  }, [data, aoLer]);
  return null;
}

export default function AdminAgendaQuadrasPage() {
  const hoje = useHoje();
  const minutoAtual = useMinutoAtual();
  const { toast } = useFeedback();
  const { atualizarPendentes } = useAdmin();
  const [dataEscolhida, setDataEscolhida] = useState('');
  const [reservas, setReservas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [selecionada, setSelecionada] = useState(null);
  const [novo, setNovo] = useState(null);
  const [quadraMobile, setQuadraMobile] = useState(QUADRAS[0].nome);

  const data = dataEscolhida || hoje;

  const carregar = useCallback(async () => {
    if (!data) return;
    setCarregando(true);
    const { reservas: lista, erro } = await buscarReservas({ tipos: ['quadras'], de: data, ate: data });
    if (erro) toast('Erro ao carregar agenda: ' + erro.message, 'erro');
    setReservas(lista.filter((r) => r.status !== 'cancelado'));
    setCarregando(false);
  }, [data, toast]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga de dados ao trocar a data
    carregar();
    const id = setInterval(carregar, 60 * 1000);
    return () => clearInterval(id);
  }, [carregar]);

  const aoAtualizar = (nova) => {
    // Cancelada ou remarcada para outro dia: sai da grade deste dia
    const sai = nova.status === 'cancelado' || nova.data_reserva !== data;
    setReservas((lista) => (sai ? lista.filter((r) => r.chave !== nova.chave) : lista.map((r) => (r.chave === nova.chave ? nova : r))));
    atualizarPendentes();
  };

  // Sem horário informado, sugere o primeiro horário livre (e ainda não passado) da quadra
  const primeiroLivre = (quadra) =>
    HORARIOS_QUADRA.find(
      (h) =>
        !(data === hoje && minutoAtual >= 0 && horaParaMinutos(h) <= minutoAtual) &&
        !reservas.some((r) => r.quadra_nome === quadra && intervalosSobrepoem(h, minutosParaHora(horaParaMinutos(h) + 60), r.inicio, r.fim))
    ) || HORARIOS_QUADRA[0];

  const abrirNovo = (quadra = QUADRAS[0].nome, inicio = primeiroLivre(quadra)) =>
    setNovo({ tipo: 'quadras', data_reserva: data, quadra_nome: quadra, inicio });

  const aoCriar = (r) => {
    if (r.data_reserva !== data) setDataEscolhida(r.data_reserva);
    else carregar();
  };

  // Indicadores do dia
  const confirmadas = reservas.filter((r) => r.status === 'confirmado').length;
  const pendentes = reservas.filter((r) => r.status === 'pendente' || r.status === 'agendada').length;
  const horasReservadas = reservas.reduce((acc, r) => acc + (horaParaMinutos(r.fim) - horaParaMinutos(r.inicio)) / 60, 0);
  const horasTotais = QUADRAS.length * HORARIOS_QUADRA.length;

  const linhaDe = (hora) => Math.floor(horaParaMinutos(hora) / 60) - ABERTURA_QUADRAS + 1;
  const minutosAgoraNaGrade = data === hoje && minutoAtual >= ABERTURA_QUADRAS * 60 && minutoAtual < FECHAMENTO_QUADRAS * 60 ? minutoAtual - ABERTURA_QUADRAS * 60 : null;

  const colunaQuadra = (quadra) => {
    const daQuadra = reservas.filter((r) => r.quadra_nome === quadra.nome);
    const ocupada = (hora) => daQuadra.some((r) => intervalosSobrepoem(hora, minutosParaHora(horaParaMinutos(hora) + 60), r.inicio, r.fim));
    return (
      <div className="relative grid" style={{ gridTemplateRows: `repeat(${HORARIOS_QUADRA.length}, ${ALTURA_HORA}px)` }}>
        {HORARIOS_QUADRA.map((hora, i) =>
          ocupada(hora) ? null : (
            <button
              key={hora}
              onClick={() => abrirNovo(quadra.nome, hora)}
              style={{ gridRow: i + 1 }}
              className="group m-0.5 rounded-lg border border-dashed border-transparent hover:border-red-300 hover:bg-red-50/60 flex items-center justify-center text-[11px] font-bold text-transparent hover:text-red-600 transition"
              aria-label={`Agendar ${quadra.curto} às ${hora}`}
            >
              <Plus className="w-3.5 h-3.5" /> {hora}
            </button>
          )
        )}
        {daQuadra.map((r) => {
          const inicioLinha = Math.max(1, linhaDe(r.inicio));
          const fimLinha = Math.min(HORARIOS_QUADRA.length + 1, Math.ceil(horaParaMinutos(r.fim) / 60) - ABERTURA_QUADRAS + 1);
          return (
            <button
              key={r.chave}
              onClick={() => setSelecionada(r)}
              style={{ gridRow: `${inicioLinha} / ${Math.max(inicioLinha + 1, fimLinha)}` }}
              className={`m-0.5 rounded-xl border-l-4 border p-2 text-left overflow-hidden transition ${CORES_STATUS[r.status] || CORES_STATUS.pendente}`}
            >
              <span className="block text-xs font-black truncate">{r.nome}</span>
              <span className="block text-[11px] opacity-80 tabular-nums">{r.inicio}–{r.fim}</span>
              {r.observacoes && <span className="block text-[10px] opacity-70 truncate mt-0.5">📝 {r.observacoes}</span>}
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <>
      <Suspense fallback={null}>
        <LerDataDaUrl aoLer={setDataEscolhida} />
      </Suspense>

      <CabecalhoPagina titulo="Agenda de quadras" descricao={data ? formatarDataLonga(data) : ' '}>
        <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1">
          <button onClick={() => setDataEscolhida(somarDias(data, -1))} disabled={!data} className="p-2 rounded-lg hover:bg-slate-100" aria-label="Dia anterior">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={() => setDataEscolhida(hoje)} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${data === hoje ? 'bg-slate-900 text-white' : 'hover:bg-slate-100'}`}>
            Hoje
          </button>
          <button onClick={() => setDataEscolhida(somarDias(data, 1))} disabled={!data} className="p-2 rounded-lg hover:bg-slate-100" aria-label="Próximo dia">
            <ChevronRight className="w-4 h-4" />
          </button>
          <label className="relative p-2 rounded-lg hover:bg-slate-100 cursor-pointer" aria-label="Escolher data">
            <CalendarDays className="w-4 h-4" />
            <input type="date" value={data} onChange={(e) => e.target.value && setDataEscolhida(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer" />
          </label>
        </div>
        <button onClick={() => abrirNovo(quadraMobile)} disabled={!data} className="btn-primario">
          <Plus className="w-4 h-4" /> Agendar no balcão
        </button>
      </CabecalhoPagina>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <Indicador rotulo="Confirmadas" valor={confirmadas} icone={CheckCircle2} tom="emerald" />
        <Indicador rotulo="Pendentes" valor={pendentes} icone={Clock} tom="amber" />
        <Indicador rotulo="Ocupação" valor={`${Math.round((horasReservadas / horasTotais) * 100)}%`} detalhe={`${horasReservadas}h de ${horasTotais}h`} icone={Gauge} tom="red" />
      </div>

      {/* Seletor de quadra no celular */}
      <div className="md:hidden flex gap-2 overflow-x-auto">
        {QUADRAS.map((q) => (
          <button
            key={q.id}
            onClick={() => setQuadraMobile(q.nome)}
            className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap border ${quadraMobile === q.nome ? 'bg-slate-900 text-white border-slate-900' : 'bg-white border-slate-200 text-slate-600'}`}
          >
            {q.curto}
          </button>
        ))}
      </div>

      <section className="cartao overflow-hidden relative">
        {carregando && (
          <div className="absolute inset-0 bg-white/60 z-10 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        )}

        {/* Cabeçalho das colunas */}
        <div className="grid grid-cols-[56px_1fr] md:grid-cols-[56px_repeat(3,1fr)] border-b border-slate-200 bg-slate-50 sticky top-0 z-[5]">
          <div />
          {QUADRAS.map((q) => (
            <div key={q.id} className={`px-3 py-3 border-l border-slate-200 ${quadraMobile === q.nome ? '' : 'hidden md:block'}`}>
              <p className="font-display font-black uppercase text-slate-900">{q.curto}</p>
              <p className="text-[11px] text-slate-500 truncate">{q.esportes}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-[56px_1fr] md:grid-cols-[56px_repeat(3,1fr)] relative">
          {/* Linhas de hora */}
          <div className="grid" style={{ gridTemplateRows: `repeat(${HORARIOS_QUADRA.length}, ${ALTURA_HORA}px)` }}>
            {HORARIOS_QUADRA.map((h) => (
              <div key={h} className="text-[11px] font-bold text-slate-400 text-right pr-2 pt-1 tabular-nums border-t border-slate-100">{h}</div>
            ))}
          </div>
          {QUADRAS.map((q) => (
            <div
              key={q.id}
              className={`border-l border-slate-200 ${quadraMobile === q.nome ? '' : 'hidden md:block'}`}
              style={{ backgroundImage: `repeating-linear-gradient(to bottom, transparent 0, transparent ${ALTURA_HORA - 1}px, rgb(241 245 249) ${ALTURA_HORA - 1}px, rgb(241 245 249) ${ALTURA_HORA}px)` }}
            >
              {colunaQuadra(q)}
            </div>
          ))}

          {minutosAgoraNaGrade !== null && (
            <div className="absolute left-14 right-0 h-0.5 bg-red-500 pointer-events-none z-[4]" style={{ top: (minutosAgoraNaGrade / 60) * ALTURA_HORA }}>
              <span className="absolute -left-1.5 -top-1 w-2.5 h-2.5 rounded-full bg-red-500" />
            </div>
          )}
        </div>
      </section>

      <div className="flex flex-wrap gap-4 text-xs font-semibold text-slate-500">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-100 border border-emerald-300" /> Confirmado</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-amber-100 border border-amber-300" /> Pendente</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-slate-100 border border-slate-300" /> Concluído</span>
        <span>Clique em um horário vazio para agendar.</span>
      </div>

      {selecionada && <ModalReserva key={selecionada.chave} reserva={selecionada} aoFechar={() => setSelecionada(null)} aoAtualizar={aoAtualizar} />}

      {novo && <ModalNovaReserva inicial={novo} tipoFixo aoFechar={() => setNovo(null)} aoCriar={aoCriar} />}
    </>
  );
}
