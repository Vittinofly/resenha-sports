'use client';

import { QUADRAS, QUIOSQUES, HORARIOS_QUADRA, HORARIOS_RESTAURANTE, DURACOES, FECHAMENTO_QUADRAS, TIPOS_EVENTO } from '@/lib/config';
import { montarDetalhes, parseDetalhes } from '@/lib/reservas';
import { horaParaMinutos, minutosParaHora } from '@/lib/formatadores';

// Campos de "quando e onde" de uma reserva, por tipo. Usados no agendamento de
// balcão (nova reserva) e para remarcar uma reserva existente.

const PERMANENCIA_MESA_MIN = 120;

// Valores do formulário a partir de uma reserva normalizada (remarcar) ou de padrões (nova).
export function valoresAgenda(tipo, { reserva, data_reserva, quadra_nome, inicio } = {}) {
  if (reserva) {
    const duracao = Math.max(1, Math.round((horaParaMinutos(reserva.fim) - horaParaMinutos(reserva.inicio)) / 60));
    return {
      data_reserva: reserva.data_reserva,
      quadra_nome: reserva.quadra_nome || QUADRAS[0].nome,
      inicio: reserva.inicio || (tipo === 'mesas' ? '19:00' : HORARIOS_QUADRA[0]),
      duracao: reserva.fim ? duracao : 1,
      pessoas: String(reserva.pessoas || ''),
      quiosque_nome: tipo === 'quiosques' ? reserva.local : QUIOSQUES[0].nome,
      evento: reserva.evento || TIPOS_EVENTO[0],
    };
  }
  return {
    data_reserva: data_reserva || '',
    quadra_nome: quadra_nome || QUADRAS[0].nome,
    inicio: inicio || (tipo === 'mesas' ? '19:00' : HORARIOS_QUADRA[0]),
    duracao: 1,
    pessoas: tipo === 'quiosques' ? '20' : '2',
    quiosque_nome: QUIOSQUES[0].nome,
    evento: TIPOS_EVENTO[0],
  };
}

// Converte os valores do formulário em colunas do banco. Retorna { campos } ou { erro }.
// `original` (reserva sendo remarcada) preserva o pré-pedido guardado em tipo_evento.
export function prepararAgenda(tipo, v, original = null) {
  if (!v.data_reserva) return { erro: 'Informe a data.' };
  const pedido = original?.itens?.join(', ') || '';

  if (tipo === 'quadras') {
    const fim = horaParaMinutos(v.inicio) + v.duracao * 60;
    if (fim > FECHAMENTO_QUADRAS * 60) return { erro: `O término não pode passar das ${FECHAMENTO_QUADRAS}:00.` };
    return { campos: { data_reserva: v.data_reserva, quadra_nome: v.quadra_nome, horario_inicio: v.inicio, horario_fim: minutosParaHora(fim) } };
  }

  const pessoas = Number(v.pessoas) || 0;
  if (pessoas < 1) return { erro: 'Informe o número de pessoas.' };

  if (tipo === 'mesas') {
    const local = (original && parseDetalhes(original.tipo_evento).local) || 'Mesa Restaurante';
    return {
      campos: {
        data_reserva: v.data_reserva,
        horario_inicio: v.inicio,
        horario_fim: minutosParaHora(horaParaMinutos(v.inicio) + PERMANENCIA_MESA_MIN),
        num_pessoas: pessoas,
        tipo_evento: montarDetalhes(`Reserva para ${pessoas} pessoas`, local, pedido),
      },
    };
  }

  return {
    campos: {
      data_reserva: v.data_reserva,
      num_convidados: pessoas,
      tipo_evento: montarDetalhes(v.evento || 'Evento', v.quiosque_nome, pedido),
    },
  };
}

// Garante que o valor atual apareça no <select> mesmo fora da lista padrão
const comAtual = (lista, atual) => (atual && !lista.includes(atual) ? [...lista, atual].sort() : lista);

export default function CamposAgenda({ tipo, valores, aoMudar, comEvento = true, idPrefixo = 'ag' }) {
  const mudar = (campo) => (e) => aoMudar({ ...valores, [campo]: campo === 'duracao' ? Number(e.target.value) : e.target.value });
  const id = (campo) => `${idPrefixo}-${campo}`;
  const quiosque = QUIOSQUES.find((q) => q.nome === valores.quiosque_nome);
  const acimaCapacidade = tipo === 'quiosques' && quiosque && Number(valores.pessoas) > quiosque.capacidade;

  return (
    <div className="grid grid-cols-2 gap-3">
      {tipo === 'quadras' && (
        <div className="col-span-2">
          <label htmlFor={id('quadra')} className="rotulo">Quadra</label>
          <select id={id('quadra')} value={valores.quadra_nome} onChange={mudar('quadra_nome')} className="input">
            {comAtual(QUADRAS.map((q) => q.nome), valores.quadra_nome).map((nome) => {
              const q = QUADRAS.find((x) => x.nome === nome);
              return <option key={nome} value={nome}>{q ? `${q.curto} — ${q.esportes}` : nome}</option>;
            })}
          </select>
        </div>
      )}

      {tipo === 'quiosques' && (
        <div className="col-span-2">
          <label htmlFor={id('quiosque')} className="rotulo">Quiosque</label>
          <select id={id('quiosque')} value={valores.quiosque_nome} onChange={mudar('quiosque_nome')} className="input">
            {comAtual(QUIOSQUES.map((q) => q.nome), valores.quiosque_nome).map((nome) => <option key={nome} value={nome}>{nome}</option>)}
          </select>
        </div>
      )}

      <div>
        <label htmlFor={id('data')} className="rotulo">Data</label>
        <input id={id('data')} type="date" required value={valores.data_reserva} onChange={mudar('data_reserva')} className="input" />
      </div>

      {tipo !== 'quiosques' && (
        <div>
          <label htmlFor={id('inicio')} className="rotulo">{tipo === 'mesas' ? 'Chegada' : 'Início'}</label>
          <select id={id('inicio')} value={valores.inicio} onChange={mudar('inicio')} className="input">
            {comAtual(tipo === 'mesas' ? HORARIOS_RESTAURANTE : HORARIOS_QUADRA, valores.inicio).map((h) => <option key={h}>{h}</option>)}
          </select>
        </div>
      )}

      {tipo === 'quadras' && (
        <div className="col-span-2">
          <label htmlFor={id('duracao')} className="rotulo">Duração</label>
          <select id={id('duracao')} value={valores.duracao} onChange={mudar('duracao')} className="input">
            {[...new Set([...DURACOES, valores.duracao])].sort((a, b) => a - b).map((d) => (
              <option key={d} value={d}>{d} hora{d > 1 ? 's' : ''}</option>
            ))}
          </select>
        </div>
      )}

      {tipo !== 'quadras' && (
        <div>
          <label htmlFor={id('pessoas')} className="rotulo">{tipo === 'quiosques' ? 'Convidados' : 'Pessoas'}</label>
          <input
            id={id('pessoas')}
            type="text"
            inputMode="numeric"
            required
            value={valores.pessoas}
            onChange={(e) => aoMudar({ ...valores, pessoas: e.target.value.replace(/\D/g, '').slice(0, 3) })}
            className={`input ${acimaCapacidade ? 'ring-2 ring-amber-400' : ''}`}
          />
          {acimaCapacidade && <p className="text-[11px] text-amber-700 font-semibold mt-1">Acima da capacidade ({quiosque.capacidade}).</p>}
        </div>
      )}

      {tipo === 'quiosques' && comEvento && (
        <div className="col-span-2">
          <label htmlFor={id('evento')} className="rotulo">Tipo de evento</label>
          <select id={id('evento')} value={valores.evento} onChange={mudar('evento')} className="input">
            {comAtual(TIPOS_EVENTO, valores.evento).map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>
      )}
    </div>
  );
}
