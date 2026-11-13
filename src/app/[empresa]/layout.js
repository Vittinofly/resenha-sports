import WhatsAppFlutuante from '@/components/whatsapp-flutuante';
import Analytics from '@/components/analytics';
import { EmpresaProvider } from '@/components/empresa-contexto';
import { EMPRESA_PADRAO, empresaDaRota } from '@/lib/empresa-servidor';
import { cssDaPaleta } from '@/lib/empresa';

// Só a empresa padrão é gerada no build; as demais são geradas na primeira visita.
export function generateStaticParams() {
  return [{ empresa: EMPRESA_PADRAO }];
}

export async function generateMetadata({ params }) {
  const empresa = await empresaDaRota(params);
  const { textos } = empresa;
  return {
    metadataBase: new URL(empresa.siteUrl),
    title: { default: textos.tituloSeo, template: `%s | ${textos.sufixoTitulo}` },
    description: textos.descricaoSeo,
    keywords: textos.palavrasChave,
    applicationName: empresa.nome,
    manifest: '/manifest.webmanifest',
    icons: { icon: '/icon', apple: '/apple-icon' },
    openGraph: {
      type: 'website',
      locale: 'pt_BR',
      siteName: empresa.nome,
      title: empresa.nome,
      description: empresa.slogan || textos.descricaoSeo,
      images: [{ url: '/og', width: 1200, height: 630, alt: empresa.nome }],
    },
    twitter: { card: 'summary_large_image' },
    formatDetection: { telephone: false },
    ...(empresa.googleVerification && { verification: { google: empresa.googleVerification } }),
  };
}

function dadosEstruturados(empresa) {
  const { siteUrl, modulos, quadras, textos } = empresa;
  const tipos = [modulos.quadras && 'SportsActivityLocation', (modulos.mesas || modulos.cardapio) && 'BarOrPub'].filter(Boolean);
  return {
    '@context': 'https://schema.org',
    '@type': tipos.length ? tipos : 'LocalBusiness',
    name: empresa.nome,
    description: empresa.slogan,
    url: siteUrl,
    acceptsReservations: true,
    ...(textos.cozinha && { servesCuisine: textos.cozinha }),
    ...(modulos.cardapio && { hasMenu: `${siteUrl}/cardapio` }),
    ...(modulos.quadras && {
      openingHoursSpecification: {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        opens: `${String(empresa.aberturaQuadras).padStart(2, '0')}:00`,
        closes: `${String(empresa.fechamentoQuadras).padStart(2, '0')}:00`,
      },
      amenityFeature: quadras.map((q) => ({ '@type': 'LocationFeatureSpecification', name: q.nome, value: true })),
    }),
    ...(empresa.reservaPrincipal && {
      potentialAction: {
        '@type': 'ReserveAction',
        target: { '@type': 'EntryPoint', urlTemplate: `${siteUrl}/reservas/${empresa.reservaPrincipal}`, actionPlatform: ['http://schema.org/DesktopWebPlatform', 'http://schema.org/MobileWebPlatform'] },
      },
    }),
    ...(empresa.whatsapp && { telephone: `+55${empresa.whatsapp}` }),
    ...(empresa.endereco && { address: { '@type': 'PostalAddress', streetAddress: empresa.endereco, addressLocality: empresa.cidade, addressCountry: 'BR' } }),
    ...(empresa.instagram && { sameAs: [`https://instagram.com/${empresa.instagram}`] }),
  };
}

export default async function LayoutEmpresa({ children, params }) {
  const empresa = await empresaDaRota(params);
  const css = cssDaPaleta(empresa.cor);

  return (
    <EmpresaProvider empresa={empresa}>
      {css && <style dangerouslySetInnerHTML={{ __html: css }} />}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(dadosEstruturados(empresa)).replace(/</g, '\\u003c') }} />
      {children}
      <WhatsAppFlutuante />
      <Analytics />
    </EmpresaProvider>
  );
}
