import { Utensils } from 'lucide-react';
import PaginaPublica, { HeroPagina } from '@/components/pagina-publica';
import ReservaMesa from './reserva-mesa';

export const metadata = {
  title: 'Reservar mesa no gastrobar',
  description: 'Reserve sua mesa no Resenha Gastrobar e adiante seu pedido de espetinhos, porções e bebidas.',
  alternates: { canonical: '/reservas/mesas' },
};

export default function ReservaMesasPage() {
  return (
    <PaginaPublica subtitulo="Reserva de Mesas">
      <HeroPagina
        selo="Gastrobar & restaurante"
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
