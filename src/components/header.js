'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Dumbbell, Utensils, PartyPopper, BookOpen } from 'lucide-react';
import Logo from '@/components/logo';

export const LINKS_PUBLICOS = [
  { href: '/reservas/quadras', label: 'Quadras', icone: Dumbbell },
  { href: '/reservas/mesas', label: 'Mesas', icone: Utensils },
  { href: '/reservas/quiosques', label: 'Quiosques', icone: PartyPopper },
  { href: '/cardapio', label: 'Cardápio', icone: BookOpen },
];

// `navegacao={false}` é usado no painel admin, que tem a própria navegação.
export default function Header({ subtitulo = 'Sports Center & Gastrobar', navegacao = true, acoes = null }) {
  const pathname = usePathname();
  const [menuAberto, setMenuAberto] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <Link href="/" className="shrink-0" onClick={() => setMenuAberto(false)} aria-label="Resenha — página inicial">
          <Logo subtitulo={subtitulo} />
        </Link>

        {navegacao && (
          <>
            <nav className="hidden md:flex items-center gap-1" aria-label="Principal">
              {LINKS_PUBLICOS.map((l) => {
                const ativo = pathname.startsWith(l.href);
                return (
                  <Link
                    key={l.href}
                    href={l.href}
                    aria-current={ativo ? 'page' : undefined}
                    className={`px-3.5 py-2 rounded-xl text-sm font-bold transition ${
                      ativo ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    {l.label}
                  </Link>
                );
              })}
              <Link href="/reservas/quadras" className="btn-primario ml-2 !py-2">
                Reservar agora
              </Link>
            </nav>

            <button
              className="md:hidden p-2 rounded-xl text-slate-700 hover:bg-slate-100"
              onClick={() => setMenuAberto((v) => !v)}
              aria-expanded={menuAberto}
              aria-label={menuAberto ? 'Fechar menu' : 'Abrir menu'}
            >
              {menuAberto ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </>
        )}

        {acoes}
      </div>

      {navegacao && menuAberto && (
        <nav className="md:hidden border-t border-slate-200 bg-white px-4 py-3 grid grid-cols-2 gap-2 animate-entrar" aria-label="Menu móvel">
          {LINKS_PUBLICOS.map(({ href, label, icone: Icone }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMenuAberto(false)}
              className={`flex items-center gap-2 p-3 rounded-2xl text-sm font-bold border transition ${
                pathname.startsWith(href) ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 text-slate-800 border-slate-200'
              }`}
            >
              <Icone className="w-4 h-4 text-red-600" /> {label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
