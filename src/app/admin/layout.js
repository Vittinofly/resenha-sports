'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Header from '@/components/header';
import Link from 'next/link';
import { Dumbbell, Utensils, LogOut, Loader2, Shield, Clock } from 'lucide-react';

const TEMPO_INATIVIDADE_MS = 30 * 60 * 1000; // 30 minutos em milissegundos

export default function AdminLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [autenticado, setAutenticado] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const timerInatividadeRef = useRef(null);

  const handleLogout = async () => {
    if (timerInatividadeRef.current) clearTimeout(timerInatividadeRef.current);
    await supabase.auth.signOut();
    router.replace('/login');
  };

  // Função para reiniciar o timer de 30 minutos a cada interação do utilizador
  const reiniciarTimerInatividade = () => {
    if (timerInatividadeRef.current) clearTimeout(timerInatividadeRef.current);

    timerInatividadeRef.current = setTimeout(() => {
      alert('Sessão expirada por inatividade (30 minutos). Por favor, faça login novamente.');
      handleLogout();
    }, TEMPO_INATIVIDADE_MS);
  };

  useEffect(() => {
    async function verificarSessao() {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.replace('/login');
      } else {
        setAutenticado(true);
        reiniciarTimerInatividade();
      }
      setCarregando(false);
    }

    verificarSessao();

    // Eventos que indicam atividade do utilizador
    const eventos = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    const escutarAtividade = () => reiniciarTimerInatividade();

    eventos.forEach((ev) => window.addEventListener(ev, escutarAtividade));

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        setAutenticado(false);
        router.replace('/login');
      }
    });

    return () => {
      eventos.forEach((ev) => window.removeEventListener(ev, escutarAtividade));
      if (timerInatividadeRef.current) clearTimeout(timerInatividadeRef.current);
      authListener.subscription.unsubscribe();
    };
  }, [router]);

  if (carregando || !autenticado) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-12">
        <Header subtitulo="Painel de Administração Interna" />
        <div className="flex flex-col justify-center items-center py-20 text-slate-900 gap-3">
          <Loader2 className="w-8 h-8 text-red-600 animate-spin" />
          <span className="text-xs font-bold text-slate-600">A verificar permissões de acesso...</span>
        </div>
        <div className="hidden">{children}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-12">
      <Header subtitulo="Painel de Administração Interna" />

      <div className="max-w-6xl mx-auto px-4 space-y-6">
        {/* NAVEGAÇÃO DE ABAS DO ADMIN COM BOTÃO SAIR */}
        <div className="flex flex-wrap justify-between items-center gap-3 border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <span className="bg-slate-900 text-white p-1.5 rounded-lg text-xs font-black flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-red-500" /> Admin
            </span>

            <Link
              href="/admin/reservas"
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                pathname.startsWith('/admin/reservas')
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Dumbbell className="w-4 h-4" /> Gerenciar Reservas
            </Link>

            <Link
              href="/admin/cardapio"
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                pathname.startsWith('/admin/cardapio')
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Utensils className="w-4 h-4" /> Gerenciar Cardápio
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-lg flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-500" /> Auto-logout em 30m
            </span>

            <button
              onClick={handleLogout}
              className="bg-slate-200 hover:bg-red-50 hover:text-red-600 text-slate-700 px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" /> Sair da Conta
            </button>
          </div>
        </div>

        {/* CONTEÚDO DAS PÁGINAS ADMIN */}
        <div>{children}</div>
      </div>
    </div>
  );
}