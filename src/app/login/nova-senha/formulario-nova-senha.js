'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertCircle, ArrowLeft, Eye, EyeOff, Loader2, Lock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useFeedback } from '@/components/feedback';

const MIN_CARACTERES = 8;

// O link do e-mail de recuperação abre esta página já com a sessão na URL; o
// cliente do Supabase a detecta sozinho. Estando logado, a página também serve
// para trocar a senha.
function erroDoLink() {
  const params = new URLSearchParams(window.location.hash.slice(1) || window.location.search);
  const codigo = params.get('error_code') || params.get('error');
  if (!codigo) return null;
  return codigo === 'otp_expired' ? 'Este link expirou. Peça um novo na tela de login.' : 'Link inválido. Peça um novo na tela de login.';
}

export default function FormularioNovaSenha() {
  const router = useRouter();
  const { toast } = useFeedback();
  const [estado, setEstado] = useState({ etapa: 'verificando', mensagem: '' }); // verificando | pronto | invalido
  const [senha, setSenha] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [verSenha, setVerSenha] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    let ativo = true;
    const { data: listener } = supabase.auth.onAuthStateChange((evento, sessao) => {
      if (ativo && sessao && (evento === 'PASSWORD_RECOVERY' || evento === 'SIGNED_IN')) setEstado({ etapa: 'pronto', mensagem: '' });
    });
    // getSession aguarda o cliente terminar de ler a sessão vinda da URL
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!ativo) return;
      if (session) setEstado({ etapa: 'pronto', mensagem: '' });
      else setEstado({ etapa: 'invalido', mensagem: erroDoLink() || 'Abra esta página pelo link enviado ao seu e-mail.' });
    });
    return () => {
      ativo = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const salvar = async (e) => {
    e.preventDefault();
    setErro('');
    if (senha.length < MIN_CARACTERES) return setErro(`A senha precisa ter pelo menos ${MIN_CARACTERES} caracteres.`);
    if (senha !== confirmacao) return setErro('As senhas não conferem.');

    setSalvando(true);
    const { error } = await supabase.auth.updateUser({ password: senha });
    setSalvando(false);
    if (error) {
      if (error.code === 'same_password') return setErro('A nova senha precisa ser diferente da atual.');
      if (error.code === 'weak_password') return setErro('Senha fraca. Misture letras, números e símbolos.');
      return setErro('Não foi possível salvar a senha. Peça um novo link e tente novamente.');
    }
    toast('Senha alterada com sucesso.');
    router.replace('/admin');
  };

  if (estado.etapa === 'verificando') {
    return (
      <div className="p-10 flex justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (estado.etapa === 'invalido') {
    return (
      <div className="p-6 sm:p-8 space-y-4 text-center">
        <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
        <p className="text-sm text-slate-700">{estado.mensagem}</p>
        <Link href="/login" className="btn-secundario w-full">
          <ArrowLeft className="w-4 h-4" /> Ir para o login
        </Link>
      </div>
    );
  }

  const tipoCampo = verSenha ? 'text' : 'password';

  return (
    <form onSubmit={salvar} className="p-6 sm:p-8 space-y-4">
      <p className="text-sm text-slate-600">Crie uma nova senha com pelo menos {MIN_CARACTERES} caracteres.</p>

      {erro && (
        <div role="alert" className="bg-red-50 border border-red-200 text-red-700 text-sm font-semibold p-3.5 rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" /> {erro}
        </div>
      )}

      <div>
        <label htmlFor="nova-senha" className="rotulo">Nova senha</label>
        <div className="relative">
          <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input id="nova-senha" type={tipoCampo} required autoFocus autoComplete="new-password" minLength={MIN_CARACTERES} value={senha} onChange={(e) => setSenha(e.target.value)} className="input pl-10 pr-11" />
          <button type="button" onClick={() => setVerSenha((v) => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-700" aria-label={verSenha ? 'Ocultar senha' : 'Mostrar senha'}>
            {verSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div>
        <label htmlFor="confirmar-senha" className="rotulo">Repita a nova senha</label>
        <div className="relative">
          <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input id="confirmar-senha" type={tipoCampo} required autoComplete="new-password" value={confirmacao} onChange={(e) => setConfirmacao(e.target.value)} className="input pl-10" />
        </div>
      </div>

      <button type="submit" disabled={salvando} className="btn-primario w-full !py-3">
        {salvando ? <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</> : 'Salvar nova senha'}
      </button>
    </form>
  );
}
