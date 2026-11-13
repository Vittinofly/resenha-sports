import { empresaDaRota } from '@/lib/empresa-servidor';

export async function GET(_request, { params }) {
  const empresa = await empresaDaRota(params);
  const atalhos = [
    empresa.modulos.quadras && { name: 'Reservar quadra', url: '/reservas/quadras' },
    empresa.modulos.cardapio && { name: 'Cardápio', url: '/cardapio' },
    { name: 'Painel da equipe', url: '/admin' },
  ].filter(Boolean);

  return Response.json(
    {
      name: empresa.nome,
      short_name: empresa.nomeCurto,
      description: empresa.slogan,
      start_url: '/',
      display: 'standalone',
      background_color: '#0f172a',
      theme_color: '#0f172a',
      lang: 'pt-BR',
      icons: [
        { src: '/icon', sizes: '512x512', type: 'image/png', purpose: 'any' },
        { src: '/apple-icon', sizes: '180x180', type: 'image/png' },
      ],
      shortcuts: atalhos,
    },
    { headers: { 'Content-Type': 'application/manifest+json' } }
  );
}
