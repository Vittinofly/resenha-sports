// Regras de "quando e onde" de uma reserva (sem JSX, para poder ser testado).
// Usadas no agendamento de balcão e na remarcação (ver components/admin/campos-agenda.js).
import { montarDetalhes, parseDetalhes } from '@/lib/reservas';
import { horaParaMinutos, minutosParaHora } from '@/lib/formatadores';

const PERMANENCIA_MESA_MIN = 120;

// Valores do formulário a partir de uma reserva normalizada (remarcar) ou de padrões (nova).
export function valoresAgenda(empresa, tipo, { reserva, data_reserva, quadra_nome, inicio } = {}) {
  const quadraPadrao = empresa.quadras[0]?.nome || '';
  const quiosquePadrao = empresa.quiosques[0]?.nome || '';
  const inicioPadrao = tipo === 'mesas' ? (empresa.horariosMesas.includes('19:00') ? '19:00' : empresa.horariosMesas[0]) : empresa.horariosQuadra[0];
  const eventoPadrao = empresa.tiposEvento[0];
  if (reserva) {
    const duracao = Math.max(1, Math.round((horaParaMinutos(reserva.fim) - horaParaMinutos(reserva.inicio)) / 60));
    return {
      data_reserva: reserva.data_reserva,
      quadra_nome: reserva.quadra_nome || quadraPadrao,
      inicio: reserva.inicio || inicioPadrao,
      duracao: reserva.fim ? duracao : 1,
      pessoas: String(reserva.pessoas || ''),
      quiosque_nome: tipo === 'quiosques' ? reserva.local : quiosquePadrao,
      evento: reserva.evento || eventoPadrao,
    };
  }
  return {
    data_reserva: data_reserva || '',
    quadra_nome: quadra_nome || quadraPadrao,
    inicio: inicio || inicioPadrao,
    duracao: 1,
    pessoas: tipo === 'quiosques' ? '20' : '2',
    quiosque_nome: quiosquePadrao,
    evento: eventoPadrao,
  };
}

// Converte os valores do formulário em colunas do banco. Retorna { campos } ou { erro }.
// `original` (reserva sendo remarcada) preserva o pré-pedido guardado em tipo_evento.
export function prepararAgenda(empresa, tipo, v, original = null) {
  if (!v.data_reserva) return { erro: 'Informe a data.' };
  const pedido = original?.itens?.join(', ') || '';

  if (tipo === 'quadras') {
    const fim = horaParaMinutos(v.inicio) + v.duracao * 60;
    if (fim > empresa.fechamentoQuadras * 60) return { erro: `O término não pode passar das ${empresa.fechamentoQuadras}:00.` };
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
