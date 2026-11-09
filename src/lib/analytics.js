// Google Analytics 4 — só carrega com NEXT_PUBLIC_GA_ID preenchido E depois que
// o visitante aceita no aviso de cookies (LGPD). Ver components/analytics.js.
export const GA_ID = (process.env.NEXT_PUBLIC_GA_ID || '').trim();
export const CHAVE_CONSENTIMENTO = 'resenha:cookies';

// Dispara um evento se o GA estiver ativo; caso contrário não faz nada.
export function registrarEvento(nome, parametros = {}) {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;
  window.gtag('event', nome, parametros);
}
