import { describe, expect, it } from 'vitest';
import { cssDaPaleta, gerarHorarios, normalizarEmpresa, PALETAS } from '@/lib/empresa';
import { resolverHost, urlDaEmpresa } from '@/lib/host-empresa';
import { configParaFormulario, formularioParaLinha, gerarSlug, validarEndereco } from '@/lib/empresa-form';
import { linhaTeste } from './empresa-teste';

describe('domínio -> empresa', () => {
  const com = { raiz: 'reservas.com.br', padrao: 'resenha' };

  it('domínio raiz abre a plataforma', () => {
    expect(resolverHost('reservas.com.br', com)).toEqual({ tipo: 'plataforma' });
    expect(resolverHost('www.reservas.com.br', com)).toEqual({ tipo: 'plataforma' });
  });

  it('subdomínio abre a empresa e ignora a porta', () => {
    expect(resolverHost('clube.reservas.com.br:443', com)).toEqual({ tipo: 'empresa', chave: 'clube' });
  });

  it('domínio próprio vira chave sem www', () => {
    expect(resolverHost('www.clubedoze.com.br', com)).toEqual({ tipo: 'empresa', chave: 'clubedoze.com.br' });
  });

  it('não confunde domínio parecido com subdomínio da raiz', () => {
    expect(resolverHost('xreservas.com.br', com)).toEqual({ tipo: 'empresa', chave: 'xreservas.com.br' });
  });

  it('desenvolvimento e previews usam a empresa padrão', () => {
    expect(resolverHost('localhost:3000', com).chave).toBe('resenha');
    expect(resolverHost('meu-preview.vercel.app', com).chave).toBe('resenha');
  });

  it('subdomínio de localhost simula empresas', () => {
    expect(resolverHost('clube.localhost:3000', {})).toEqual({ tipo: 'empresa', chave: 'clube' });
    expect(resolverHost('plataforma.localhost:3000', {})).toEqual({ tipo: 'plataforma' });
  });

  it('sem domínio raiz tudo vai para a empresa padrão', () => {
    expect(resolverHost('www.resenhasports.com.br', { padrao: 'resenha' })).toEqual({ tipo: 'empresa', chave: 'resenha' });
  });

  it('monta o endereço público', () => {
    expect(urlDaEmpresa({ slug: 'clube' }, 'reservas.com.br')).toBe('https://clube.reservas.com.br');
    expect(urlDaEmpresa({ slug: 'clube', dominio: 'clube.com' }, 'reservas.com.br')).toBe('https://clube.com');
    expect(urlDaEmpresa({ slug: 'clube' })).toBe('http://clube.localhost:3000');
  });
});

describe('normalização da empresa', () => {
  const norm = (config, extra = {}, amb = {}) => normalizarEmpresa({ id: 'x', slug: 'clube', nome: 'Clube', config, ...extra }, amb);

  it('calcula os horários a partir das regras', () => {
    const e = normalizarEmpresa(linhaTeste, {});
    expect(e.horariosQuadra[0]).toBe('07:00');
    expect(e.horariosQuadra.at(-1)).toBe('22:00');
    expect(e.horariosMesas).toHaveLength(23);
  });

  it('gera horários a cada 30 minutos, incluindo o último', () => {
    expect(gerarHorarios('11:00', '12:00')).toEqual(['11:00', '11:30', '12:00']);
  });

  it('descarta links e IDs que poderiam injetar código', () => {
    const e = norm({ mapsUrl: 'javascript:alert(1)', logoUrl: 'http://inseguro.com/a.png', gaId: "G-1');alert(1)//" });
    expect(e.mapsUrl).toBe('');
    expect(e.logoUrl).toBe('');
    expect(e.gaId).toBe('');
  });

  it('aceita um ID válido do Google Analytics', () => {
    expect(norm({ gaId: 'G-ABC1234' }).gaId).toBe('G-ABC1234');
  });

  it('cor desconhecida volta para a padrão e não gera CSS arbitrário', () => {
    const e = norm({ cor: '};body{display:none' });
    expect(e.cor).toBe('vermelho');
    expect(cssDaPaleta('};body{display:none')).toBe('');
  });

  it('o tom principal de toda paleta permite texto branco (contraste AA)', () => {
    const luminancia = (hex) => {
      const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };
    for (const paleta of Object.values(PALETAS)) expect(1.05 / (luminancia(paleta[600]) + 0.05)).toBeGreaterThanOrEqual(4.5);
  });

  it('módulo sem cadastro fica desligado', () => {
    const e = norm({ modulos: { quadras: true, mesas: true } });
    expect(e.modulos.quadras).toBe(false);
    expect(e.modulos.mesas).toBe(true);
    expect(e.reservaPrincipal).toBe('mesas');
  });

  it('endereço do site segue domínio, depois subdomínio', () => {
    expect(norm({}, { dominio: 'clube.com' }, { raiz: 'r.com' }).siteUrl).toBe('https://clube.com');
    expect(norm({}, {}, { raiz: 'r.com' }).siteUrl).toBe('https://clube.r.com');
  });

  it('só a empresa padrão herda o contato das variáveis de ambiente', () => {
    const amb = { padrao: 'resenha', contato: { whatsapp: '11999998888' } };
    expect(norm({}, { slug: 'resenha' }, amb).whatsapp).toBe('11999998888');
    expect(norm({}, { slug: 'outra' }, amb).whatsapp).toBe('');
  });
});

describe('formulário da empresa', () => {
  it('ida e volta preserva a configuração', () => {
    const form = configParaFormulario(linhaTeste);
    const { linha, erro } = formularioParaLinha(form, linhaTeste.config);
    expect(erro).toBeUndefined();
    expect(linha.config.quadras).toEqual(linhaTeste.config.quadras);
    expect(linha.config.quiosques).toEqual(linhaTeste.config.quiosques);
    expect(linha.config.sinal.quadras.valorPorHora).toBe(30);
  });

  it('mantém o id da quadra ao reordenar a lista', () => {
    const form = configParaFormulario(linhaTeste);
    form.quadras = form.quadras.split('\n').reverse().join('\n');
    const { linha } = formularioParaLinha(form, linhaTeste.config);
    expect(linha.config.quadras[0].id).toBe('q3');
  });

  it('exige quadras quando o módulo está ligado', () => {
    const form = { ...configParaFormulario(linhaTeste), quadras: '' };
    expect(formularioParaLinha(form).erro).toMatch(/quadra/);
  });

  it('recusa "|" no nome do quiosque, que quebraria tipo_evento', () => {
    const form = { ...configParaFormulario(linhaTeste), quiosques: 'Salão | A; Salão; 10; Festas' };
    expect(formularioParaLinha(form).erro).toMatch(/\|/);
  });

  it('recusa horário invertido', () => {
    const form = { ...configParaFormulario(linhaTeste), aberturaQuadras: '22', fechamentoQuadras: '8' };
    expect(formularioParaLinha(form).erro).toMatch(/Horário/);
  });

  it('gera slug sem acentos', () => {
    expect(gerarSlug('Clube São José & Cia')).toBe('clube-sao-jose-cia');
  });

  it('valida endereço e limpa o domínio', () => {
    expect(validarEndereco({ slug: 'admin', dominio: '', ativo: true }).erro).toMatch(/reservado/);
    expect(validarEndereco({ slug: 'clube', dominio: 'https://www.Clube.com/', ativo: true }).campos.dominio).toBe('clube.com');
  });
});
