'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, Building2, Loader2, LogOut, ShieldCheck } from 'lucide-react';
import { supabase } from '@/lib/supabase';

function Login({ aviso }) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  const entrar = async (e) => {
    e.preventDefault();
    setErro('');
    setCarregando(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: senha });
    setCarregando(false);
    if (error) setErro('E-mail ou senha incorretos.');
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
      <form onSubmit={entrar} className="w-full max-w-sm bg-white rounded-3xl p-6 sm:p-8 space-y-4 shadow-2xl">
        <h1 className="font-display font-black uppercase text-2xl text-slate-900 flex items-center gap-2">
          <ShieldCheck className="w-6 h-6" /> Plataforma
        </h1>
        {(erro || aviso) && (
          <p role="alert" className="bg-rose-50 border border-rose-200 text-rose-700 text-sm font-semibold p-3 rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" /> {erro || aviso}
          </p>
        )}
        <div>
          <label htmlFor="p-email" className="rotulo">E-mail</label>
          <input id="p-email" type="email" required autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} className="input" />
        </div>
        <div>
          <label htmlFor="p-senha" className="rotulo">Senha</label>
          <input id="p-senha" type="password" required autoComplete="current-password" value={senha} onChange={(e) => setSenha(e.target.value)} className="input" />
        </div>
        <button type="submit" disabled={carregando} className="btn-escuro w-full !py-3">
          {carregando && <Loader2 className="w-4 h-4 animate-spin" />} Entrar
        </button>
      </form>
    </main>
  );
}

// Acesso exclusivo de super-usuários. O bloqueio real está no banco (RLS):
// aqui só decidimos o que mostrar.
export default function ShellPlataforma({ children }) {
  const [estado, setEstado] = useState({ etapa: 'verificando', aviso: '', email: '' });

  useEffect(() => {
    let ativo = true;

    const avaliar = async (sessao) => {
      if (!sessao) {
        if (ativo) setEstado((e) => ({ etapa: 'login', aviso: e.aviso, email: '' }));
        return;
      }
      const { data: ehSuper, error } = await supabase.rpc('is_super');
      if (!ativo) return;
      if (error) return setEstado({ etapa: 'login', aviso: 'Não foi possível verificar o acesso. Confira se o banco foi migrado.', email: '' });
      if (!ehSuper) {
        setEstado({ etapa: 'login', aviso: 'Esta conta não é super-usuário da plataforma.', email: '' });
        await supabase.auth.signOut();
        return;
      }
      setEstado({ etapa: 'pronto', aviso: '', email: sessao.user.email });
    };

    // O callback de auth não pode aguardar outras chamadas do Supabase: adia para o próximo ciclo
    const { data: listener } = supabase.auth.onAuthStateChange((_evento, sessao) => {
      setTimeout(() => avaliar(sessao), 0);
    });

    return () => {
      ativo = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  if (estado.etapa === 'verificando') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <Loader2 className="w-8 h-8 animate-spin text-slate-500" />
      </div>
    );
  }

  if (estado.etapa === 'login') return <Login aviso={estado.aviso} />;

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-slate-950 text-slate-200">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <Link href="/" className="font-display font-black uppercase text-lg text-white flex items-center gap-2">
            <Building2 className="w-5 h-5" /> Plataforma
          </Link>
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-xs text-slate-400 truncate hidden sm:block">{estado.email}</span>
            <button onClick={() => supabase.auth.signOut()} className="p-2 rounded-lg hover:bg-white/10" aria-label="Sair">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">{children}</main>
    </div>
  );
}
