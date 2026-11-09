import { NEGOCIO, QUADRAS, QUIOSQUES, HORARIO_FUNCIONAMENTO } from '@/lib/config';

// llms.txt: resumo em texto para assistentes de IA (ChatGPT, Gemini, Claude,
// Perplexity) entenderem e citarem o negócio corretamente.
export function GET() {
  const u = NEGOCIO.siteUrl;
  const linhas = [
    `# ${NEGOCIO.nome}`,
    '',
    `> ${NEGOCIO.slogan}`,
    '',
    NEGOCIO.endereco ? `Endereço: ${NEGOCIO.endereco}${NEGOCIO.cidade ? `, ${NEGOCIO.cidade}` : ''}` : null,
    NEGOCIO.whatsapp ? `WhatsApp: +55 ${NEGOCIO.whatsapp}` : null,
    NEGOCIO.instagram ? `Instagram: @${NEGOCIO.instagram}` : null,
    ...HORARIO_FUNCIONAMENTO.map((h) => `Horário (${h.dias}): ${h.horas}, todos os dias`),
    '',
    '## Quadras',
    ...QUADRAS.map((q) => `- ${q.curto}: ${q.esportes} (piso ${q.piso}). Aluguel por hora, de 1 a 4 horas.`),
    '',
    '## Quiosques para eventos',
    ...QUIOSQUES.map((q) => `- ${q.curto}: até ${q.capacidade} pessoas. Ideal para ${q.ideal.toLowerCase()}.`),
    '',
    '## Reservas online (sem cadastro, confirmação pelo WhatsApp)',
    `- [Reservar quadra](${u}/reservas/quadras): grade de horários livres em tempo real`,
    `- [Reservar mesa no gastrobar](${u}/reservas/mesas): com pré-pedido opcional`,
    `- [Reservar quiosque](${u}/reservas/quiosques): festas e confraternizações, com 1 dia de antecedência`,
    `- [Cardápio digital](${u}/cardapio): espetinhos, porções, pratos, drinks e bebidas`,
  ];
  return new Response(linhas.filter((l) => l !== null).join('\n') + '\n', {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
