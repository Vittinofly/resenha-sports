// Decide, a partir do domínio acessado, se a requisição é da plataforma ou de
// qual empresa. Função pura: usada no proxy e coberta por testes.
//
//   plataforma.com.br          -> painel do super-usuário
//   clube.plataforma.com.br    -> empresa de slug "clube"
//   www.clubedoze.com.br       -> empresa com esse domínio próprio
//   localhost, *.vercel.app    -> empresa padrão (desenvolvimento e previews)
//
// Sem `raiz` configurada, todo domínio cai na empresa padrão: é assim que o
// site original continua no ar antes de a plataforma ter domínio próprio.
export function resolverHost(hostBruto, { raiz = '', padrao = 'resenha' } = {}) {
  const host = String(hostBruto || '').toLowerCase().split(':')[0];
  const dominioRaiz = String(raiz).toLowerCase().split(':')[0];

  if (dominioRaiz && (host === dominioRaiz || host === `www.${dominioRaiz}`)) return { tipo: 'plataforma' };
  if (dominioRaiz && host.endsWith(`.${dominioRaiz}`)) {
    return { tipo: 'empresa', chave: host.slice(0, -dominioRaiz.length - 1) };
  }

  if (host === 'plataforma.localhost') return { tipo: 'plataforma' };
  if (host.endsWith('.localhost')) return { tipo: 'empresa', chave: host.slice(0, -'.localhost'.length) };
  if (!dominioRaiz || !host || host === 'localhost' || host === '127.0.0.1' || host.endsWith('.vercel.app')) {
    return { tipo: 'empresa', chave: padrao };
  }

  return { tipo: 'empresa', chave: host.replace(/^www\./, '') };
}

// Endereço público de uma empresa (usado no painel da plataforma)
export function urlDaEmpresa({ slug, dominio }, raiz = '') {
  if (dominio) return `https://${dominio}`;
  const base = raiz || 'localhost:3000';
  return `${/^(localhost|127\.)/.test(base) ? 'http' : 'https'}://${slug}.${base}`;
}
