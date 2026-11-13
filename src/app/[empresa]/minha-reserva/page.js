import { Suspense } from 'react';
import { Ticket } from 'lucide-react';
import PaginaPublica, { HeroPagina } from '@/components/pagina-publica';
import DetalheReservaCliente from './detalhe-reserva-cliente';

export const metadata = {
  title: 'Minha reserva',
  description: 'Acompanhe ou cancele sua reserva.',
  robots: { index: false, follow: false },
};

export default function MinhaReservaPage() {
  return (
    <PaginaPublica>
      <HeroPagina selo="Sua reserva" icone={Ticket} titulo="Minha reserva" descricao="Acompanhe o status e, se precisar, cancele para liberar o horário." />
      <div className="max-w-xl mx-auto px-4 py-8">
        <Suspense fallback={<div className="cartao h-64 animate-pulse" />}>
          <DetalheReservaCliente />
        </Suspense>
      </div>
    </PaginaPublica>
  );
}
