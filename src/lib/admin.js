import { supabase } from '@/lib/supabase';
import { TIPOS_RESERVA, normalizarReserva, ordenarPorDataHora, quiosqueDaReserva } from '@/lib/reservas';
import { STATUS_ATIVOS } from '@/lib/config';
import { hhmm, intervalosSobrepoem } from '@/lib/formatadores';

// Busca reservas das três tabelas, já normalizadas e ordenadas por data/hora.
export async function buscarReservas({ tipos = Object.keys(TIPOS_RESERVA), de, ate, somenteAtivas = false, status, limite = 1000 } = {}) {
  const resultados = await Promise.all(
    tipos.map(async (tipo) => {
      let consulta = supabase.from(TIPOS_RESERVA[tipo].tabela).select('*');
      if (de) consulta = consulta.gte('data_reserva', de);
      if (ate) consulta = consulta.lte('data_reserva', ate);
      if (somenteAtivas) consulta = consulta.in('status', STATUS_ATIVOS);
      if (status) consulta = consulta.eq('status', status);
      const { data, error } = await consulta.order('data_reserva', { ascending: false }).limit(limite);
      return { linhas: (data || []).map((r) => normalizarReserva(r, tipo)), error };
    })
  );

  return {
    reservas: resultados.flatMap((r) => r.linhas).sort(ordenarPorDataHora),
    erro: resultados.find((r) => r.error)?.error || null,
  };
}

export function atualizarReserva(reserva, campos) {
  return supabase.from(TIPOS_RESERVA[reserva.tipo].tabela).update(campos).eq('id', reserva.id);
}

// Verifica se os campos de uma reserva (já no formato do banco) colidem com
// outra reserva ativa. Retorna { mensagem } descrevendo o conflito, { erro } se
// a consulta falhar, ou {} quando está livre. Mesas não têm controle de lotação.
export async function verificarDisponibilidade(tipo, campos, ignorarId = null) {
  if (tipo === 'mesas') return {};

  let consulta = supabase
    .from(TIPOS_RESERVA[tipo].tabela)
    .select(tipo === 'quadras' ? 'id, cliente_nome, quadra_nome, horario_inicio, horario_fim' : 'id, cliente_nome, tipo_evento')
    .eq('data_reserva', campos.data_reserva)
    .neq('status', 'cancelado');
  if (tipo === 'quadras') consulta = consulta.eq('quadra_nome', campos.quadra_nome);
  if (ignorarId != null) consulta = consulta.neq('id', ignorarId);

  const { data, error } = await consulta;
  if (error) return { erro: error };

  if (tipo === 'quadras') {
    const c = data.find((r) => intervalosSobrepoem(campos.horario_inicio, campos.horario_fim, hhmm(r.horario_inicio), hhmm(r.horario_fim)));
    return c ? { mensagem: `Conflito com a reserva de ${c.cliente_nome} (${hhmm(c.horario_inicio)}–${hhmm(c.horario_fim)}).` } : {};
  }

  const quiosque = quiosqueDaReserva(campos.tipo_evento);
  const c = data.find((r) => quiosqueDaReserva(r.tipo_evento) === quiosque);
  return c ? { mensagem: `${quiosque} já tem evento de ${c.cliente_nome} nessa data.` } : {};
}

export async function contarPendentes() {
  const contagens = await Promise.all(
    Object.values(TIPOS_RESERVA).map(({ tabela }) =>
      supabase.from(tabela).select('id', { count: 'exact', head: true }).eq('status', 'pendente')
    )
  );
  return contagens.reduce((acc, { count }) => acc + (count || 0), 0);
}

// Gera e baixa um CSV (separador ';' para abrir direto no Excel em pt-BR)
export function baixarCSV(nomeArquivo, cabecalho, linhas) {
  const escapar = (v) => {
    let s = String(v ?? '');
    // Nomes e observações vêm do público: neutraliza fórmulas (=, +, -, @) para
    // que o Excel/Planilhas não as execute ao abrir o arquivo (CSV injection).
    if (typeof v === 'string' && /^[=+\-@\t\r]/.test(s)) s = `'${s}`;
    return /[;"\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const conteudo = [cabecalho, ...linhas].map((l) => l.map(escapar).join(';')).join('\n');
  const blob = new Blob(['﻿' + conteudo], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nomeArquivo;
  a.click();
  URL.revokeObjectURL(url);
}
