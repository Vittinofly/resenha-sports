'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertCircle, ArrowLeft, CheckCircle2, Clock, Eye, EyeOff, Loader2, Lock, Mail } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const AVISOS = {
  inatividade: { icone: Clock, texto: 'Sua sessão expirou após 30 minutos sem uso. Entre novamente.' },
  'sem-acesso': { icone: AlertCircle, texto: 'Esta conta não faz parte da equipe. Peça acesso a um administrador.' },
};

function AvisoDaUrl() {
  const aviso = AVISOS[useSearchParams().get('motivo')];
  if (!aviso) return null;
  const Icone = aviso.icone;
  return (
    <div className="bg-amber-50 border border-amber-200 text-amber-900 text-sm p-3.5 rounded-xl flex items-center gap-2">
      <Icone className="w-4 h-4 shrink-0" /> {aviso.texto}
    </div>
  );
}

function CampoEmail({ email, setEmail }) {
  return (
    <div>
      <label htmlFor="email" className="rotulo">E-mail</label>
      <div className="relative">
        <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input id="email" type="email" required autoComplete="username" placeholder="voce@resenha.com" value={email} onChange={(e) => setEmail(e.target.value)} className="input pl-10" />
      </div>
    </div>
  );
}

export default function FormularioLogin() {
  const router = useRouter();
  const [modo, setModo] = useState('entrar'); // 'entrar' | 'recuperar' | 'enviado'
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

  const trocarModo = (novo) => {
    setErro('');
    setModo(novo);
  };

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

  const recuperar = async (e) => {
    e.preventDefault();
    setErro('');
    setCarregando(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/login/nova-senha`,
    });
    setCarregando(false);
    // Limite de envios do Supabase: avisa; nos demais casos não revela se o e-mail existe
    if (error?.status === 429) return setErro('Muitas tentativas. Aguarde alguns minutos e tente de novo.');
    setModo('enviado');
  };

  if (modo === 'enviado') {
    return (
      <div className="p-6 sm:p-8 space-y-4 text-center">
        <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
        <p className="text-sm text-slate-700">
          Se <strong>{email.trim()}</strong> estiver cadastrado, você vai receber um e-mail com o link para criar uma nova senha.
        </p>
        <p className="text-xs text-slate-500">Confira também a caixa de spam. O link vale por pouco tempo.</p>
        <button type="button" onClick={() => trocarModo('entrar')} className="btn-secundario w-full">
          <ArrowLeft className="w-4 h-4" /> Voltar ao login
        </button>
      </div>
    );
  }

  const recuperando = modo === 'recuperar';

  return (
    <form onSubmit={recuperando ? recuperar : entrar} className="p-6 sm:p-8 space-y-4">
      <Suspense fallback={null}>
        <AvisoDaUrl />
      </Suspense>

      {recuperando && (
        <p className="text-sm text-slate-600">Informe o e-mail da sua conta. Enviaremos um link para você criar uma nova senha.</p>
      )}

      {erro && (
        <div role="alert" className="bg-red-50 border border-red-200 text-red-700 text-sm font-semibold p-3.5 rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" /> {erro}
        </div>
      )}

      <CampoEmail email={email} setEmail={setEmail} />

      {!recuperando && (
        <div>
          <div className="flex items-center justify-between">
            <label htmlFor="senha" className="rotulo">Senha</label>
            <button type="button" onClick={() => trocarModo('recuperar')} className="text-[11px] font-bold text-red-600 hover:underline mb-1.5">
              Esqueci minha senha
            </button>
          </div>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input id="senha" type={verSenha ? 'text' : 'password'} required autoComplete="current-password" placeholder="••••••••" value={senha} onChange={(e) => setSenha(e.target.value)} className="input pl-10 pr-11" />
            <button type="button" onClick={() => setVerSenha((v) => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-700" aria-label={verSenha ? 'Ocultar senha' : 'Mostrar senha'}>
              {verSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
      )}

      <button type="submit" disabled={carregando} className="btn-primario w-full !py-3">
        {carregando ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> {recuperando ? 'Enviando...' : 'Entrando...'}</>
        ) : recuperando ? (
          'Enviar link de recuperação'
        ) : (
          'Entrar no painel'
        )}
      </button>

      {recuperando && (
        <button type="button" onClick={() => trocarModo('entrar')} className="w-full text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center justify-center gap-1.5">
          <ArrowLeft className="w-3.5 h-3.5" /> Voltar ao login
        </button>
      )}
    </form>
  );
}
