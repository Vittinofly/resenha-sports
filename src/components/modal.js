'use client';

import { useEffect, useId } from 'react';
import { X } from 'lucide-react';

export default function Modal({ aberto, aoFechar, titulo, icone, largura = 'max-w-md', children }) {
  const tituloId = useId();

  useEffect(() => {
    if (!aberto) return;
    const aoTeclar = (e) => e.key === 'Escape' && aoFechar();
    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', aoTeclar);
    return () => {
      window.removeEventListener('keydown', aoTeclar);
      document.body.style.overflow = overflowAnterior;
    };
  }, [aberto, aoFechar]);

  if (!aberto) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4"
      onMouseDown={(e) => e.target === e.currentTarget && aoFechar()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={tituloId}
        className={`animate-entrar bg-white w-full ${largura} rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[92dvh] overflow-y-auto`}
      >
        <div className="sticky top-0 bg-white/95 backdrop-blur flex items-center justify-between gap-3 px-6 pt-5 pb-3 border-b border-slate-100">
          <h3 id={tituloId} className="font-display font-bold text-lg uppercase tracking-wide text-slate-900 flex items-center gap-2">
            {icone}
            {titulo}
          </h3>
          <button onClick={aoFechar} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100" aria-label="Fechar">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}
