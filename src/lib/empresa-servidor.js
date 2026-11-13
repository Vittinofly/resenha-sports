import { cacheLife, cacheTag } from 'next/cache';
import { notFound } from 'next/navigation';
import { normalizarEmpresa } from '@/lib/empresa';

export const EMPRESA_PADRAO = process.env.NEXT_PUBLIC_EMPRESA_PADRAO || 'resenha';

const COLUNAS = 'id,slug,dominio,nome,ativo,config';

export const ambienteEmpresa = () => ({
  raiz: process.env.NEXT_PUBLIC_ROOT_DOMAIN || '',
  padrao: EMPRESA_PADRAO,
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || '',
  contato: {
    whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_CONTATO,
    instagram: process.env.NEXT_PUBLIC_INSTAGRAM,
    endereco: process.env.NEXT_PUBLIC_ENDERECO,
    cidade: process.env.NEXT_PUBLIC_CIDADE,
    mapsUrl: process.env.NEXT_PUBLIC_MAPS_URL,
    pixChave: process.env.NEXT_PUBLIC_PIX_CHAVE,
    pixTitular: process.env.NEXT_PUBLIC_PIX_TITULAR,
    pixCidade: process.env.NEXT_PUBLIC_PIX_CIDADE,
    gaId: process.env.NEXT_PUBLIC_GA_ID,
    googleVerification: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
  },
});

// `chave` é o subdomínio (slug) ou, quando tem ponto, o domínio próprio.
// Fica em cache por 1 minuto: alterações feitas no painel chegam ao site nesse prazo.
// Uma falha de rede lança erro (e não entra no cache); empresa inexistente devolve null.
export async function carregarEmpresa(chave) {
  'use cache';
  cacheLife('minutes');
  cacheTag(`empresa-${chave}`);

  if (!/^[a-z0-9.-]{1,253}$/.test(chave)) return null;

  const coluna = chave.includes('.') ? 'dominio' : 'slug';
  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/empresas?select=${COLUNAS}&ativo=eq.true&${coluna}=eq.${encodeURIComponent(chave)}&limit=1`;
  const chaveApi = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const resposta = await fetch(url, { headers: { apikey: chaveApi, Authorization: `Bearer ${chaveApi}` } });

  if (!resposta.ok) {
    throw new Error(`Não foi possível carregar a empresa "${chave}" (HTTP ${resposta.status}). Confira se supabase/multi-tenant.sql foi executado.`);
  }

  const [linha] = await resposta.json();
  return linha ? normalizarEmpresa(linha, ambienteEmpresa()) : null;
}

// Empresa do segmento [empresa] da rota; responde 404 se não existir ou estiver suspensa
export async function empresaDaRota(params) {
  const { empresa: chave } = await params;
  const empresa = await carregarEmpresa(decodeURIComponent(chave));
  if (!empresa) notFound();
  return empresa;
}

// 404 quando a empresa não contratou/ativou aquela parte do site
export function exigirModulo(empresa, modulo) {
  if (!empresa.modulos[modulo]) notFound();
}
