import { Dumbbell, Utensils, PartyPopper } from 'lucide-react';
import { STATUS } from '@/lib/config';

export const ICONE_TIPO = { quadras: Dumbbell, mesas: Utensils, quiosques: PartyPopper };

export function BadgeStatus({ status }) {
  const info = STATUS[status] || { label: status || '—', classe: 'bg-slate-100 text-slate-600 border-slate-200' };
  return <span className={`chip ${info.classe}`}>{info.label}</span>;
}

export function IconeTipo({ tipo, className = 'w-4 h-4' }) {
  const Icone = ICONE_TIPO[tipo] || Dumbbell;
  return <Icone className={className} />;
}

export function CabecalhoPagina({ titulo, descricao, children }) {
  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
      <div>
        <h1 className="font-display font-black uppercase text-3xl tracking-tight text-slate-900">{titulo}</h1>
        {descricao && <p className="text-sm text-slate-500 mt-0.5">{descricao}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}

// Tile de indicador. `tom` controla apenas o ícone; o número fica sempre na cor de texto.
export function Indicador({ rotulo, valor, detalhe, icone: Icone, tom = 'slate' }) {
  const tons = {
    slate: 'bg-slate-100 text-slate-700',
    red: 'bg-red-50 text-red-600',
    amber: 'bg-amber-50 text-amber-600',
    emerald: 'bg-emerald-50 text-emerald-600',
  };
  return (
    <div className="cartao p-4 flex items-start gap-3">
      {Icone && (
        <span className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${tons[tom]}`}>
          <Icone className="w-5 h-5" />
        </span>
      )}
      <div className="min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{rotulo}</p>
        <p className="font-display font-black text-3xl text-slate-900 leading-none mt-1 tabular-nums">{valor}</p>
        {detalhe && <p className="text-xs text-slate-500 mt-1">{detalhe}</p>}
      </div>
    </div>
  );
}

export function Vazio({ icone: Icone, titulo, children }) {
  return (
    <div className="text-center py-12 px-4">
      {Icone && <Icone className="w-10 h-10 text-slate-300 mx-auto" />}
      <p className="font-bold text-slate-700 mt-3">{titulo}</p>
      {children && <div className="text-sm text-slate-500 mt-1">{children}</div>}
    </div>
  );
}

export function Segmentado({ opcoes, valor, aoMudar, rotulo }) {
  return (
    <div className="flex gap-1 bg-slate-100 p-1 rounded-xl overflow-x-auto [scrollbar-width:none]" role="radiogroup" aria-label={rotulo}>
      {opcoes.map((o) => (
        <button
          key={o.valor}
          type="button"
          role="radio"
          aria-checked={valor === o.valor}
          onClick={() => aoMudar(o.valor)}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
            valor === o.valor ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          {o.label}
          {o.contagem > 0 && <span className="bg-red-600 text-white rounded-full px-1.5 text-[10px] leading-4">{o.contagem}</span>}
        </button>
      ))}
    </div>
  );
}
