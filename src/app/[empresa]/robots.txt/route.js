import { empresaDaRota } from '@/lib/empresa-servidor';

export async function GET(_request, { params }) {
  const empresa = await empresaDaRota(params);
  const corpo = ['User-agent: *', 'Allow: /', 'Disallow: /admin', 'Disallow: /login', 'Disallow: /minha-reserva', '', `Sitemap: ${empresa.siteUrl}/sitemap.xml`, ''].join('\n');
  return new Response(corpo, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
