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
    icons: [{ src: '/favicon.ico', sizes: 'any', type: 'image/x-icon' }],
  };
}
