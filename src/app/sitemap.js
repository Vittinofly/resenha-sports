import { NEGOCIO } from '@/lib/config';

export default function sitemap() {
  const rotas = [
    { caminho: '', prioridade: 1 },
    { caminho: '/reservas/quadras', prioridade: 0.9 },
    { caminho: '/reservas/quiosques', prioridade: 0.8 },
    { caminho: '/reservas/mesas', prioridade: 0.8 },
    { caminho: '/cardapio', prioridade: 0.7 },
  ];
  return rotas.map(({ caminho, prioridade }) => ({
    url: `${NEGOCIO.siteUrl}${caminho}`,
    changeFrequency: 'weekly',
    priority: prioridade,
  }));
}
