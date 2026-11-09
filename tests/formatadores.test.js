import { describe, expect, it } from 'vitest';
import {
  dataLocalISO,
  somarDias,
  formatarData,
  rotuloDia,
  horaParaMinutos,
  minutosParaHora,
  hhmm,
  intervalosSobrepoem,
  formatarMoeda,
  lerPreco,
  formatarTelefone,
  telefoneValido,
  linkWhatsApp,
  primeiroNome,
} from '@/lib/formatadores';

describe('datas', () => {
  it('usa o fuso local, não UTC (bug clássico das 21h no Brasil)', () => {
    expect(dataLocalISO(new Date(2026, 0, 5, 23, 30))).toBe('2026-01-05');
  });

  it('soma dias atravessando mês e ano', () => {
    expect(somarDias('2026-01-31', 1)).toBe('2026-02-01');
    expect(somarDias('2026-12-31', 1)).toBe('2027-01-01');
    expect(somarDias('2026-03-01', -1)).toBe('2026-02-28');
  });

  it('formata e rotula dias', () => {
    expect(formatarData('2026-10-29')).toBe('29/10/2026');
    expect(rotuloDia('2026-10-29', '2026-10-29')).toBe('Hoje');
    expect(rotuloDia('2026-10-30', '2026-10-29')).toBe('Amanhã');
  });
});

describe('horários', () => {
  it('converte horas e minutos', () => {
    expect(horaParaMinutos('07:30')).toBe(450);
    expect(minutosParaHora(450)).toBe('07:30');
    expect(hhmm('18:00:00')).toBe('18:00');
  });

  it('limita a 23:59 (mesa às 22:30 + 2h não vira 00:30)', () => {
    expect(minutosParaHora(horaParaMinutos('22:30') + 120)).toBe('23:59');
  });

  it('detecta sobreposição de intervalos, mas não encostados', () => {
    expect(intervalosSobrepoem('18:00', '20:00', '19:00', '21:00')).toBe(true);
    expect(intervalosSobrepoem('18:00', '19:00', '19:00', '20:00')).toBe(false);
    expect(intervalosSobrepoem('10:00', '11:00', '07:00', '23:00')).toBe(true);
  });
});

describe('moeda', () => {
  it('lê preços no formato brasileiro', () => {
    expect(lerPreco('19,90')).toBe(19.9);
    expect(lerPreco('R$ 1.234,50')).toBe(1234.5);
    expect(Number.isNaN(lerPreco('abc'))).toBe(true);
  });

  it('formata em reais', () => {
    expect(formatarMoeda(19.9).replace(/\s/g, ' ')).toBe('R$ 19,90');
  });
});

describe('telefone / WhatsApp', () => {
  it('aplica máscara de celular e fixo', () => {
    expect(formatarTelefone('11999998888')).toBe('(11) 99999-8888');
    expect(formatarTelefone('1133334444')).toBe('(11) 3333-4444');
    expect(formatarTelefone('5511999998888')).toBe('(11) 99999-8888');
  });

  it('valida 10 ou 11 dígitos', () => {
    expect(telefoneValido('(11) 99999-8888')).toBe(true);
    expect(telefoneValido('999998888')).toBe(false);
  });

  it('monta link do WhatsApp com DDI 55 uma única vez', () => {
    expect(linkWhatsApp('11999998888', 'oi')).toBe('https://wa.me/5511999998888?text=oi');
    expect(linkWhatsApp('5511999998888')).toBe('https://wa.me/5511999998888');
    expect(linkWhatsApp('')).toBe('');
  });

  it('pega o primeiro nome', () => {
    expect(primeiroNome('  Ana Clara Souza ')).toBe('Ana');
  });
});
