'use client';

import Link from 'next/link';
import Header from '@/components/header';
import { BookOpen, Dumbbell, Utensils, PartyPopper, ShieldCheck } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <Header subtitulo="Portal de Serviços & Agendamentos" />

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-10">
        {/* BANNER PRINCIPAL */}
        <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-12 shadow-xl border-b-4 border-red-600 text-center space-y-4">
          <span className="text-xs font-black text-red-500 tracking-widest uppercase bg-red-950/60 border border-red-800/50 px-4 py-1.5 rounded-full inline-block">
            Bem-vindo ao Resenha
          </span>
          <h1 className="text-3xl sm:text-5xl font-black text-white">
            O que deseja fazer hoje?
          </h1>
          <p className="text-slate-300 text-sm sm:text-base max-w-xl mx-auto">
            Acesse nosso cardápio digital ou garanta sua reserva para quadras, restaurante e eventos privados.
          </p>
        </div>

        {/* OPÇÕES DE SELEÇÃO DIRETA */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          
          {/* Cardápio */}
          <Link
            href="/cardapio"
            className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:border-red-600 hover:shadow-md transition group flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-red-600 group-hover:text-white transition">
                <BookOpen className="w-6 h-6" />
              </div>
              <h2 className="font-extrabold text-lg text-slate-900">Cardápio Digital</h2>
              <p className="text-xs text-slate-500 mt-1">Consulte porções, espetinhos e bebidas na sua mesa.</p>
            </div>
            <span className="text-xs font-black text-red-600 mt-6 inline-block">Ver Produtos →</span>
          </Link>

          {/* Quadras */}
          <Link
            href="/reservas/quadras"
            className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:border-slate-900 hover:shadow-md transition group flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 bg-slate-100 text-slate-900 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-slate-900 group-hover:text-white transition">
                <Dumbbell className="w-6 h-6" />
              </div>
              <h2 className="font-extrabold text-lg text-slate-900">Quadras Esportivas</h2>
              <p className="text-xs text-slate-500 mt-1">Reserve seu horário de Beach Tennis, Futevôlei ou Padel.</p>
            </div>
            <span className="text-xs font-black text-slate-900 mt-6 inline-block">Reservar Quadra →</span>
          </Link>

          {/* Mesas */}
          <Link
            href="/reservas/mesas"
            className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:border-red-600 hover:shadow-md transition group flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-red-600 group-hover:text-white transition">
                <Utensils className="w-6 h-6" />
              </div>
              <h2 className="font-extrabold text-lg text-slate-900">Reservar Mesa</h2>
              <p className="text-xs text-slate-500 mt-1">Garanta lugar no restaurante com pré-pedido de consumo.</p>
            </div>
            <span className="text-xs font-black text-red-600 mt-6 inline-block">Reservar Mesa →</span>
          </Link>

          {/* Quiosques */}
          <Link
            href="/reservas/quiosques"
            className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:border-slate-900 hover:shadow-md transition group flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 bg-slate-100 text-slate-900 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-slate-900 group-hover:text-white transition">
                <PartyPopper className="w-6 h-6" />
              </div>
              <h2 className="font-extrabold text-lg text-slate-900">Alugar Quiosque</h2>
              <p className="text-xs text-slate-500 mt-1">Espaço privado para festas com seleção do cardápio.</p>
            </div>
            <span className="text-xs font-black text-slate-900 mt-6 inline-block">Alugar Espaço →</span>
          </Link>

        </div>

        {/* RODAPÉ E ADMIN */}
        <div className="text-center pt-6 border-t border-slate-200">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 bg-white px-5 py-2.5 rounded-full border border-slate-200 shadow-sm transition"
          >
            <ShieldCheck className="w-4 h-4 text-red-600" /> Acesso Restrito (Painel Admin)
          </Link>
        </div>
      </main>
    </div>
  );
}