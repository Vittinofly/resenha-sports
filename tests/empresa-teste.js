import { normalizarEmpresa } from '@/lib/empresa';

// Empresa de exemplo com as mesmas regras do Resenha
export const linhaTeste = {
  id: '11111111-1111-4111-8111-111111111111',
  slug: 'resenha',
  dominio: null,
  nome: 'Resenha Sports Center & Gastrobar',
  ativo: true,
  config: {
    nomeCurto: 'Resenha',
    modulos: { quadras: true, mesas: true, quiosques: true, cardapio: true },
    aberturaQuadras: 7,
    fechamentoQuadras: 23,
    quadras: [
      { id: 'q1', nome: 'Quadra 1 - Beach Tennis / Futevôlei', curto: 'Quadra 1', esportes: 'Beach Tennis · Futevôlei', piso: 'Areia' },
      { id: 'q2', nome: 'Quadra 2 - Beach Tennis / Futevôlei', curto: 'Quadra 2', esportes: 'Beach Tennis · Futevôlei', piso: 'Areia' },
      { id: 'q3', nome: 'Quadra 3 - Padel', curto: 'Quadra 3', esportes: 'Padel', piso: 'Sintético / Vidro' },
    ],
    aberturaMesas: '11:00',
    ultimaChegadaMesas: '22:00',
    maxPessoasMesa: 30,
    quiosques: [{ id: 'q1', nome: 'Quiosque Família (Até 20 Pessoas)', curto: 'Quiosque Família', capacidade: 20, ideal: 'Churrascos' }, { id: 'q2', nome: 'Quiosque VIP (Até 50 Pessoas)', curto: 'Quiosque VIP', capacidade: 50, ideal: 'Aniversários' }],
    tiposEvento: ['Aniversário', 'Outro'],
    pix: { chave: 'pix@resenha.com', titular: 'Resenha Sports', cidade: 'Taubate' },
    sinal: { quiosques: 100, quadras: { aPartirDe: '18:00', fimDeSemanaTodo: true, valorPorHora: 30 }, mesas: 0, prazoHoras: 24 },
  },
};

export const empresaTeste = normalizarEmpresa(linhaTeste, { siteUrl: 'https://resenha.test', padrao: 'resenha' });
