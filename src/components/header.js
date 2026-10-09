'use client';

import Link from 'next/link';
import { Flame } from 'lucide-react';

export default function Header({ subtitulo = "Sports Center & Gastrobar" }) {
  return (
    <header className="bg-white border-b border-slate-200 shadow-sm py-4 px-6 mb-6">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
        
        {/* LOGO OFICIAL */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative flex items-center justify-center w-12 h-12 bg-slate-900 rounded-2xl shadow-md group-hover:scale-105 transition">
            <Flame className="w-7 h-7 text-red-600 fill-red-600 animate-pulse" />
            <span className="absolute text-white font-black text-xs bottom-1">R</span>
          </div>
          <div>
            <div className="flex items-center gap-1">
              <span className="text-xl font-black text-slate-900 tracking-tight">RESENHA</span>
              <span className="text-xs font-black text-red-600 tracking-widest uppercase">GASTROBAR</span>
            </div>
            <p className="text-[11px] font-semibold text-slate-500 tracking-wider uppercase">{subtitulo}</p>
          </div>
        </Link>


      </div>
    </header>
  );
}