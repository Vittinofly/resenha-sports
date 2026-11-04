import Link from 'next/link';
import { BookOpen, Utensils } from 'lucide-react';
import PaginaPublica, { HeroPagina } from '@/components/pagina-publica';
import CardapioViewer from '@/components/cardapioviewer';

export const metadata = {
  title: 'Cardápio',
  description: 'Espetinhos, porções, pratos, drinks e bebidas geladas. Confira o cardápio digital do Resenha Gastrobar com preços atualizados.',
  alternates: { canonical: '/cardapio' },
};

export default function CardapioPage() {
  return (
    <PaginaPublica subtitulo="Cardápio Digital & Bar">
      <HeroPagina
        selo="Cardápio digital"
        icone={BookOpen}
        titulo="Nosso cardápio"
        descricao="Espetinhos, porções, pratos e bebidas geladas para aproveitar na mesa, na quadra ou no seu evento."
      >
        <Link href="/reservas/mesas" className="btn-primario mt-6">
          <Utensils className="w-4 h-4" /> Reservar mesa com pré-pedido
        </Link>
      </HeroPagina>

      <div className="max-w-5xl mx-auto px-4 py-6">
        <CardapioViewer />
      </div>
    </PaginaPublica>
  );
}
