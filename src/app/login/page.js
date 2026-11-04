import Link from 'next/link';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import Logo from '@/components/logo';
import FormularioLogin from './formulario-login';

export const metadata = {
  title: 'Acesso da equipe',
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-10 bg-slate-950 relative overflow-hidden">
      <div className="absolute inset-0 fundo-quadra" aria-hidden="true" />
      <div className="absolute -right-32 -top-32 w-96 h-96 rounded-full bg-red-600/25 blur-3xl" aria-hidden="true" />

      <div className="relative w-full max-w-md">
        <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white mb-4">
          <ArrowLeft className="w-3.5 h-3.5" /> Voltar ao site
        </Link>

        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div className="bg-slate-900 p-6 sm:p-8 border-b-4 border-red-600 flex flex-col items-center gap-3 text-center">
            <Logo claro tamanho="lg" subtitulo="Sports Center & Gastrobar" />
            <span className="chip border-red-500/40 bg-red-500/10 text-red-300 uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5" /> Acesso da equipe
            </span>
          </div>
          <FormularioLogin />
        </div>
      </div>
    </div>
  );
}
