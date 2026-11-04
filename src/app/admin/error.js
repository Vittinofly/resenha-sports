'use client'; // Error boundaries precisam ser Client Components

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, LayoutDashboard, RotateCcw } from 'lucide-react';

// Renderizado dentro do AdminShell: a navegação do painel continua disponível.
export default function ErroPainel({ error, retry }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="cartao p-8 sm:p-12 text-center max-w-xl mx-auto mt-6">
      <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
      <h1 className="font-display font-black uppercase text-2xl text-slate-900 mt-4">Não foi possível carregar esta tela</h1>
      <p className="text-sm text-slate-500 mt-2">
        Verifique sua conexão com a internet e tente novamente. Nenhuma alteração foi perdida.
      </p>
      <div className="flex flex-wrap justify-center gap-2 mt-6">
        <button onClick={() => retry()} className="btn-primario">
          <RotateCcw className="w-4 h-4" /> Tentar novamente
        </button>
        <Link href="/admin" className="btn-secundario">
          <LayoutDashboard className="w-4 h-4" /> Visão geral
        </Link>
      </div>
    </div>
  );
}
