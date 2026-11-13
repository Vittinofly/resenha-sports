'use client';

import { Flame } from 'lucide-react';
import { useEmpresa } from '@/components/empresa-contexto';

export default function Logo({ subtitulo, claro = false, tamanho = 'md' }) {
  const { nomeCurto, marcaDestaque, inicial, logoUrl } = useEmpresa();
  const caixa = tamanho === 'lg' ? 'w-14 h-14 rounded-2xl' : 'w-11 h-11 rounded-xl';
  const chama = tamanho === 'lg' ? 'w-8 h-8' : 'w-6 h-6';

  return (
    <span className="flex items-center gap-3">
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- logo enviada pela empresa, em domínio arbitrário
        <img src={logoUrl} alt="" className={`${caixa} object-cover bg-slate-900`} />
      ) : (
        <span className={`relative flex items-center justify-center ${caixa} bg-slate-900 ring-1 ring-white/10 shadow-md`}>
          <Flame className={`${chama} text-red-600 fill-red-600`} />
          <span className="absolute text-white font-black text-[10px] bottom-1">{inicial}</span>
        </span>
      )}
      <span className="leading-none">
        <span className="flex items-baseline gap-1.5">
          <span className={`font-display font-black text-2xl tracking-tight uppercase ${claro ? 'text-white' : 'text-slate-900'}`}>{nomeCurto}</span>
          {marcaDestaque && (
            <span className={`text-[10px] font-black tracking-[0.2em] uppercase ${claro ? 'text-red-400' : 'text-red-700'}`}>{marcaDestaque}</span>
          )}
        </span>
        {subtitulo && (
          <span className={`block text-[10px] font-semibold tracking-wider uppercase mt-1 ${claro ? 'text-slate-400' : 'text-slate-500'}`}>
            {subtitulo}
          </span>
        )}
      </span>
    </span>
  );
}
