'use client'; // Error boundaries precisam ser Client Components

import { useEffect } from 'react';
import Link from 'next/link';
import { RotateCcw, Home } from 'lucide-react';
import PaginaPublica from '@/components/pagina-publica';

export default function Erro({ error, retry }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <PaginaPublica>
      <div className="max-w-xl mx-auto px-4 py-24 text-center">
        <p className="font-display font-black text-7xl text-red-600 leading-none">Ops!</p>
        <h1 className="titulo-secao text-3xl mt-4">Algo saiu do esperado</h1>
        <p className="text-slate-500 mt-2">
          Tivemos um problema ao carregar esta página. Tente novamente — se persistir, fale com a gente pelo WhatsApp.
        </p>
        <div className="flex flex-wrap justify-center gap-3 mt-8">
          <button onClick={() => retry()} className="btn-primario">
            <RotateCcw className="w-4 h-4" /> Tentar novamente
          </button>
          <Link href="/" className="btn-secundario">
            <Home className="w-4 h-4" /> Ir para o início
          </Link>
        </div>
      </div>
    </PaginaPublica>
  );
}
