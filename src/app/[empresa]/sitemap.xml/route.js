import { empresaDaRota } from '@/lib/empresa-servidor';

export async function GET(_request, { params }) {
  const empresa = await empresaDaRota(params);
  const { modulos, siteUrl } = empresa;
  const rotas = [
    { caminho: '', prioridade: 1 },
    modulos.quadras && { caminho: '/reservas/quadras', prioridade: 0.9 },
    modulos.quiosques && { caminho: '/reservas/quiosques', prioridade: 0.8 },
    modulos.mesas && { caminho: '/reservas/mesas', prioridade: 0.8 },
    modulos.cardapio && { caminho: '/cardapio', prioridade: 0.7 },
    { caminho: '/privacidade', prioridade: 0.2 },
  ].filter(Boolean);

  const urls = rotas.map(({ caminho, prioridade }) => `  <url><loc>${siteUrl}${caminho}</loc><changefreq>weekly</changefreq><priority>${prioridade}</priority></url>`);
  const corpo = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`;
  return new Response(corpo, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
}
