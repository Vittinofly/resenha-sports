import { NEGOCIO } from '@/lib/config';

export default function robots() {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/admin', '/login'] },
    sitemap: `${NEGOCIO.siteUrl}/sitemap.xml`,
  };
}
