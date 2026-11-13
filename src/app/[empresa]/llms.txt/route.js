import { empresaDaRota } from '@/lib/empresa-servidor';

// llms.txt: resumo em texto para assistentes de IA (ChatGPT, Gemini, Claude,
// Perplexity) entenderem e citarem o negócio corretamente.
export async function GET(_request, { params }) {
  const empresa = await empresaDaRota(params);
  const { modulos, quadras, quiosques, horarioFuncionamento } = empresa;
  const u = empresa.siteUrl;
  const linhas = [
    `# ${empresa.nome}`,
    '',
    `> ${empresa.slogan}`,
    '',
    empresa.endereco ? `Endereço: ${empresa.endereco}${empresa.cidade ? `, ${empresa.cidade}` : ''}` : null,
    empresa.whatsapp ? `WhatsApp: +55 ${empresa.whatsapp}` : null,
    empresa.instagram ? `Instagram: @${empresa.instagram}` : null,
    ...horarioFuncionamento.map((h) => `Horário (${h.dias}): ${h.horas}, todos os dias`),
    '',
    ...(modulos.quadras
      ? ['## Quadras', ...quadras.map((q) => `- ${q.curto}: ${[q.esportes, q.piso && `piso ${q.piso}`].filter(Boolean).join(', ')}. Aluguel por hora, de 1 a 4 horas.`), '']
      : []),
    ...(modulos.quiosques
      ? ['## Quiosques para eventos', ...quiosques.map((q) => `- ${q.curto}: até ${q.capacidade} pessoas.${q.ideal ? ` Ideal para ${q.ideal.toLowerCase()}.` : ''}`), '']
      : []),
    '## Reservas online (sem cadastro, confirmação pelo WhatsApp)',
    modulos.quadras ? `- [Reservar quadra](${u}/reservas/quadras): grade de horários livres em tempo real` : null,
    modulos.mesas ? `- [Reservar mesa](${u}/reservas/mesas): com pré-pedido opcional` : null,
    modulos.quiosques ? `- [Reservar quiosque](${u}/reservas/quiosques): festas e confraternizações, com 1 dia de antecedência` : null,
    modulos.cardapio ? `- [Cardápio digital](${u}/cardapio): itens e preços atualizados` : null,
  ];
  return new Response(linhas.filter((l) => l !== null).join('\n') + '\n', {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
