// Converte `empresas.config` <-> campos do formulário de empresa. As listas
// (quadras, quiosques) são editadas como texto, uma por linha, separadas por ";".
const linhas = (texto) => String(texto || '').split('\n').map((l) => l.trim()).filter(Boolean);
const colunas = (linha) => linha.split(';').map((c) => c.trim());
const virgulas = (texto) => String(texto || '').split(',').map((c) => c.trim()).filter(Boolean);
const numero = (v) => Number(String(v ?? '').replace(',', '.')) || 0;

export const SLUG_VALIDO = /^[a-z0-9]([a-z0-9-]{0,38}[a-z0-9])?$/;
export const SLUGS_RESERVADOS = ['www', 'api', 'app', 'admin', 'plataforma', 'login', 'painel', 'mail', 'ftp', 'static', 'cdn'];
export const DOMINIO_VALIDO = /^[a-z0-9-]+(\.[a-z0-9-]+)+$/;

export function gerarSlug(nome) {
  return String(nome || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
    .replace(/-+$/, '');
}

export function configParaFormulario(linha = {}) {
  const c = linha.config || {};
  const s = c.sinal || {};
  const t = c.textos || {};
  return {
    nome: linha.nome || '',
    slug: linha.slug || '',
    dominio: linha.dominio || '',
    ativo: linha.ativo !== false,
    nomeCurto: c.nomeCurto || '',
    marcaDestaque: c.marcaDestaque || '',
    subtitulo: c.subtitulo || '',
    slogan: c.slogan || '',
    cor: c.cor || 'vermelho',
    logoUrl: c.logoUrl || '',
    whatsapp: c.whatsapp || '',
    instagram: c.instagram || '',
    endereco: c.endereco || '',
    cidade: c.cidade || '',
    mapsUrl: c.mapsUrl || '',
    moduloQuadras: c.modulos?.quadras ?? !linha.id,
    moduloMesas: c.modulos?.mesas ?? false,
    moduloQuiosques: c.modulos?.quiosques ?? false,
    moduloCardapio: c.modulos?.cardapio ?? false,
    horarios: (c.horarioFuncionamento || []).map((h) => `${h.dias}; ${h.horas}`).join('\n'),
    aberturaQuadras: String(c.aberturaQuadras ?? 8),
    fechamentoQuadras: String(c.fechamentoQuadras ?? 22),
    quadras: (c.quadras || []).map((q) => [q.nome, q.curto, q.esportes, q.piso].join('; ')).join('\n'),
    aberturaMesas: c.aberturaMesas || '11:00',
    ultimaChegadaMesas: c.ultimaChegadaMesas || '22:00',
    maxPessoasMesa: String(c.maxPessoasMesa ?? 30),
    quiosques: (c.quiosques || []).map((q) => [q.nome, q.curto, q.capacidade, q.ideal].join('; ')).join('\n'),
    tiposEvento: (c.tiposEvento || []).join(', '),
    categoriasCardapio: (c.categoriasCardapio || []).join(', '),
    pixChave: c.pix?.chave || '',
    pixTitular: c.pix?.titular || '',
    pixCidade: c.pix?.cidade || '',
    sinalQuiosques: String(s.quiosques ?? 0),
    sinalMesas: String(s.mesas ?? 0),
    sinalHora: String(s.quadras?.valorPorHora ?? 0),
    sinalAPartirDe: s.quadras?.aPartirDe || '18:00',
    sinalFimDeSemana: s.quadras?.fimDeSemanaTodo ?? true,
    sinalPrazo: String(s.prazoHoras ?? 24),
    gaId: c.gaId || '',
    googleVerification: c.googleVerification || '',
    seloHero: t.seloHero || '',
    tituloHero: (t.tituloHero || []).join('\n'),
    descricaoHero: t.descricaoHero || '',
    descricaoSeo: t.descricaoSeo || '',
    tituloEventos: t.tituloEventos || '',
    descricaoEventos: t.descricaoEventos || '',
  };
}

// Devolve { linha } pronta para gravar, ou { erro }.
// `configAtual` preserva campos que o formulário não edita.
export function formularioParaLinha(f, configAtual = {}) {
  const nome = f.nome.trim();
  if (nome.length < 2) return { erro: 'Informe o nome da empresa.' };

  const quadras = linhas(f.quadras).map((l, i) => {
    const [nomeQuadra, curto, esportes, piso] = colunas(l);
    return { id: configAtual.quadras?.find((q) => q.nome === nomeQuadra)?.id || `q${i + 1}`, nome: nomeQuadra, curto: curto || nomeQuadra, esportes: esportes || '', piso: piso || '' };
  });
  const quiosques = linhas(f.quiosques).map((l, i) => {
    const [nomeQuiosque, curto, capacidade, ideal] = colunas(l);
    return { id: configAtual.quiosques?.find((q) => q.nome === nomeQuiosque)?.id || `q${i + 1}`, nome: nomeQuiosque, curto: curto || nomeQuiosque, capacidade: Number(capacidade), ideal: ideal || '' };
  });

  if (f.moduloQuadras && !quadras.length) return { erro: 'Cadastre pelo menos uma quadra ou desligue o módulo de quadras.' };
  if (f.moduloQuiosques && !quiosques.length) return { erro: 'Cadastre pelo menos um quiosque ou desligue o módulo de quiosques.' };
  // O nome do quiosque é gravado em tipo_evento, onde "|" separa os campos
  if ([...quadras, ...quiosques].some((q) => !q.nome || q.nome.includes('|'))) return { erro: 'Quadras e quiosques precisam de nome, sem o caractere "|".' };
  if (new Set(quadras.map((q) => q.nome)).size < quadras.length || new Set(quiosques.map((q) => q.nome)).size < quiosques.length) {
    return { erro: 'Há nomes repetidos em quadras ou quiosques.' };
  }
  if (quiosques.some((q) => !Number.isInteger(q.capacidade) || q.capacidade < 1)) return { erro: 'Informe a capacidade de cada quiosque (número inteiro).' };

  const aberturaQuadras = Number(f.aberturaQuadras);
  const fechamentoQuadras = Number(f.fechamentoQuadras);
  if (!Number.isInteger(aberturaQuadras) || !Number.isInteger(fechamentoQuadras) || aberturaQuadras < 0 || fechamentoQuadras > 23 || fechamentoQuadras <= aberturaQuadras) {
    return { erro: 'Horário das quadras inválido: use horas cheias entre 0 e 23, com fechamento depois da abertura.' };
  }
  if (f.aberturaMesas > f.ultimaChegadaMesas) return { erro: 'A última chegada das mesas precisa ser depois da abertura.' };
  if (Number(f.maxPessoasMesa) < 1) return { erro: 'Informe o máximo de pessoas por mesa.' };

  const horarioFuncionamento = linhas(f.horarios).map((l) => {
    const [dias, horas] = colunas(l);
    return { dias, horas: horas || '' };
  });

  const tituloHero = linhas(f.tituloHero);
  const textos = { ...(configAtual.textos || {}) };
  for (const campo of ['seloHero', 'descricaoHero', 'descricaoSeo', 'tituloEventos', 'descricaoEventos']) {
    if (f[campo].trim()) textos[campo] = f[campo].trim();
    else delete textos[campo];
  }
  if (tituloHero.length) textos.tituloHero = tituloHero;
  else delete textos.tituloHero;

  const config = {
    ...configAtual,
    nomeCurto: f.nomeCurto.trim() || nome,
    marcaDestaque: f.marcaDestaque.trim(),
    subtitulo: f.subtitulo.trim(),
    slogan: f.slogan.trim(),
    cor: f.cor,
    logoUrl: f.logoUrl.trim(),
    whatsapp: f.whatsapp.replace(/\D/g, ''),
    instagram: f.instagram.trim(),
    endereco: f.endereco.trim(),
    cidade: f.cidade.trim(),
    mapsUrl: f.mapsUrl.trim(),
    modulos: { quadras: f.moduloQuadras, mesas: f.moduloMesas, quiosques: f.moduloQuiosques, cardapio: f.moduloCardapio },
    horarioFuncionamento,
    aberturaQuadras,
    fechamentoQuadras,
    quadras,
    aberturaMesas: f.aberturaMesas,
    ultimaChegadaMesas: f.ultimaChegadaMesas,
    maxPessoasMesa: Number(f.maxPessoasMesa),
    quiosques,
    tiposEvento: virgulas(f.tiposEvento),
    categoriasCardapio: virgulas(f.categoriasCardapio),
    pix: { chave: f.pixChave.trim(), titular: f.pixTitular.trim(), cidade: f.pixCidade.trim() },
    sinal: {
      quiosques: numero(f.sinalQuiosques),
      mesas: numero(f.sinalMesas),
      quadras: { valorPorHora: numero(f.sinalHora), aPartirDe: f.sinalAPartirDe, fimDeSemanaTodo: f.sinalFimDeSemana },
      prazoHoras: numero(f.sinalPrazo) || 24,
    },
    gaId: f.gaId.trim(),
    googleVerification: f.googleVerification.trim(),
    textos,
  };

  return { linha: { nome, config } };
}

// Campos que só o super-usuário altera. Devolve { campos } ou { erro }.
export function validarEndereco(f) {
  const slug = f.slug.trim().toLowerCase();
  if (!SLUG_VALIDO.test(slug)) return { erro: 'Endereço inválido: use letras minúsculas, números e hífen.' };
  if (SLUGS_RESERVADOS.includes(slug)) return { erro: `"${slug}" é um endereço reservado. Escolha outro.` };
  const dominio = f.dominio.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/.*$/, '');
  if (dominio && !DOMINIO_VALIDO.test(dominio)) return { erro: 'Domínio próprio inválido. Exemplo: clubedoze.com.br' };
  return { campos: { slug, dominio: dominio || null, ativo: f.ativo } };
}
