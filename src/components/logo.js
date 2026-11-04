import { Flame } from 'lucide-react';

export default function Logo({ subtitulo, claro = false, tamanho = 'md' }) {
  const caixa = tamanho === 'lg' ? 'w-14 h-14 rounded-2xl' : 'w-11 h-11 rounded-xl';
  const chama = tamanho === 'lg' ? 'w-8 h-8' : 'w-6 h-6';

  return (
    <span className="flex items-center gap-3">
      <span className={`relative flex items-center justify-center ${caixa} bg-slate-900 ring-1 ring-white/10 shadow-md`}>
        <Flame className={`${chama} text-red-600 fill-red-600`} />
        <span className="absolute text-white font-black text-[10px] bottom-1">R</span>
      </span>
      <span className="leading-none">
        <span className="flex items-baseline gap-1.5">
          <span className={`font-display font-black text-2xl tracking-tight ${claro ? 'text-white' : 'text-slate-900'}`}>RESENHA</span>
          <span className="text-[10px] font-black text-red-600 tracking-[0.2em] uppercase">Gastrobar</span>
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
