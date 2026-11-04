import { supabase } from '@/lib/supabase';
import { TIPOS_RESERVA, normalizarReserva, ordenarPorDataHora } from '@/lib/reservas';
import { STATUS_ATIVOS } from '@/lib/config';

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
    const s = String(v ?? '');
    return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
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
