'use client';

import Header from '@/components/header';
import CardapioViewer from '@/components/cardapioviewer';
import { BookOpen } from 'lucide-react';

export default function CardapioPage() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-12">
      <Header subtitulo="Cardápio Digital & Bar" />

      <main className="max-w-5xl mx-auto px-4 space-y-8">
        {/* TOPO DA PÁGINA */}
        <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-md border-b-4 border-red-600">
          <span className="text-xs font-black text-red-500 tracking-wider uppercase bg-red-950/80 border border-red-800/50 px-3 py-1 rounded-full inline-flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5" /> Consulta Rápida
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold mt-2">
            Nosso Cardápio
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Espetinhos, porções, pratos e bebidas geladas para você aproveitar na mesa ou evento.
          </p>
        </div>

        {/* CONTAINER DO CARDÁPIO */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm">
          <CardapioViewer titulo="" subtitulo="" />
        </div>
      </main>
    </div>
  );
}