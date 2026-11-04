'use client';

import { useCallback, useSyncExternalStore } from 'react';
import { dataLocalISO } from '@/lib/formatadores';

const semAssinatura = () => () => {};

// Data de hoje ('YYYY-MM-DD') no fuso do navegador. Retorna '' durante o
// prerender, pois com Cache Components `new Date()` não pode rodar no servidor.
export function useHoje() {
  return useSyncExternalStore(semAssinatura, () => dataLocalISO(), () => '');
}

// Minutos desde a meia-noite (atualiza a cada minuto). -1 durante o prerender.
function assinarMinuto(callback) {
  const id = setInterval(callback, 60 * 1000);
  return () => clearInterval(id);
}

export function useMinutoAtual() {
  return useSyncExternalStore(
    assinarMinuto,
    () => {
      const agora = new Date();
      return agora.getHours() * 60 + agora.getMinutes();
    },
    () => -1
  );
}

// Lembra nome/WhatsApp do cliente no navegador para agilizar a próxima reserva.
const CHAVE_CONTATO = 'resenha:contato';
let cacheBruto = null;
let cacheContato = null;

function lerContato() {
  try {
    const bruto = window.localStorage.getItem(CHAVE_CONTATO);
    if (bruto !== cacheBruto) {
      cacheBruto = bruto;
      const obj = bruto ? JSON.parse(bruto) : null;
      cacheContato = obj?.nome && obj?.whatsapp ? obj : null;
    }
    return cacheContato;
  } catch {
    return null;
  }
}

// Retorna [contatoSalvo | null, salvar(nome, whatsapp)]
export function useContatoSalvo() {
  const contato = useSyncExternalStore(semAssinatura, lerContato, () => null);

  const salvar = useCallback((nome, whatsapp) => {
    try {
      window.localStorage.setItem(CHAVE_CONTATO, JSON.stringify({ nome, whatsapp }));
    } catch {
      // armazenamento indisponível (aba anônima etc.) — apenas ignora
    }
  }, []);

  return [contato, salvar];
}
