import { Dumbbell } from 'lucide-react';
import PaginaPublica, { HeroPagina } from '@/components/pagina-publica';
import ReservaQuadra from './reserva-quadra';

export const metadata = {
  title: 'Reservar quadra de Beach Tennis, Futevôlei e Padel',
  description: 'Veja os horários livres em tempo real e reserve sua quadra de Beach Tennis, Futevôlei ou Padel online, sem cadastro.',
  alternates: { canonical: '/reservas/quadras' },
};

export default function ReservaQuadrasPage() {
  return (
    <PaginaPublica subtitulo="Quadras de Areia & Padel">
      <HeroPagina
        selo="Esportes & lazer"
        icone={Dumbbell}
        titulo="Reserve sua quadra"
        descricao="Horários atualizados em tempo real. Escolha a quadra, o dia e quanto tempo quer jogar."
      />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <ReservaQuadra />
      </div>
    </PaginaPublica>
  );
}
