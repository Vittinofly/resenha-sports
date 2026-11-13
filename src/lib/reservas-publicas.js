'use client';

import { supabase } from '@/lib/supabase';
import { TIPOS_RESERVA } from '@/lib/reservas';
import { registrarEvento } from '@/lib/analytics';

function gerarToken() {
  try {
    return crypto.randomUUID();
  } catch {
    return null; // navegador antigo ou página sem https: segue sem link de cancelamento
  }
}

// Insere uma reserva feita pelo visitante na empresa do site aberto. Retorna { error, token, sinal }.
export async function inserirReservaPublica(empresaId, tipo, linha, { sinal = 0 } = {}) {
  const token = gerarToken();
  const { error } = await supabase.from(TIPOS_RESERVA[tipo].tabela).insert([
    { ...linha, empresa_id: empresaId, ...(token && { token_cliente: token }), ...(sinal > 0 && { sinal_valor: sinal }) },
  ]);
  if (!error) registrarEvento('generate_lead', { tipo_reserva: tipo, value: sinal || undefined, currency: 'BRL' });
  return { error, token: error ? null : token, sinal: error ? 0 : sinal };
}
