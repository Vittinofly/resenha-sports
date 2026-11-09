import { NEGOCIO } from '@/lib/config';

export default function robots() {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/admin', '/login', '/minha-reserva'] },
    sitemap: `${NEGOCIO.siteUrl}/sitemap.xml`,
  };
}
