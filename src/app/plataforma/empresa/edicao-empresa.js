'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Loader2, Trash2, UserPlus } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { urlDaEmpresa } from '@/lib/host-empresa';
import { useFeedback } from '@/components/feedback';
import FormularioEmpresa from '@/components/admin/formulario-empresa';

const RAIZ = process.env.NEXT_PUBLIC_ROOT_DOMAIN || '';

// Erro 23505 = slug ou domínio já usado por outra empresa
const mensagemErro = (error) => (error.code === '23505' ? 'Esse endereço já está em uso por outra empresa.' : `Erro ao salvar: ${error.message}`);

function Equipe({ empresaId }) {
  const { toast, confirmar } = useFeedback();
  const [membros, setMembros] = useState([]);
  const [email, setEmail] = useState('');
  const [papel, setPapel] = useState('admin');
  const [enviando, setEnviando] = useState(false);

  const carregar = useCallback(async () => {
    const { data, error } = await supabase.from('equipe').select('user_id, papel, email').eq('empresa_id', empresaId).order('email');
    if (error) return toast('Erro ao carregar a equipe: ' + error.message, 'erro');
    setMembros(data);
  }, [empresaId, toast]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga inicial de dados
    carregar();
  }, [carregar]);

  const convidar = async (e) => {
    e.preventDefault();
    setEnviando(true);
    const { data: { session } } = await supabase.auth.getSession();
    const resposta = await fetch('/api/plataforma/equipe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
      body: JSON.stringify({ empresaId, email, papel }),
    }).catch(() => null);
    setEnviando(false);
    const dados = await resposta?.json().catch(() => null);
    if (!resposta?.ok) return toast(dados?.erro || 'Não foi possível convidar.', 'erro');
    toast(dados.convidado ? 'Convite enviado por e-mail.' : 'Essa pessoa já tinha conta e foi adicionada à equipe.');
    setEmail('');
    carregar();
  };

  const remover = async (m) => {
    const ok = await confirmar({ titulo: 'Remover da equipe?', mensagem: `${m.email || 'Essa pessoa'} perde o acesso ao painel desta empresa.`, textoConfirmar: 'Remover', perigo: true });
    if (!ok) return;
    const { error } = await supabase.from('equipe').delete().eq('empresa_id', empresaId).eq('user_id', m.user_id);
    if (error) return toast('Erro ao remover: ' + error.message, 'erro');
    carregar();
  };

  return (
    <section className="cartao p-5 sm:p-6 space-y-4">
      <h2 className="font-display font-bold uppercase text-xl text-slate-900">Equipe</h2>
      <ul className="divide-y divide-slate-100">
        {membros.map((m) => (
          <li key={m.user_id} className="py-2 flex items-center justify-between gap-3 text-sm">
            <span className="truncate">{m.email || m.user_id}</span>
            <span className="flex items-center gap-2 shrink-0">
              <span className="chip border-slate-200 bg-slate-50 text-slate-700">{m.papel === 'admin' ? 'Administrador' : 'Atendente'}</span>
              <button type="button" onClick={() => remover(m)} className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg" aria-label={`Remover ${m.email || ''}`}>
                <Trash2 className="w-4 h-4" />
              </button>
            </span>
          </li>
        ))}
        {membros.length === 0 && <li className="py-2 text-sm text-slate-500">Ninguém na equipe ainda.</li>}
      </ul>
      <form onSubmit={convidar} className="grid sm:grid-cols-[1fr_160px_auto] gap-2 items-end">
        <div>
          <label htmlFor="c-email" className="rotulo">E-mail</label>
          <input id="c-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="input" />
        </div>
        <div>
          <label htmlFor="c-papel" className="rotulo">Papel</label>
          <select id="c-papel" value={papel} onChange={(e) => setPapel(e.target.value)} className="input">
            <option value="admin">Administrador</option>
            <option value="atendente">Atendente</option>
          </select>
        </div>
        <button type="submit" disabled={enviando} className="btn-escuro !py-2.5">
          {enviando ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />} Convidar
        </button>
      </form>
    </section>
  );
}

export default function EdicaoEmpresa() {
  const id = useSearchParams().get('id');
  const router = useRouter();
  const { toast } = useFeedback();
  const [estado, setEstado] = useState({ carregando: !!id, empresa: null, erro: false });

  useEffect(() => {
    if (!id) return;
    let ativo = true;
    supabase
      .from('empresas')
      .select('id, slug, dominio, nome, ativo, config')
      .eq('id', id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (ativo) setEstado({ carregando: false, empresa: data, erro: !!error || !data });
      });
    return () => {
      ativo = false;
    };
  }, [id]);

  const salvar = async ({ linha, endereco }) => {
    const campos = { ...linha, ...endereco };
    if (estado.empresa) {
      const { error } = await supabase.from('empresas').update(campos).eq('id', estado.empresa.id);
      if (error) return toast(mensagemErro(error), 'erro');
      setEstado((e) => ({ ...e, empresa: { ...e.empresa, ...campos } }));
      toast('Empresa salva. O site é atualizado em até 1 minuto.');
      return;
    }
    const { data, error } = await supabase.from('empresas').insert([campos]).select('id').single();
    if (error) return toast(mensagemErro(error), 'erro');
    toast('Empresa criada. Agora convide o administrador.');
    router.replace(`/empresa?id=${data.id}`);
  };

  if (estado.carregando) {
    return (
      <div className="cartao p-10 flex justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (estado.erro) return <p role="alert" className="cartao p-5 text-sm text-rose-700">Empresa não encontrada.</p>;

  const { empresa } = estado;

  return (
    <>
      <div>
        <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900">
          <ArrowLeft className="w-3.5 h-3.5" /> Empresas
        </Link>
        <h1 className="font-display font-black uppercase text-3xl text-slate-900 mt-1">{empresa ? empresa.nome : 'Nova empresa'}</h1>
        {empresa && (
          <a href={urlDaEmpresa(empresa, RAIZ)} target="_blank" rel="noreferrer" className="text-xs text-slate-500 hover:underline">
            {urlDaEmpresa(empresa, RAIZ)}
          </a>
        )}
      </div>

      {empresa && <Equipe empresaId={empresa.id} />}

      <FormularioEmpresa
        key={empresa?.id || 'nova'}
        inicial={empresa || undefined}
        comEndereco
        raiz={RAIZ}
        aoSalvar={salvar}
        aoErro={(m) => toast(m, 'erro')}
        textoBotao={empresa ? 'Salvar alterações' : 'Criar empresa'}
      />
    </>
  );
}
