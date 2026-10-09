'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Flame, Lock, Mail, Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setErro('');
    setCarregando(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErro('Credenciais inválidas. Verifique o e-mail e a senha.');
      setCarregando(false);
    } else {
      router.push('/admin/reservas');
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center px-4 font-sans text-slate-900">
      
      {/* BOTÃO VOLTAR PARA O PORTAL */}
      <div className="w-full max-w-md mb-4 flex justify-between items-center">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white px-3.5 py-2 rounded-full border border-slate-200 shadow-sm transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Voltar ao Portal Público
        </Link>
      </div>

      {/* CARD DE LOGIN */}
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
        
        {/* CABEÇALHO COM A LOGO EM EVIDÊNCIA */}
        <div className="bg-slate-900 text-white p-8 text-center border-b-4 border-red-600 space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-800 rounded-2xl border border-slate-700 shadow-md mb-1">
            <Flame className="w-9 h-9 text-red-600 fill-red-600 animate-pulse" />
          </div>

          <div>
            <div className="flex items-center justify-center gap-1">
              <span className="text-2xl font-black text-white tracking-tight">RESENHA</span>
              <span className="text-xs font-black text-red-600 tracking-widest uppercase">GASTROBAR</span>
            </div>
            <p className="text-[11px] font-semibold text-slate-400 tracking-wider uppercase mt-0.5">
              Sports Center & Restaurante
            </p>
          </div>

          <span className="inline-block text-[10px] font-black tracking-widest text-red-500 uppercase bg-red-950/80 border border-red-800/50 px-3 py-1 rounded-full">
            Acesso Administrativo
          </span>
        </div>

        {/* FORMULÁRIO DE AUTENTICAÇÃO */}
        <div className="p-6 sm:p-8 space-y-6">
          {erro && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-bold p-3.5 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{erro}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                E-mail Administrativo
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  placeholder="admin@resenha.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-600 text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Senha de Acesso
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-600 text-slate-900"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={carregando}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-extrabold py-3 rounded-xl text-sm shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {carregando ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>A Autenticar...</span>
                </>
              ) : (
                <span>Entrar no Painel</span>
              )}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}