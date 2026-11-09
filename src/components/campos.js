'use client';

import { useId } from 'react';
import Link from 'next/link';
import { User, Phone, UserCheck } from 'lucide-react';
import { formatarTelefone, apenasDigitos } from '@/lib/formatadores';

// Nome + WhatsApp com máscara. `valor` = { cliente_nome, cliente_whatsapp } (whatsapp só dígitos)
export function CamposContato({ nome, whatsapp, aoMudar, contatoSalvo, mostrarErros }) {
  const idNome = useId();
  const idFone = useId();
  const foneInvalido = mostrarErros && whatsapp && !(whatsapp.length === 10 || whatsapp.length === 11);
  const podeUsarSalvo = contatoSalvo && !nome && !whatsapp;

  return (
    <div className="space-y-3">
      {podeUsarSalvo && (
        <button
          type="button"
          onClick={() => aoMudar({ cliente_nome: contatoSalvo.nome, cliente_whatsapp: contatoSalvo.whatsapp })}
          className="w-full flex items-center gap-3 p-3 rounded-2xl border border-dashed border-red-300 bg-red-50/60 hover:bg-red-50 text-left transition"
        >
          <UserCheck className="w-5 h-5 text-red-600 shrink-0" />
          <span className="text-xs text-slate-700">
            Usar meus dados: <strong className="text-slate-900">{contatoSalvo.nome}</strong> · {formatarTelefone(contatoSalvo.whatsapp)}
          </span>
        </button>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor={idNome} className="rotulo">Seu nome *</label>
          <div className="relative">
            <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id={idNome}
              type="text"
              required
              minLength={3}
              autoComplete="name"
              placeholder="Como devemos te chamar?"
              value={nome}
              maxLength={80}
              onChange={(e) => aoMudar({ cliente_nome: e.target.value.replace(/[^a-zA-ZÀ-ÖØ-öø-ÿ'.\-\s]/g, '') })}
              className="input pl-10"
            />
          </div>
        </div>

        <div>
          <label htmlFor={idFone} className="rotulo">WhatsApp *</label>
          <div className="relative">
            <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id={idFone}
              type="tel"
              required
              inputMode="numeric"
              autoComplete="tel-national"
              placeholder="(11) 99999-9999"
              value={formatarTelefone(whatsapp)}
              onChange={(e) => aoMudar({ cliente_whatsapp: apenasDigitos(e.target.value).slice(0, 11) })}
              aria-invalid={foneInvalido || undefined}
              className={`input pl-10 ${foneInvalido ? 'ring-2 ring-red-500' : ''}`}
            />
          </div>
          <p className={`text-[11px] mt-1 ${foneInvalido ? 'text-red-600 font-semibold' : 'text-slate-500'}`}>
            {foneInvalido ? 'Informe DDD + número (10 ou 11 dígitos).' : 'A confirmação chega por aqui.'}
          </p>
        </div>
      </div>
      <p className="text-[11px] text-slate-500">
        Usamos seu nome e WhatsApp só para cuidar da reserva. Veja a{' '}
        <Link href="/privacidade" target="_blank" className="font-semibold underline hover:text-slate-800">política de privacidade</Link>.
      </p>
    </div>
  );
}
