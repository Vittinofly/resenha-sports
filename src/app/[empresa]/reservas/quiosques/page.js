import { PartyPopper } from 'lucide-react';
import PaginaPublica, { HeroPagina } from '@/components/pagina-publica';
import ReservaQuiosque from './reserva-quiosque';
import { empresaDaRota, exigirModulo } from '@/lib/empresa-servidor';

export async function generateMetadata({ params }) {
  const empresa = await empresaDaRota(params);
  return {
    title: 'Quiosques para festas e eventos',
    description: empresa.textos.seoQuiosques,
    alternates: { canonical: '/reservas/quiosques' },
  };
}

export default async function ReservaQuiosquesPage({ params }) {
  const empresa = await empresaDaRota(params);
  exigirModulo(empresa, 'quiosques');
  return (
    <PaginaPublica subtitulo="Quiosques & Eventos">
      <HeroPagina
        selo="Eventos privados"
        icone={PartyPopper}
        titulo={empresa.textos.tituloEventos}
        descricao="Escolha o quiosque ideal para o tamanho da sua turma e monte o consumo do evento."
      />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <ReservaQuiosque />
      </div>
    </PaginaPublica>
  );
}
