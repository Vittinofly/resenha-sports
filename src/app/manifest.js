import { NEGOCIO } from '@/lib/config';

export default function manifest() {
  return {
    name: NEGOCIO.nome,
    short_name: NEGOCIO.nomeCurto,
    description: NEGOCIO.slogan,
    start_url: '/',
    display: 'standalone',
    background_color: '#0f172a',
    theme_color: '#0f172a',
    lang: 'pt-BR',
    icons: [
      { src: '/icon', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/apple-icon', sizes: '180x180', type: 'image/png' },
    ],
    shortcuts: [
      { name: 'Reservar quadra', url: '/reservas/quadras' },
      { name: 'Cardápio', url: '/cardapio' },
      { name: 'Painel da equipe', url: '/admin' },
    ],
  };
}
