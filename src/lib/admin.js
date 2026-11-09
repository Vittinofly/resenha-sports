import { supabase } from '@/lib/supabase';
import { TIPOS_RESERVA, ERRO_CONFLITO_DB, ERRO_DUPLICADO_DB, normalizarReserva, ordenarPorDataHora, quiosqueDaReserva } from '@/lib/reservas';
import { STATUS_ATIVOS } from '@/lib/config';
import { hhmm, intervalosSobrepoem } from '@/lib/formatadores';

// O Supabase devolve no máximo 1000 linhas por requisição (max_rows), mesmo
// pedindo mais. Por isso paginamos com .range() até atingir `limite`.
const TAMANHO_PAGINA = 1000;

// Busca reservas das três tabelas, já normalizadas e ordenadas por data/hora.
export async function buscarReservas({ tipos = Object.keys(TIPOS_RESERVA), de, ate, somenteAtivas = false, status, limite = 5000 } = {}) {
  const resultados = await Promise.all(
    tipos.map(async (tipo) => {
      const linhas = [];
      for (let desde = 0; desde < limite; desde += TAMANHO_PAGINA) {
        let consulta = supabase.from(TIPOS_RESERVA[tipo].tabela).select('*');
        if (de) consulta = consulta.gte('data_reserva', de);
        if (ate) consulta = consulta.lte('data_reserva', ate);
        if (somenteAtivas) consulta = consulta.in('status', STATUS_ATIVOS);
        if (status) consulta = consulta.eq('status', status);
        const fimPagina = Math.min(desde + TAMANHO_PAGINA, limite) - 1;
        const { data, error } = await consulta.order('data_reserva', { ascending: false }).order('id', { ascending: false }).range(desde, fimPagina);
        if (error) return { linhas: linhas.map((r) => normalizarReserva(r, tipo)), error };
        linhas.push(...data);
        if (data.length < fimPagina - desde + 1) break;
      }
      return { linhas: linhas.map((r) => normalizarReserva(r, tipo)), error: null };
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

// Mensagem amigável para erros do banco ao alterar reservas. Reativar uma
// reserva cancelada cujo horário já foi ocupado dispara as travas
// anti-overbooking (23P01 / 23505) — sem isso a equipe veria o erro técnico.
export function mensagemErroReserva(error, prefixo = 'Erro') {
  if (error?.code === ERRO_CONFLITO_DB || error?.code === ERRO_DUPLICADO_DB) {
    return 'Esse horário/espaço já está ocupado por outra reserva. Remarque antes de reativar.';
  }
  if (error?.code === '42501') return 'Sem permissão para esta ação. Peça acesso a um administrador.';
  return `${prefixo}: ${error?.message || 'falha desconhecida'}`;
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
