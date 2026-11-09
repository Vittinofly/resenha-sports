import { Geist, Geist_Mono, Barlow_Condensed } from 'next/font/google';
import './globals.css';
import { FeedbackProvider } from '@/components/feedback';
import WhatsAppFlutuante from '@/components/whatsapp-flutuante';
import Analytics from '@/components/analytics';
import { NEGOCIO, QUADRAS, ABERTURA_QUADRAS, FECHAMENTO_QUADRAS } from '@/lib/config';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  // Só usada no código Pix: não precisa ser pré-carregada em todas as páginas
  preload: false,
  subsets: ['latin'],
});

const display = Barlow_Condensed({
  variable: '--font-display-face',
  subsets: ['latin'],
  weight: ['700', '900'],
  display: 'swap',
});

export const metadata = {
  metadataBase: new URL(NEGOCIO.siteUrl),
  title: {
    default: `${NEGOCIO.nome} — Quadras, Gastrobar e Eventos`,
    template: `%s | ${NEGOCIO.nomeCurto} Sports & Gastrobar`,
  },
  description:
    'Reserve online quadras de Beach Tennis, Futevôlei e Padel, mesas no gastrobar e quiosques para festas. Cardápio digital com espetinhos, porções e bebidas geladas.',
  keywords: ['beach tennis', 'futevôlei', 'padel', 'aluguel de quadra', 'gastrobar', 'quiosque para festa', 'reserva de mesa', 'espetinho'],
  applicationName: NEGOCIO.nome,
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    siteName: NEGOCIO.nome,
    title: `${NEGOCIO.nome}`,
    description: 'Quadras de areia e padel, gastrobar e espaço para eventos. Reserve online em menos de 1 minuto.',
  },
  twitter: { card: 'summary_large_image' },
  formatDetection: { telephone: false },
  // Search Console: método "Tag HTML" — cole só o valor de content em NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
  ...(process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION && {
    verification: { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION },
  }),
};

export const viewport = {
  themeColor: '#0f172a',
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': ['SportsActivityLocation', 'BarOrPub'],
  name: NEGOCIO.nome,
  description: NEGOCIO.slogan,
  url: NEGOCIO.siteUrl,
  servesCuisine: 'Petiscos, espetinhos e bebidas',
  acceptsReservations: true,
  hasMenu: `${NEGOCIO.siteUrl}/cardapio`,
  openingHoursSpecification: {
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    opens: `${String(ABERTURA_QUADRAS).padStart(2, '0')}:00`,
    closes: `${String(FECHAMENTO_QUADRAS).padStart(2, '0')}:00`,
  },
  potentialAction: {
    '@type': 'ReserveAction',
    target: { '@type': 'EntryPoint', urlTemplate: `${NEGOCIO.siteUrl}/reservas/quadras`, actionPlatform: ['http://schema.org/DesktopWebPlatform', 'http://schema.org/MobileWebPlatform'] },
    result: { '@type': 'Reservation', name: 'Reserva de quadra' },
  },
  amenityFeature: QUADRAS.map((q) => ({ '@type': 'LocationFeatureSpecification', name: q.nome, value: true })),
  ...(NEGOCIO.whatsapp && { telephone: `+55${NEGOCIO.whatsapp}` }),
  ...(NEGOCIO.endereco && { address: { '@type': 'PostalAddress', streetAddress: NEGOCIO.endereco, addressLocality: NEGOCIO.cidade, addressCountry: 'BR' } }),
  ...(NEGOCIO.instagram && { sameAs: [`https://instagram.com/${NEGOCIO.instagram}`] }),
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" className={`${geistSans.variable} ${geistMono.variable} ${display.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
        <FeedbackProvider>
          {children}
          <WhatsAppFlutuante />
          <Analytics />
        </FeedbackProvider>
      </body>
    </html>
  );
}
