import { Dumbbell } from 'lucide-react';
import PaginaPublica, { HeroPagina } from '@/components/pagina-publica';
import ReservaQuadra from './reserva-quadra';
import { empresaDaRota, exigirModulo } from '@/lib/empresa-servidor';

export async function generateMetadata({ params }) {
  const empresa = await empresaDaRota(params);
  return {
    title: 'Reservar quadra',
    description: empresa.textos.seoQuadras,
    alternates: { canonical: '/reservas/quadras' },
  };
}

export default async function ReservaQuadrasPage({ params }) {
  const empresa = await empresaDaRota(params);
  exigirModulo(empresa, 'quadras');
  return (
    <PaginaPublica subtitulo="Reserva de Quadras">
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
