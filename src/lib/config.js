// Configuração central do negócio. Dados de contato vêm de variáveis de ambiente
// (veja .env.example) para que possam ser alterados sem mexer no código.
// Seções que dependem de um dado ausente simplesmente não são exibidas.

export const NEGOCIO = {
  nome: 'Resenha Sports Center & Gastrobar',
  nomeCurto: 'Resenha',
  slogan: 'Quadras de areia, padel, gastrobar e espaço para eventos em um só lugar.',
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
  // Somente números, com DDD (ex.: 11999998888). DDI 55 é adicionado automaticamente.
  whatsapp: (process.env.NEXT_PUBLIC_WHATSAPP_CONTATO || '').replace(/\D/g, ''),
  instagram: (process.env.NEXT_PUBLIC_INSTAGRAM || '').replace(/^@/, ''),
  endereco: process.env.NEXT_PUBLIC_ENDERECO || '',
  cidade: process.env.NEXT_PUBLIC_CIDADE || '',
  mapsUrl: process.env.NEXT_PUBLIC_MAPS_URL || '',
};

export const HORARIO_FUNCIONAMENTO = [
  { dias: 'Quadras', horas: '07:00 às 23:00' },
  { dias: 'Gastrobar', horas: '11:00 às 23:00' },
];

// --- QUADRAS ---
export const ABERTURA_QUADRAS = 7;
export const FECHAMENTO_QUADRAS = 23;

export const QUADRAS = [
  {
    id: 'q1',
    nome: 'Quadra 1 - Beach Tennis / Futevôlei',
    curto: 'Quadra 1',
    esportes: 'Beach Tennis · Futevôlei',
    piso: 'Areia',
  },
  {
    id: 'q2',
    nome: 'Quadra 2 - Beach Tennis / Futevôlei',
    curto: 'Quadra 2',
    esportes: 'Beach Tennis · Futevôlei',
    piso: 'Areia',
  },
  {
    id: 'q3',
    nome: 'Quadra 3 - Padel',
    curto: 'Quadra 3',
    esportes: 'Padel',
    piso: 'Sintético / Vidro',
  },
];

// Slots de início de 1h (07:00 ... 22:00)
export const HORARIOS_QUADRA = Array.from(
  { length: FECHAMENTO_QUADRAS - ABERTURA_QUADRAS },
  (_, i) => `${String(i + ABERTURA_QUADRAS).padStart(2, '0')}:00`
);

export const DURACOES = [1, 2, 3, 4];

// --- RESTAURANTE ---
// Horários de chegada a cada 30 min (11:00 ... 22:00)
export const HORARIOS_RESTAURANTE = Array.from({ length: 23 }, (_, i) => {
  const minutos = 11 * 60 + i * 30;
  return `${String(Math.floor(minutos / 60)).padStart(2, '0')}:${String(minutos % 60).padStart(2, '0')}`;
});

// --- QUIOSQUES ---
export const QUIOSQUES = [
  { id: 'q1', nome: 'Quiosque Família (Até 20 Pessoas)', curto: 'Quiosque Família', capacidade: 20, ideal: 'Churrascos e encontros em família' },
  { id: 'q2', nome: 'Quiosque VIP / Aniversários (Até 50 Pessoas)', curto: 'Quiosque VIP', capacidade: 50, ideal: 'Aniversários e comemorações' },
  { id: 'q3', nome: 'Quiosque Corporativo (Até 100 Pessoas)', curto: 'Quiosque Corporativo', capacidade: 100, ideal: 'Confraternizações de empresas' },
];

export const TIPOS_EVENTO = ['Aniversário', 'Churrasco', 'Confraternização', 'Corporativo', 'Despedida', 'Outro'];

// --- CARDÁPIO ---
export const CATEGORIAS_CARDAPIO = ['Bebidas', 'Drinks', 'Porções', 'Petiscos', 'Espetinhos', 'Pratos', 'Comidas', 'Sobremesas'];

// --- STATUS DE RESERVA ---
export const STATUS = {
  pendente: { label: 'Pendente', classe: 'bg-amber-100 text-amber-900 border-amber-200' },
  agendada: { label: 'Agendada', classe: 'bg-amber-100 text-amber-900 border-amber-200' },
  confirmado: { label: 'Confirmado', classe: 'bg-emerald-100 text-emerald-900 border-emerald-200' },
  concluido: { label: 'Concluído', classe: 'bg-slate-100 text-slate-700 border-slate-200' },
  cancelado: { label: 'Cancelado', classe: 'bg-red-100 text-red-800 border-red-200' },
};

export const STATUS_ATIVOS = ['pendente', 'agendada', 'confirmado'];

// --- SINAL VIA PIX ---
// Só fica ativo com NEXT_PUBLIC_PIX_CHAVE preenchida. O cliente vê o QR Code e o
// "copia e cola" ao concluir a solicitação; a equipe marca "sinal pago" no painel.
export const PIX = {
  chave: (process.env.NEXT_PUBLIC_PIX_CHAVE || '').trim(),
  // Nome do titular (até 25 caracteres) e cidade (até 15), como no banco
  titular: process.env.NEXT_PUBLIC_PIX_TITULAR || 'Resenha Sports',
  cidade: process.env.NEXT_PUBLIC_PIX_CIDADE || NEGOCIO.cidade || 'Brasil',
};

export const SINAL = {
  // Valor fixo para reservar quiosque
  quiosques: 100,
  // Quadras em horário nobre: a partir de `aPartirDe` nos dias úteis, ou o dia
  // todo no fim de semana. Valor por hora reservada.
  quadras: { aPartirDe: '18:00', fimDeSemanaTodo: true, valorPorHora: 30 },
  // Mesas não cobram sinal
  mesas: 0,
  // Até quantas horas após a solicitação o sinal deve ser enviado
  prazoHoras: 24,
};
