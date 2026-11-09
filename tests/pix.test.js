import { describe, expect, it } from 'vitest';
import { crc16, gerarPixCopiaECola, calcularSinal } from '@/lib/pix';

// Lê os campos EMV (id + tamanho + valor) de um BR Code
function lerCampos(codigo) {
  const campos = {};
  let i = 0;
  while (i < codigo.length) {
    const id = codigo.slice(i, i + 2);
    const tam = Number(codigo.slice(i + 2, i + 4));
    campos[id] = codigo.slice(i + 4, i + 4 + tam);
    i += 4 + tam;
  }
  return campos;
}

describe('CRC16 do BR Code', () => {
  it('valor de referência do CRC-16/CCITT-FALSE', () => {
    expect(crc16('123456789')).toBe('29B1');
  });

  it('confere com o exemplo do manual do Banco Central', () => {
    const semCrc = '00020126580014br.gov.bcb.pix0136123e4567-e12b-12d1-a456-4266554400005204000053039865802BR5913Fulano de Tal6008BRASILIA62070503***6304';
    expect(crc16(semCrc)).toBe('1D3D');
  });
});

describe('Pix copia e cola', () => {
  const codigo = gerarPixCopiaECola({ chave: 'pix@resenha.com', titular: 'Resenha Sports Center & Gastrobar Ltda', cidade: 'São José dos Campos', valor: 100, txid: 'abc-123' });
  const campos = lerCampos(codigo);

  it('tem os campos obrigatórios', () => {
    expect(campos['00']).toBe('01');
    expect(campos['26']).toContain('br.gov.bcb.pix');
    expect(campos['26']).toContain('pix@resenha.com');
    expect(campos['53']).toBe('986');
    expect(campos['54']).toBe('100.00');
    expect(campos['58']).toBe('BR');
  });

  it('remove acentos e respeita os limites de tamanho', () => {
    expect(campos['59'].length).toBeLessThanOrEqual(25);
    expect(campos['60']).toBe('SAO JOSE DOS CA');
    expect(campos['62']).toBe('0506abc123');
  });

  it('termina com CRC válido', () => {
    expect(codigo.slice(-4)).toBe(crc16(codigo.slice(0, -4)));
  });

  it('sem chave não gera nada', () => {
    expect(gerarPixCopiaECola({ chave: '', valor: 10 })).toBe('');
  });
});

describe('regras de sinal', () => {
  const regras = { quiosques: 100, mesas: 0, quadras: { aPartirDe: '18:00', fimDeSemanaTodo: true, valorPorHora: 30 } };
  const sinal = (tipo, dados) => calcularSinal(tipo, dados, regras, true);

  it('quiosque cobra valor fixo; mesa não cobra', () => {
    expect(sinal('quiosques')).toBe(100);
    expect(sinal('mesas', { data: '2026-11-10', inicio: '20:00', fim: '22:00' })).toBe(0);
  });

  it('quadra em dia útil só cobra as horas a partir das 18h', () => {
    // 2026-11-10 é terça-feira
    expect(sinal('quadras', { data: '2026-11-10', inicio: '10:00', fim: '12:00' })).toBe(0);
    expect(sinal('quadras', { data: '2026-11-10', inicio: '17:00', fim: '20:00' })).toBe(60);
  });

  it('quadra no fim de semana cobra todas as horas', () => {
    // 2026-11-14 é sábado
    expect(sinal('quadras', { data: '2026-11-14', inicio: '09:00', fim: '11:00' })).toBe(60);
  });

  it('desligado sem chave Pix', () => {
    expect(calcularSinal('quiosques', {}, regras, false)).toBe(0);
  });
});
