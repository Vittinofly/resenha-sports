import Link from 'next/link';
import { BookOpen, Utensils } from 'lucide-react';
import PaginaPublica, { HeroPagina } from '@/components/pagina-publica';
import CardapioViewer from '@/components/cardapioviewer';
import { empresaDaRota, exigirModulo } from '@/lib/empresa-servidor';

export async function generateMetadata({ params }) {
  const empresa = await empresaDaRota(params);
  return {
    title: 'Cardápio',
    description: empresa.textos.seoCardapio,
    alternates: { canonical: '/cardapio' },
  };
}

export default async function CardapioPage({ params }) {
  const empresa = await empresaDaRota(params);
  exigirModulo(empresa, 'cardapio');
  return (
    <PaginaPublica subtitulo="Cardápio Digital">
      <HeroPagina
        selo="Cardápio digital"
        icone={BookOpen}
        titulo="Nosso cardápio"
        descricao={empresa.textos.servicoCardapio}
      >
        {empresa.modulos.mesas && (
          <Link href="/reservas/mesas" className="btn-primario mt-6">
            <Utensils className="w-4 h-4" /> Reservar mesa com pré-pedido
          </Link>
        )}
      </HeroPagina>

      <div className="max-w-5xl mx-auto px-4 py-6">
        <CardapioViewer />
      </div>
    </PaginaPublica>
  );
}
