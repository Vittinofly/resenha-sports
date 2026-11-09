'use client';

import { CalendarDays } from 'lucide-react';
import { useHoje } from '@/lib/hooks';
import { somarDias } from '@/lib/formatadores';

function partesDia(dataISO) {
  const [a, m, d] = dataISO.split('-').map(Number);
  const data = new Date(a, m - 1, d);
  return {
    semana: data.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', ''),
    dia: String(d).padStart(2, '0'),
    mes: data.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''),
  };
}

// Chips com os próximos `dias` dias + campo para escolher qualquer outra data.
// `aPartirDe` = antecedência mínima em dias (0 = a partir de hoje).
export default function SeletorData({ valor, aoMudar, dias = 14, maxDias = 120, aPartirDe = 0 }) {
  const hoje = useHoje();

  if (!hoje) {
    return <div className="h-[74px] rounded-2xl bg-slate-100 animate-pulse" aria-busy="true" />;
  }

  const minimo = somarDias(hoje, aPartirDe);
  const opcoes = Array.from({ length: dias }, (_, i) => somarDias(minimo, i));
  const foraDaLista = valor && !opcoes.includes(valor);
  const rotuloRelativo = (data, semana) => (data === hoje ? 'Hoje' : data === somarDias(hoje, 1) ? 'Amanhã' : semana);

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 [scrollbar-width:thin]" role="radiogroup" aria-label="Data">
      {opcoes.map((data) => {
        const { semana, dia, mes } = partesDia(data);
        const ativo = valor === data;
        return (
          <button
            key={data}
            type="button"
            role="radio"
            aria-checked={ativo}
            onClick={() => aoMudar(data)}
            className={`shrink-0 w-16 py-2 rounded-2xl border text-center transition ${
              ativo ? 'bg-red-600 border-red-600 text-white shadow-md shadow-red-900/20' : 'bg-white border-slate-200 text-slate-700 hover:border-red-300'
            }`}
          >
            <span className={`block text-[10px] font-bold uppercase ${ativo ? 'text-white' : 'text-slate-500'}`}>
              {rotuloRelativo(data, semana)}
            </span>
            <span className="block font-display font-black text-2xl leading-none mt-0.5">{dia}</span>
            <span className={`block text-[10px] font-semibold uppercase ${ativo ? 'text-white' : 'text-slate-500'}`}>{mes}</span>
          </button>
        );
      })}

      <label
        className={`shrink-0 relative w-24 py-2 rounded-2xl border text-center cursor-pointer transition flex flex-col items-center justify-center ${
          foraDaLista ? 'bg-red-600 border-red-600 text-white' : 'bg-white border-dashed border-slate-300 text-slate-500 hover:border-red-300'
        }`}
      >
        <CalendarDays className="w-5 h-5" />
        <span className="text-[10px] font-bold uppercase mt-1">{foraDaLista ? valor.split('-').reverse().slice(0, 2).join('/') : 'Outra data'}</span>
        <input
          type="date"
          min={minimo}
          max={somarDias(hoje, maxDias)}
          value={valor || ''}
          onChange={(e) => e.target.value && e.target.value >= minimo && aoMudar(e.target.value)}
          className="absolute inset-0 opacity-0 cursor-pointer"
          aria-label="Escolher outra data"
        />
      </label>
    </div>
  );
}
