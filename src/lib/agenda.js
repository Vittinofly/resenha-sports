// Regras de "quando e onde" de uma reserva (sem JSX, para poder ser testado).
// Usadas no agendamento de balcão e na remarcação (ver components/admin/campos-agenda.js).
import { QUADRAS, QUIOSQUES, HORARIOS_QUADRA, FECHAMENTO_QUADRAS, TIPOS_EVENTO } from '@/lib/config';
import { montarDetalhes, parseDetalhes } from '@/lib/reservas';
import { horaParaMinutos, minutosParaHora } from '@/lib/formatadores';

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
