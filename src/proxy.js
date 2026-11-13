import { NextResponse } from 'next/server';
import { resolverHost } from '@/lib/host-empresa';

// Reescreve a URL internamente conforme o domínio: o visitante continua vendo
// "/reservas/quadras", mas a rota servida é "/<empresa>/reservas/quadras".
// Como todo caminho ganha o prefixo, abrir "/outra-empresa/admin" em um domínio
// vira "/empresa-atual/outra-empresa/admin", que não existe: não há como
// alcançar outra empresa pelo caminho.
export function proxy(request) {
  const destino = resolverHost(request.headers.get('host'), {
    raiz: process.env.NEXT_PUBLIC_ROOT_DOMAIN || '',
    padrao: process.env.NEXT_PUBLIC_EMPRESA_PADRAO || 'resenha',
  });

  const prefixo = destino.tipo === 'plataforma' ? '/plataforma' : `/${destino.chave}`;
  const url = request.nextUrl.clone();
  url.pathname = `${prefixo}${url.pathname === '/' ? '' : url.pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ['/((?!api/|_next/).*)'],
};
