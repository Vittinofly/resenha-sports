import { Lock } from 'lucide-react';
import PaginaPublica, { HeroPagina } from '@/components/pagina-publica';
import { NEGOCIO } from '@/lib/config';
import { formatarTelefone } from '@/lib/formatadores';
import { GA_ID } from '@/lib/analytics';

export const metadata = {
  title: 'Política de privacidade',
  description: `Como o ${NEGOCIO.nome} trata seu nome e WhatsApp nas reservas online, conforme a LGPD.`,
  alternates: { canonical: '/privacidade' },
};

const SECOES = [
  {
    titulo: 'Quais dados coletamos',
    texto: [
      'Ao solicitar uma reserva coletamos apenas seu nome e número de WhatsApp, além dos detalhes da reserva (data, horário, local, número de pessoas e o pré-pedido, se houver).',
      'Não pedimos CPF, e-mail, endereço nem dados de pagamento pelo site.',
    ],
  },
  {
    titulo: 'Para que usamos',
    texto: [
      'Para registrar, confirmar e organizar sua reserva e falar com você pelo WhatsApp sobre ela (confirmação, lembrete, remarcação).',
      'Eventualmente podemos enviar convites e novidades pelo WhatsApp. Basta responder pedindo para não receber mais e removemos você da lista.',
      'A base legal é a execução do serviço que você solicitou e, para mensagens promocionais, nosso legítimo interesse, sempre com a opção de recusar (LGPD, art. 7º, V e IX).',
    ],
  },
  {
    titulo: 'Com quem compartilhamos',
    texto: [
      'Seus dados não são vendidos nem cedidos a terceiros. Ficam guardados em um banco de dados seguro (Supabase), acessível apenas pela nossa equipe com login e senha.',
    ],
  },
  {
    titulo: 'Dados guardados no seu aparelho',
    texto: [
      'Para agilizar sua próxima reserva, seu nome e WhatsApp ficam salvos no próprio navegador do seu celular ou computador. Para apagar, limpe os dados do site no navegador.',
      GA_ID
        ? 'Com a sua autorização (aviso de cookies), usamos o Google Analytics para medir visitas de forma anônima. Se você recusar, nada é carregado. Não usamos cookies de anúncios.'
        : 'Não usamos cookies de rastreamento nem de anúncios.',
    ],
  },
  {
    titulo: 'Por quanto tempo',
    texto: ['Mantemos o histórico de reservas enquanto for útil para o atendimento e obrigações legais. Você pode pedir a exclusão a qualquer momento.'],
  },
  {
    titulo: 'Seus direitos',
    texto: [
      'Você pode pedir acesso, correção ou exclusão dos seus dados, ou revogar o consentimento para mensagens, a qualquer momento, falando com a gente pelo WhatsApp ou no balcão.',
    ],
  },
];

export default function PrivacidadePage() {
  return (
    <PaginaPublica>
      <HeroPagina selo="LGPD" icone={Lock} titulo="Política de privacidade" descricao="Transparência sobre os poucos dados que usamos para cuidar da sua reserva." />
      <div className="max-w-3xl mx-auto px-4 py-10 space-y-8">
        {SECOES.map(({ titulo, texto }) => (
          <section key={titulo}>
            <h2 className="font-display font-bold uppercase text-2xl text-slate-900">{titulo}</h2>
            {texto.map((p) => (
              <p key={p} className="text-slate-700 leading-relaxed mt-2">{p}</p>
            ))}
          </section>
        ))}
        <section className="cartao p-5 text-sm text-slate-700">
          <p className="font-bold text-slate-900">Controlador dos dados</p>
          <p>{NEGOCIO.nome}{NEGOCIO.endereco && ` — ${NEGOCIO.endereco}${NEGOCIO.cidade ? `, ${NEGOCIO.cidade}` : ''}`}</p>
          {NEGOCIO.whatsapp && <p>Contato para assuntos de privacidade: WhatsApp {formatarTelefone(NEGOCIO.whatsapp)}</p>}
        </section>
      </div>
    </PaginaPublica>
  );
}
