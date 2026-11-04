import { PartyPopper } from 'lucide-react';
import PaginaPublica, { HeroPagina } from '@/components/pagina-publica';
import ReservaQuiosque from './reserva-quiosque';

export const metadata = {
  title: 'Quiosques para festas e eventos',
  description: 'Alugue um quiosque privativo para aniversários, churrascos e confraternizações de até 100 pessoas, com pré-pedido do cardápio.',
  alternates: { canonical: '/reservas/quiosques' },
};

export default function ReservaQuiosquesPage() {
  return (
    <PaginaPublica subtitulo="Quiosques & Eventos">
      <HeroPagina
        selo="Eventos privados"
        icone={PartyPopper}
        titulo="Sua festa no Resenha"
        descricao="Escolha o quiosque ideal para o tamanho da sua turma e monte o consumo do evento."
      />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <ReservaQuiosque />
      </div>
    </PaginaPublica>
  );
}
