import { describe, expect, it } from 'vitest';
import {
  montarDetalhes,
  parseDetalhes,
  quiosqueDaReserva,
  resumirPedido,
  normalizarReserva,
  ordenarPorDataHora,
  linkReservaCliente,
  sinalPendente,
  MODELOS_MENSAGEM,
  mensagemSolicitacao,
} from '@/lib/reservas';
import { prepararAgenda, valoresAgenda } from '@/lib/agenda';
import { empresaTeste as empresa } from './empresa-teste';

describe('detalhes em tipo_evento', () => {
  it('ida e volta: montar → interpretar', () => {
    const texto = montarDetalhes('Aniversário', empresa.quiosques[1].nome, '2x Cerveja, 1x Porção');
    expect(parseDetalhes(texto)).toEqual({ evento: 'Aniversário', local: empresa.quiosques[1].nome, itens: ['2x Cerveja', '1x Porção'] });
    expect(quiosqueDaReserva(texto)).toBe(empresa.quiosques[1].nome);
  });

  it('pedido vazio vira lista vazia', () => {
    expect(parseDetalhes(montarDetalhes('Churrasco', 'Quiosque X', '')).itens).toEqual([]);
    expect(parseDetalhes(null)).toEqual({ evento: '', local: '', itens: [] });
  });
});

describe('pré-pedido', () => {
  it('soma itens e ignora produtos que saíram do cardápio', () => {
    const cardapio = [
      { id: 1, nome: 'Cerveja', preco: '12.50' },
      { id: 2, nome: 'Porção', preco: 40 },
    ];
    const r = resumirPedido({ 1: 2, 2: 1, 99: 3 }, cardapio);
    expect(r.texto).toBe('2x Cerveja, 1x Porção');
    expect(r.total).toBe(65);
  });
});

describe('normalização para o painel', () => {
  it('quadra', () => {
    const r = normalizarReserva({ id: 7, cliente_nome: 'João', quadra_nome: empresa.quadras[0].nome, horario_inicio: '18:00:00', horario_fim: '20:00:00', data_reserva: '2026-11-10' }, 'quadras');
    expect(r).toMatchObject({ chave: 'quadras-7', local: empresa.quadras[0].nome, inicio: '18:00', fim: '20:00', nome: 'João' });
  });

  it('quiosque lê local e evento do texto', () => {
    const r = normalizarReserva({ id: 1, cliente_nome: 'Ana', num_convidados: 40, tipo_evento: montarDetalhes('Aniversário', 'Quiosque VIP', '') }, 'quiosques');
    expect(r).toMatchObject({ local: 'Quiosque VIP', evento: 'Aniversário', pessoas: 40 });
  });

  it('ordena por data e depois horário', () => {
    const lista = [
      { data_reserva: '2026-11-11', inicio: '08:00' },
      { data_reserva: '2026-11-10', inicio: '20:00' },
      { data_reserva: '2026-11-10', inicio: '09:00' },
    ].sort(ordenarPorDataHora);
    expect(lista.map((r) => `${r.data_reserva} ${r.inicio}`)).toEqual(['2026-11-10 09:00', '2026-11-10 20:00', '2026-11-11 08:00']);
  });
});

describe('link do cliente e mensagens', () => {
  const token = '123e4567-e89b-12d3-a456-426614174000';
  const reserva = normalizarReserva(
    { id: 3, cliente_nome: 'Carla Dias', cliente_whatsapp: '11999998888', quadra_nome: empresa.quadras[2].nome, data_reserva: '2026-11-10', horario_inicio: '19:00', horario_fim: '21:00', token_cliente: token, sinal_valor: 60, sinal_pago: false },
    'quadras'
  );

  it('gera o link /minha-reserva', () => {
    expect(linkReservaCliente(empresa, 'quadras', token)).toMatch(/\/minha-reserva\?t=quadras&c=123e4567-e89b-12d3-a456-426614174000$/);
    expect(linkReservaCliente(empresa, 'quadras', null)).toBe('');
  });

  it('confirmação inclui o link de cancelamento', () => {
    const texto = MODELOS_MENSAGEM.confirmacao.texto(reserva, empresa);
    expect(texto).toContain('Carla');
    expect(texto).toContain('/minha-reserva?t=quadras');
  });

  it('detecta sinal pendente', () => {
    expect(sinalPendente(reserva)).toBe(true);
    expect(sinalPendente({ ...reserva, sinal_pago: true })).toBe(false);
    expect(sinalPendente({ sinal_valor: 0 })).toBe(false);
  });

  it('mensagem do cliente para o negócio', () => {
    const msg = mensagemSolicitacao({ tipo: 'mesas', nome: 'Rui', local: 'Mesa', data: '2026-11-10', inicio: '20:00', pessoas: 4 });
    expect(msg).toContain('*Pessoas:* 4');
    expect(msg).toContain('10/11/2026');
  });
});

describe('agenda (balcão / remarcação)', () => {
  it('quadra: calcula fim pela duração', () => {
    const { campos } = prepararAgenda(empresa, 'quadras', { ...valoresAgenda(empresa, 'quadras'), data_reserva: '2026-11-10', inicio: '20:00', duracao: 2 });
    expect(campos).toMatchObject({ horario_inicio: '20:00', horario_fim: '22:00' });
  });

  it('quadra: não deixa passar do fechamento', () => {
    expect(prepararAgenda(empresa, 'quadras', { ...valoresAgenda(empresa, 'quadras'), data_reserva: '2026-11-10', inicio: '22:00', duracao: 2 }).erro).toMatch(/23:00/);
  });

  it('exige data e pessoas', () => {
    expect(prepararAgenda(empresa, 'mesas', { ...valoresAgenda(empresa, 'mesas'), data_reserva: '' }).erro).toBeTruthy();
    expect(prepararAgenda(empresa, 'mesas', { ...valoresAgenda(empresa, 'mesas'), data_reserva: '2026-11-10', pessoas: '0' }).erro).toBeTruthy();
  });

  it('remarcar preserva o pré-pedido', () => {
    const original = normalizarReserva({ id: 1, tipo_evento: montarDetalhes('Churrasco', empresa.quiosques[0].nome, '3x Espetinho'), num_convidados: 15 }, 'quiosques');
    const { campos } = prepararAgenda(empresa, 'quiosques', { ...valoresAgenda(empresa, 'quiosques', { reserva: original }), data_reserva: '2026-12-01' }, original);
    expect(parseDetalhes(campos.tipo_evento).itens).toEqual(['3x Espetinho']);
    expect(campos.num_convidados).toBe(15);
  });
});
