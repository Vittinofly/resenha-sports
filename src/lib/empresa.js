// Modelo de uma empresa da plataforma: transforma a linha da tabela `empresas`
// no objeto que as telas usam. Sem dependências de servidor, para poder ser testado.
//
// Tudo que vem de `config` foi digitado por um administrador e vai parar em
// links, scripts e estilos do site. Por isso cada campo sensível é validado aqui.

// Tons usados nas classes `*-red-*`. O site inteiro usa essa escala: trocar as
// variáveis do Tailwind muda a cor da marca sem tocar nos componentes.
// O tom 600 é sempre escuro o bastante para texto branco (contraste AA).
export const PALETAS = {
  vermelho: { 50: '#fef2f2', 100: '#fee2e2', 200: '#fecaca', 300: '#fca5a5', 400: '#f87171', 500: '#ef4444', 600: '#dc2626', 700: '#b91c1c', 800: '#991b1b', 900: '#7f1d1d' },
  azul: { 50: '#eff6ff', 100: '#dbeafe', 200: '#bfdbfe', 300: '#93c5fd', 400: '#60a5fa', 500: '#3b82f6', 600: '#2563eb', 700: '#1d4ed8', 800: '#1e40af', 900: '#1e3a8a' },
  verde: { 50: '#f0fdf4', 100: '#dcfce7', 200: '#bbf7d0', 300: '#86efac', 400: '#4ade80', 500: '#22c55e', 600: '#15803d', 700: '#166534', 800: '#14532d', 900: '#052e16' },
  laranja: { 50: '#fff7ed', 100: '#ffedd5', 200: '#fed7aa', 300: '#fdba74', 400: '#fb923c', 500: '#f97316', 600: '#c2410c', 700: '#9a3412', 800: '#7c2d12', 900: '#431407' },
  roxo: { 50: '#f5f3ff', 100: '#ede9fe', 200: '#ddd6fe', 300: '#c4b5fd', 400: '#a78bfa', 500: '#8b5cf6', 600: '#7c3aed', 700: '#6d28d9', 800: '#5b21b6', 900: '#4c1d95' },
};

export const NOMES_CORES = { vermelho: 'Vermelho', azul: 'Azul', verde: 'Verde', laranja: 'Laranja', roxo: 'Roxo' };

// CSS que aplica a cor da empresa; a paleta padrão não precisa de nada
export function cssDaPaleta(cor) {
  if (cor === 'vermelho' || !PALETAS[cor]) return '';
  const variaveis = Object.entries(PALETAS[cor]).map(([tom, hex]) => `--color-red-${tom}:${hex}`);
  return `:root{${variaveis.join(';')}}`;
}

const MODULOS_PADRAO = { quadras: false, mesas: false, quiosques: false, cardapio: false };
const SINAL_PADRAO = { quiosques: 0, quadras: { aPartirDe: '18:00', fimDeSemanaTodo: true, valorPorHora: 0 }, mesas: 0, prazoHoras: 24 };

export const TIPOS_EVENTO_PADRAO = ['Aniversário', 'Churrasco', 'Confraternização', 'Corporativo', 'Outro'];
export const CATEGORIAS_PADRAO = ['Bebidas', 'Porções', 'Pratos', 'Sobremesas'];

const texto = (v) => (typeof v === 'string' ? v.trim() : '');
const inteiro = (v, padrao, min, max) => {
  const n = Number(v);
  return Number.isInteger(n) && n >= min && n <= max ? n : padrao;
};
const hora = (v, padrao) => (/^([01]\d|2[0-3]):[0-5]\d$/.test(v) ? v : padrao);
const linkSeguro = (v) => {
  const s = texto(v);
  return /^https:\/\/[^\s"'<>]+$/.test(s) ? s : '';
};
const listaTextos = (v, padrao) => {
  const lista = Array.isArray(v) ? v.map(texto).filter(Boolean) : [];
  return lista.length ? lista : padrao;
};

function textosPadrao(nome) {
  return {
    seloHero: 'Reservas online',
    tituloHero: ['Reserve.', 'Chegue.', 'Aproveite.'],
    descricaoHero: 'Escolha o dia e o horário e reserve online em menos de um minuto, sem cadastro.',
    tituloSeo: `${nome} — Reservas online`,
    sufixoTitulo: nome,
    descricaoSeo: `Faça sua reserva online em ${nome}, sem cadastro e com confirmação pelo WhatsApp.`,
    palavrasChave: [],
    cozinha: '',
    seoQuadras: `Veja os horários livres em tempo real e reserve sua quadra em ${nome}, sem cadastro.`,
    seoMesas: `Reserve sua mesa em ${nome} e adiante seu pedido.`,
    seoQuiosques: `Reserve um espaço privativo em ${nome} para o seu evento.`,
    seoCardapio: `Confira o cardápio digital de ${nome} com preços atualizados.`,
    servicoQuadras: 'Veja os horários livres em tempo real e reserve na hora.',
    servicoMesas: 'Garanta seu lugar e já deixe seu pedido encaminhado.',
    servicoQuiosques: 'Espaço privado para aniversários, churrascos e confraternizações.',
    servicoCardapio: 'Consulte os itens e preços direto do celular.',
    chamadaQuadras: 'Escolha a quadra e veja os horários livres.',
    tituloEventos: `Seu evento em ${nome}`,
    descricaoEventos: 'Escolha o espaço, monte o pré-pedido e deixe o resto com a gente.',
  };
}

// Horários de início a cada `passo` minutos, de `inicio` até `fim` (inclusive)
export function gerarHorarios(inicio, fim, passo = 30) {
  const paraMin = (h) => Number(h.slice(0, 2)) * 60 + Number(h.slice(3, 5));
  const horarios = [];
  for (let m = paraMin(inicio); m <= paraMin(fim); m += passo) {
    horarios.push(`${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`);
  }
  return horarios;
}

function normalizarQuadras(lista) {
  if (!Array.isArray(lista)) return [];
  return lista
    .filter((q) => texto(q?.nome))
    .map((q, i) => ({
      id: texto(q.id) || `q${i + 1}`,
      nome: texto(q.nome),
      curto: texto(q.curto) || texto(q.nome),
      esportes: texto(q.esportes),
      piso: texto(q.piso),
    }));
}

function normalizarQuiosques(lista) {
  if (!Array.isArray(lista)) return [];
  return lista
    .filter((q) => texto(q?.nome))
    .map((q, i) => ({
      id: texto(q.id) || `q${i + 1}`,
      nome: texto(q.nome),
      curto: texto(q.curto) || texto(q.nome),
      capacidade: inteiro(q.capacidade, 20, 1, 1000),
      ideal: texto(q.ideal),
    }));
}

// `ambiente`: { raiz, padrao, siteUrl, contato } — ver lib/empresa-servidor.js
export function normalizarEmpresa(linha, ambiente = {}) {
  const c = linha.config && typeof linha.config === 'object' ? linha.config : {};
  const ehPadrao = linha.slug === ambiente.padrao;
  // Só a empresa original continua lendo contato das variáveis de ambiente
  const reserva = ehPadrao ? ambiente.contato || {} : {};

  const nome = texto(linha.nome);
  const nomeCurto = texto(c.nomeCurto) || nome;
  const aberturaQuadras = inteiro(c.aberturaQuadras, 8, 0, 22);
  const fechamentoQuadras = Math.max(aberturaQuadras + 1, inteiro(c.fechamentoQuadras, 22, 1, 23));
  const aberturaMesas = hora(c.aberturaMesas, '11:00');
  const ultimaChegadaMesas = hora(c.ultimaChegadaMesas, '22:00');
  const modulos = { ...MODULOS_PADRAO };
  for (const m of Object.keys(modulos)) modulos[m] = c.modulos?.[m] === true;

  const quadras = normalizarQuadras(c.quadras);
  const quiosques = normalizarQuiosques(c.quiosques);
  // Módulo sem nada cadastrado não aparece no site
  if (!quadras.length) modulos.quadras = false;
  if (!quiosques.length) modulos.quiosques = false;

  const textosInformados = Object.fromEntries(
    Object.entries(c.textos && typeof c.textos === 'object' ? c.textos : {}).filter(([, v]) => (Array.isArray(v) ? v.length : texto(v)))
  );

  const raiz = texto(ambiente.raiz);
  const protocolo = /^(localhost|127\.)/.test(raiz) ? 'http' : 'https';
  let siteUrl = texto(ambiente.siteUrl) || 'http://localhost:3000';
  if (linha.dominio) siteUrl = `https://${linha.dominio}`;
  else if (!(ehPadrao && texto(ambiente.siteUrl)) && raiz) siteUrl = `${protocolo}://${linha.slug}.${raiz}`;

  const cor = PALETAS[c.cor] ? c.cor : 'vermelho';
  const gaId = texto(c.gaId) || texto(reserva.gaId);
  const verificacao = texto(c.googleVerification) || texto(reserva.googleVerification);

  const reservaPrincipal = ['quadras', 'mesas', 'quiosques'].find((m) => modulos[m]) || null;

  return {
    id: linha.id,
    slug: linha.slug,
    dominio: linha.dominio || '',
    ativo: linha.ativo !== false,
    nome,
    nomeCurto,
    marcaDestaque: texto(c.marcaDestaque),
    subtitulo: texto(c.subtitulo),
    slogan: texto(c.slogan),
    inicial: nomeCurto.charAt(0).toUpperCase(),
    cor,
    corHex: PALETAS[cor][600],
    logoUrl: linkSeguro(c.logoUrl),
    siteUrl,
    whatsapp: texto(c.whatsapp || reserva.whatsapp).replace(/\D/g, ''),
    instagram: texto(c.instagram || reserva.instagram).replace(/^@/, '').replace(/[^\w.]/g, ''),
    endereco: texto(c.endereco || reserva.endereco),
    cidade: texto(c.cidade || reserva.cidade),
    mapsUrl: linkSeguro(c.mapsUrl || reserva.mapsUrl),
    gaId: /^G-[A-Z0-9]{4,20}$/.test(gaId) ? gaId : '',
    googleVerification: /^[\w-]{10,100}$/.test(verificacao) ? verificacao : '',
    modulos,
    reservaPrincipal,
    horarioFuncionamento: Array.isArray(c.horarioFuncionamento)
      ? c.horarioFuncionamento.filter((h) => texto(h?.dias) && texto(h?.horas)).map((h) => ({ dias: texto(h.dias), horas: texto(h.horas) }))
      : [],
    aberturaQuadras,
    fechamentoQuadras,
    quadras,
    horariosQuadra: Array.from({ length: fechamentoQuadras - aberturaQuadras }, (_, i) => `${String(i + aberturaQuadras).padStart(2, '0')}:00`),
    aberturaMesas,
    ultimaChegadaMesas,
    horariosMesas: gerarHorarios(aberturaMesas, ultimaChegadaMesas),
    maxPessoasMesa: inteiro(c.maxPessoasMesa, 30, 1, 500),
    quiosques,
    tiposEvento: listaTextos(c.tiposEvento, TIPOS_EVENTO_PADRAO),
    categoriasCardapio: listaTextos(c.categoriasCardapio, CATEGORIAS_PADRAO),
    pix: {
      chave: texto(c.pix?.chave || reserva.pixChave),
      titular: texto(c.pix?.titular || reserva.pixTitular) || nomeCurto,
      cidade: texto(c.pix?.cidade || reserva.pixCidade || c.cidade || reserva.cidade) || 'Brasil',
    },
    sinal: {
      ...SINAL_PADRAO,
      ...(c.sinal && typeof c.sinal === 'object' ? c.sinal : {}),
      quadras: { ...SINAL_PADRAO.quadras, ...(c.sinal?.quadras || {}) },
    },
    textos: { ...textosPadrao(nome), ...textosInformados },
    // Dados brutos, para os formulários de edição
    config: c,
  };
}
