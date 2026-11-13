'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2, Plus } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { urlDaEmpresa } from '@/lib/host-empresa';

export default function PlataformaPage() {
  const [estado, setEstado] = useState({ carregando: true, empresas: [], erro: '' });

  useEffect(() => {
    let ativo = true;
    supabase
      .from('empresas')
      .select('id, slug, dominio, nome, ativo, created_at')
      .order('created_at')
      .then(({ data, error }) => {
        if (ativo) setEstado({ carregando: false, empresas: data || [], erro: error?.message || '' });
      });
    return () => {
      ativo = false;
    };
  }, []);

  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display font-black uppercase text-3xl text-slate-900">Empresas</h1>
        <Link href="/empresa" className="btn-escuro">
          <Plus className="w-4 h-4" /> Nova empresa
        </Link>
      </div>

      {estado.carregando ? (
        <div className="cartao p-10 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        </div>
      ) : estado.erro ? (
        <p role="alert" className="cartao p-5 text-sm text-rose-700">Erro ao carregar: {estado.erro}</p>
      ) : (
        <ul className="grid sm:grid-cols-2 gap-3">
          {estado.empresas.map((e) => (
            <li key={e.id} className="cartao p-4 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-bold text-slate-900 truncate">{e.nome}</p>
                <a href={urlDaEmpresa(e, process.env.NEXT_PUBLIC_ROOT_DOMAIN)} target="_blank" rel="noreferrer" className="text-xs text-slate-500 hover:underline truncate block">
                  {e.dominio || `${e.slug}.${process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'localhost:3000'}`}
                </a>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {!e.ativo && <span className="chip border-rose-200 bg-rose-50 text-rose-700">Suspensa</span>}
                <Link href={`/empresa?id=${e.id}`} className="btn-secundario !py-1.5 !px-3 !text-xs">Abrir</Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
