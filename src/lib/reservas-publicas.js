'use client';

import { supabase } from '@/lib/supabase';
import { TIPOS_RESERVA } from '@/lib/reservas';
import { registrarEvento } from '@/lib/analytics';

// Colunas criadas pelo supabase/seguranca.sql (sinal, link do cliente). Se o
// script ainda não rodou, o PostgREST responde PGRST204 ("coluna não existe"):
// tentamos de novo sem elas para o site nunca parar de receber reservas.
const COLUNAS_OPCIONAIS = ['token_cliente', 'sinal_valor'];

function gerarToken() {
  try {
    return crypto.randomUUID();
  } catch {
    return null; // navegador antigo ou página sem https: segue sem link de cancelamento
  }
}

// Insere uma reserva feita pelo visitante. Retorna { error, token }.
export async function inserirReservaPublica(tipo, linha, { sinal = 0 } = {}) {
  const token = gerarToken();
  const completa = { ...linha, ...(token && { token_cliente: token }), ...(sinal > 0 && { sinal_valor: sinal }) };

  let { error } = await supabase.from(TIPOS_RESERVA[tipo].tabela).insert([completa]);
  if (error?.code === 'PGRST204' && COLUNAS_OPCIONAIS.some((c) => error.message?.includes(c))) {
    ({ error } = await supabase.from(TIPOS_RESERVA[tipo].tabela).insert([linha]));
    if (!error) return { error: null, token: null, sinal: 0 };
  }
  if (!error) registrarEvento('generate_lead', { tipo_reserva: tipo, value: sinal || undefined, currency: 'BRL' });
  return { error, token: error ? null : token, sinal: error ? 0 : sinal };
}
