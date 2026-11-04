'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertCircle, Clock, Eye, EyeOff, Loader2, Lock, Mail } from 'lucide-react';
import { supabase } from '@/lib/supabase';

function AvisoInatividade() {
  const motivo = useSearchParams().get('motivo');
  if (motivo !== 'inatividade') return null;
  return (
    <div className="bg-amber-50 border border-amber-200 text-amber-900 text-sm p-3.5 rounded-xl flex items-center gap-2">
      <Clock className="w-4 h-4 shrink-0" /> Sua sessão expirou após 30 minutos sem uso. Entre novamente.
    </div>
  );
}

export default function FormularioLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [verSenha, setVerSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');

  // Já autenticado? Vai direto para o painel.
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.replace('/admin');
    });
  }, [router]);

  const entrar = async (e) => {
    e.preventDefault();
    setErro('');
    setCarregando(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: senha });
    if (error) {
      setErro(error.message?.toLowerCase().includes('email not confirmed') ? 'E-mail ainda não confirmado.' : 'E-mail ou senha incorretos.');
      setCarregando(false);
      return;
    }
    router.replace('/admin');
  };

  return (
    <form onSubmit={entrar} className="p-6 sm:p-8 space-y-4">
      <Suspense fallback={null}>
        <AvisoInatividade />
      </Suspense>

      {erro && (
        <div role="alert" className="bg-red-50 border border-red-200 text-red-700 text-sm font-semibold p-3.5 rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" /> {erro}
        </div>
      )}

      <div>
        <label htmlFor="email" className="rotulo">E-mail</label>
        <div className="relative">
          <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input id="email" type="email" required autoComplete="username" placeholder="voce@resenha.com" value={email} onChange={(e) => setEmail(e.target.value)} className="input pl-10" />
        </div>
      </div>

      <div>
        <label htmlFor="senha" className="rotulo">Senha</label>
        <div className="relative">
          <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input id="senha" type={verSenha ? 'text' : 'password'} required autoComplete="current-password" placeholder="••••••••" value={senha} onChange={(e) => setSenha(e.target.value)} className="input pl-10 pr-11" />
          <button type="button" onClick={() => setVerSenha((v) => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-700" aria-label={verSenha ? 'Ocultar senha' : 'Mostrar senha'}>
            {verSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <button type="submit" disabled={carregando} className="btn-primario w-full !py-3">
        {carregando ? <><Loader2 className="w-4 h-4 animate-spin" /> Entrando...</> : 'Entrar no painel'}
      </button>
    </form>
  );
}
