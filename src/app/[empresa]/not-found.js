import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import PaginaPublica from '@/components/pagina-publica';

export const metadata = { title: 'Página não encontrada' };

export default function NotFound() {
  return (
    <PaginaPublica>
      <div className="max-w-xl mx-auto px-4 py-24 text-center">
        <p className="font-display font-black text-8xl text-red-600 leading-none">404</p>
        <h1 className="titulo-secao text-3xl mt-4">Bola fora!</h1>
        <p className="text-slate-500 mt-2">A página que você procurou não existe ou mudou de lugar.</p>
        <Link href="/" className="btn-primario mt-8">
          <ArrowLeft className="w-4 h-4" /> Voltar ao início
        </Link>
      </div>
    </PaginaPublica>
  );
}
