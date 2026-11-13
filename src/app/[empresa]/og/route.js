import { ImageResponse } from 'next/og';
import { empresaDaRota } from '@/lib/empresa-servidor';
import { PALETAS } from '@/lib/empresa';

// Imagem exibida ao compartilhar o link no WhatsApp, Instagram, Facebook etc.
export async function GET(_request, { params }) {
  const empresa = await empresaDaRota(params);
  const paleta = PALETAS[empresa.cor];
  const linhas = empresa.textos.tituloHero;
  const servicos = [
    ...empresa.quadras.flatMap((q) => q.esportes.split('·').map((e) => e.trim())).filter(Boolean),
    empresa.modulos.quiosques && 'Quiosques para festas',
    empresa.modulos.cardapio && 'Cardápio digital',
  ].filter(Boolean);
  const unicos = [...new Set(servicos)].slice(0, 4);

  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 72, background: `linear-gradient(135deg, #020617 0%, #0f172a 55%, ${paleta[900]} 100%)`, color: 'white', fontFamily: 'sans-serif' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ width: 84, height: 84, borderRadius: 22, background: paleta[600], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 52, fontWeight: 900 }}>
            {empresa.inicial}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 44, fontWeight: 900, letterSpacing: -1 }}>{empresa.nomeCurto.toUpperCase()}</span>
            {empresa.subtitulo && <span style={{ fontSize: 22, color: paleta[400], letterSpacing: 6 }}>{empresa.subtitulo.toUpperCase()}</span>}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {linhas.map((linha, i) => (
            <span key={linha} style={{ fontSize: 96, fontWeight: 900, lineHeight: 1, letterSpacing: -3, color: i === linhas.length - 1 ? paleta[500] : 'white' }}>{linha}</span>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 16, fontSize: 28, color: '#cbd5e1' }}>
          {unicos.map((s, i) => (
            <span key={s}>{i > 0 ? `·  ${s}` : s}</span>
          ))}
        </div>
      </div>
    ),
    { width: 1200, height: 630, headers: { 'Cache-Control': 'public, max-age=3600' } }
  );
}
