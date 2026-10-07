'use client';

import Link from 'next/link';
import { Trophy, Utensils, MapPin, Clock, Phone } from 'lucide-react';

export default function Home() {
  return (
    <main className="min-h-screen bg-stone-50 text-stone-800 flex flex-col justify-between font-sans">
      {/* Topo / Header */}
      <header className="w-full py-6 px-4 bg-white/80 backdrop-blur-md border-b border-stone-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-emerald-950 font-serif">
              Resenha <span className="text-amber-600 font-sans text-xl font-medium">Sports Center</span>
            </h1>
            <p className="text-xs text-stone-500 flex items-center gap-1 mt-0.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-700" /> São Luís de Montes Belos - GO
            </p>
          </div>
          <a
            href="https://wa.me/5564999999999"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-2 text-xs font-semibold bg-emerald-950 text-amber-50 px-4 py-2.5 rounded-full hover:bg-emerald-900 transition-all shadow-sm"
          >
            <Phone className="w-3.5 h-3.5 text-amber-400" /> Contato Direto
          </a>
        </div>
      </header>

      {/* Seção Principal Split Screen */}
      <section className="max-w-6xl mx-auto px-4 py-10 w-full flex-1 flex flex-col justify-center">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs font-semibold tracking-wider uppercase bg-amber-100 text-amber-900 px-3.5 py-1.5 rounded-full">
            Seja bem-vindo
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-stone-900 mt-4 tracking-tight leading-tight">
            Esporte, gastronomia e convivência num só lugar.
          </h2>
          <p className="text-stone-600 mt-3 text-base leading-relaxed">
            Selecione o ambiente que deseja acessar para realizar a sua reserva ou consultar os nossos serviços.
          </p>
        </div>

        {/* Cards de Navegação */}
        <div className="grid md:grid-cols-2 gap-6 sm:gap-8 max-w-4xl mx-auto w-full">
          {/* Opção 1: Esportes */}
          <Link
            href="/esportes"
            className="group relative overflow-hidden rounded-3xl bg-white border border-stone-200 p-8 shadow-sm hover:shadow-xl hover:border-emerald-700/40 transition-all duration-300 flex flex-col justify-between min-h-[280px]"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-100/50 rounded-full blur-2xl group-hover:bg-emerald-200/60 transition-all"></div>
            <div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-950 text-amber-400 flex items-center justify-center mb-6 shadow-md group-hover:scale-105 transition-transform">
                <Trophy className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-emerald-800 tracking-wider uppercase">
                Futebol & Quadras de Areia
              </span>
              <h3 className="text-2xl font-bold text-stone-900 mt-1 mb-2">
                Agendar Horário
              </h3>
              <p className="text-sm text-stone-600 leading-relaxed">
                Reserve o seu horário na quadra de futebol society ou na areia. Blocos de 1 hora com agendamento direto.
              </p>
            </div>
            <div className="mt-8 flex items-center gap-2 text-sm font-semibold text-emerald-900 group-hover:translate-x-1 transition-transform">
              Ver horários disponíveis &rarr;
            </div>
          </Link>

          {/* Opção 2: Restaurante e Eventos */}
          <Link
            href="/restaurante"
            className="group relative overflow-hidden rounded-3xl bg-white border border-stone-200 p-8 shadow-sm hover:shadow-xl hover:border-amber-600/40 transition-all duration-300 flex flex-col justify-between min-h-[280px]"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-100/50 rounded-full blur-2xl group-hover:bg-amber-200/60 transition-all"></div>
            <div>
              <div className="w-12 h-12 rounded-2xl bg-amber-600 text-white flex items-center justify-center mb-6 shadow-md group-hover:scale-105 transition-transform">
                <Utensils className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-amber-700 tracking-wider uppercase">
                Gastronomia & Quiosques
              </span>
              <h3 className="text-2xl font-bold text-stone-900 mt-1 mb-2">
                Cardápio & Reservas
              </h3>
              <p className="text-sm text-stone-600 leading-relaxed">
                Acesse o nosso cardápio digital interativo, garanta a sua mesa ou solicite um dos nossos 5 quiosques.
              </p>
            </div>
            <div className="mt-8 flex items-center gap-2 text-sm font-semibold text-amber-700 group-hover:translate-x-1 transition-transform">
              Acessar cardápio e reservas &rarr;
            </div>
          </Link>
        </div>
      </section>

      {/* Rodapé */}
      <footer className="w-full bg-stone-900 text-stone-400 py-8 px-4 border-t border-stone-800 text-xs">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-left">
          <div>
            <p className="font-semibold text-stone-200">Resenha Sports Center</p>
            <p className="mt-1 text-stone-400">Atendimento e reservas online em São Luís de Montes Belos.</p>
          </div>
          <div className="flex items-center gap-4 text-stone-400">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-500" /> Terça a Domingo: 17h às 23h
            </span>
          </div>
        </div>
      </footer>
    </main>
  );
}