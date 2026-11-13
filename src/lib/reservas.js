import { formatarData, formatarMoeda, hhmm, primeiroNome } from '@/lib/formatadores';

export const TIPOS_RESERVA = {
  quadras: { tabela: 'reservas_quadras', label: 'Quadra', plural: 'Quadras' },
  mesas: { tabela: 'reservas_mesas', label: 'Mesa', plural: 'Mesas' },
  quiosques: { tabela: 'reservas_quiosques', label: 'Quiosque', plural: 'Quiosques' },
};

// Código Postgres de violação de constraint de exclusão (anti-overbooking, ver supabase/seguranca.sql)
export const ERRO_CONFLITO_DB = '23P01';
// Violação de índice único (quiosque já reservado na data, ver supabase/seguranca.sql)
export const ERRO_DUPLICADO_DB = '23505';

// Nome do quiosque guardado em `tipo_evento` ("<evento> | <quiosque> | Pedido: [...]")
export function quiosqueDaReserva(tipoEvento) {
  return parseDetalhes(tipoEvento).local;
}

// Mesas e quiosques guardam local + pré-pedido em `tipo_evento` no formato:
// "<evento> | <local> | Pedido: [2x Item, 1x Item]"
export function montarDetalhes(evento, local, resumoPedido) {
  return `${evento} | ${local} | Pedido: [${resumoPedido || 'Nenhum'}]`;
}

export function parseDetalhes(texto) {
  if (!texto) return { evento: '', local: '', itens: [] };

  const partes = texto.split('|').map((p) => p.trim());
  const pedido = partes.find((p) => /^(pré-)?pedido:/i.test(p)) || '';
  const pedidoLimpo = pedido.replace(/^(pré-)?pedido:\s*\[?/i, '').replace(/\]$/, '').trim();

  return {
    evento: partes[0] || '',
    local: partes[1] && !/^(pré-)?pedido:/i.test(partes[1]) ? partes[1] : '',
    itens: pedidoLimpo && pedidoLimpo !== 'Nenhum' ? pedidoLimpo.split(',').map((i) => i.trim()) : [],
  };
}

export function resumirPedido(itensSelecionados, cardapio) {
  const linhas = [];
  let total = 0;
  for (const [id, qtd] of Object.entries(itensSelecionados)) {
    const prod = cardapio.find((p) => String(p.id) === String(id));
    if (!prod) continue;
    linhas.push(`${qtd}x ${prod.nome}`);
    total += Number(prod.preco) * qtd;
  }
  return { texto: linhas.join(', '), linhas, total };
}

// Normaliza uma linha de qualquer tabela para o formato usado no admin.
export function normalizarReserva(row, tipo) {
  const detalhes = parseDetalhes(row.tipo_evento);
  let local = '';
  if (tipo === 'quadras') local = row.quadra_nome;
  else if (tipo === 'mesas') local = 'Mesa no restaurante';
  else local = detalhes.local || row.quiosque_nome || 'Quiosque';

  return {
    ...row,
    tipo,
    chave: `${tipo}-${row.id}`,
    nome: String(row.cliente_nome || '').split('|')[0].trim(),
    local,
    evento: tipo === 'quiosques' ? detalhes.evento : '',
    itens: detalhes.itens,
    pessoas: row.num_pessoas || row.num_convidados || null,
    inicio: hhmm(row.horario_inicio),
    fim: hhmm(row.horario_fim),
  };
}

export function ordenarPorDataHora(a, b) {
  return (a.data_reserva || '').localeCompare(b.data_reserva || '') || (a.inicio || '').localeCompare(b.inicio || '');
}

// Link para o cliente consultar/cancelar a própria reserva (ver /minha-reserva)
export function linkReservaCliente(empresa, tipo, token) {
  return token ? `${empresa.siteUrl}/minha-reserva?t=${tipo}&c=${token}` : '';
}

export const sinalPendente = (r) => Number(r?.sinal_valor) > 0 && !r?.sinal_pago;

function rodapeCliente(r, empresa) {
  const link = linkReservaCliente(empresa, r.tipo, r.token_cliente);
  return link ? `\n\nPrecisa cancelar? Use este link: ${link}` : '';
}

function textoSinal(r, empresa) {
  if (!sinalPendente(r) || !empresa.pix.chave) return '';
  return `\n\n💰 Para garantir, envie o sinal de *${formatarMoeda(r.sinal_valor)}* via Pix:\nChave: ${empresa.pix.chave}\nDepois é só mandar o comprovante aqui.`;
}

// --- MENSAGENS DE WHATSAPP (equipe -> cliente) ---
function descreverReserva(r) {
  const quando = `${formatarData(r.data_reserva)}${r.inicio ? ` às ${r.inicio}` : ''}`;
  return `${r.local} — ${quando}${r.fim && r.tipo === 'quadras' ? ` (até ${r.fim})` : ''}`;
}

export const MODELOS_MENSAGEM = {
  confirmacao: {
    label: 'Confirmar reserva',
    texto: (r, empresa) =>
      `Olá, ${primeiroNome(r.nome)}! 👋\n\nAqui é do *${empresa.nome}*.\nSua reserva está *CONFIRMADA*:\n📍 ${descreverReserva(r)}${
        r.itens?.length ? `\n🍽️ Pré-pedido: ${r.itens.join(', ')}` : ''
      }${textoSinal(r, empresa)}\n\nTe esperamos! Qualquer imprevisto é só avisar por aqui.${rodapeCliente(r, empresa)}`,
  },
  lembrete: {
    label: 'Lembrete',
    texto: (r, empresa) =>
      `Oi, ${primeiroNome(r.nome)}! Passando para lembrar da sua reserva no *${empresa.nomeCurto}*:\n📍 ${descreverReserva(r)}\n\nPodemos confirmar sua presença?${rodapeCliente(r, empresa)}`,
  },
  remarcacao: {
    label: 'Avisar remarcação',
    texto: (r, empresa) =>
      `Olá, ${primeiroNome(r.nome)}! Aqui é do *${empresa.nome}*.\nSua reserva foi *remarcada* conforme combinado:\n📍 ${descreverReserva(r)}\n\nQualquer dúvida é só chamar por aqui.${rodapeCliente(r, empresa)}`,
  },
  sinal: {
    label: 'Cobrar sinal',
    // Só aparece quando há sinal em aberto (ver ModalReserva)
    disponivel: (r, empresa) => sinalPendente(r) && !!empresa.pix.chave,
    texto: (r, empresa) =>
      `Olá, ${primeiroNome(r.nome)}! Aqui é do *${empresa.nome}*.\nRecebemos sua solicitação para ${descreverReserva(r)}.${textoSinal(r, empresa)}`,
  },
  indisponivel: {
    label: 'Horário indisponível',
    texto: (r, empresa) =>
      `Olá, ${primeiroNome(r.nome)}! Aqui é do *${empresa.nome}*.\nInfelizmente não conseguimos atender a solicitação para ${descreverReserva(r)}. Podemos te sugerir outro horário?`,
  },
};

// --- MENSAGEM cliente -> negócio (após solicitar online) ---
export function mensagemSolicitacao({ tipo, nome, local, data, inicio, fim, pessoas, evento, pedido, total }) {
  const linhas = [
    `Olá! Acabei de solicitar uma reserva pelo site 🙌`,
    ``,
    `*${TIPOS_RESERVA[tipo].label}:* ${local}`,
    evento ? `*Evento:* ${evento}` : null,
    `*Data:* ${formatarData(data)}${inicio ? ` · ${inicio}${fim ? ` às ${fim}` : ''}` : ''}`,
    pessoas ? `*Pessoas:* ${pessoas}` : null,
    pedido ? `*Pré-pedido:* ${pedido}${total ? ` (≈ ${formatarMoeda(total)})` : ''}` : null,
    `*Nome:* ${nome}`,
  ];
  return linhas.filter((l) => l !== null).join('\n');
}
