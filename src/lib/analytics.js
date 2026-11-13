// Google Analytics 4: cada empresa informa o próprio ID e o script só carrega
// depois que o visitante aceita o aviso de cookies (LGPD). Ver components/analytics.js.
export const CHAVE_CONSENTIMENTO = 'resenha:cookies';

// Dispara um evento se o GA estiver ativo; caso contrário não faz nada.
export function registrarEvento(nome, parametros = {}) {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;
  window.gtag('event', nome, parametros);
}
