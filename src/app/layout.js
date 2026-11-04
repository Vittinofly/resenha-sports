import { Geist, Geist_Mono, Barlow_Condensed } from 'next/font/google';
import './globals.css';
import { FeedbackProvider } from '@/components/feedback';
import WhatsAppFlutuante from '@/components/whatsapp-flutuante';
import { NEGOCIO, QUADRAS } from '@/lib/config';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const display = Barlow_Condensed({
  variable: '--font-display-face',
  subsets: ['latin'],
  weight: ['600', '700', '800', '900'],
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
        </FeedbackProvider>
      </body>
    </html>
  );
}
