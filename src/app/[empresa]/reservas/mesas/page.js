import { Utensils } from 'lucide-react';
import PaginaPublica, { HeroPagina } from '@/components/pagina-publica';
import ReservaMesa from './reserva-mesa';
import { empresaDaRota, exigirModulo } from '@/lib/empresa-servidor';

export async function generateMetadata({ params }) {
  const empresa = await empresaDaRota(params);
  return {
    title: 'Reservar mesa',
    description: empresa.textos.seoMesas,
    alternates: { canonical: '/reservas/mesas' },
  };
}

export default async function ReservaMesasPage({ params }) {
  const empresa = await empresaDaRota(params);
  exigirModulo(empresa, 'mesas');
  return (
    <PaginaPublica subtitulo="Reserva de Mesas">
      <HeroPagina
        selo="Reserva de mesa"
        icone={Utensils}
        titulo="Reserve sua mesa"
        descricao="Garanta seu lugar e, se quiser, já deixe os petiscos e as bebidas encaminhados."
      />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <ReservaMesa />
      </div>
    </PaginaPublica>
  );
}
