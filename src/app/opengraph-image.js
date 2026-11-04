import { ImageResponse } from 'next/og';
import { NEGOCIO } from '@/lib/config';

// Imagem exibida ao compartilhar o link no WhatsApp, Instagram, Facebook etc.
export const alt = `${NEGOCIO.nome} — Quadras, Gastrobar e Eventos`;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 72,
          background: 'linear-gradient(135deg, #020617 0%, #0f172a 55%, #7f1d1d 100%)',
          color: 'white',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ width: 84, height: 84, borderRadius: 22, background: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 52, fontWeight: 900 }}>
            R
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 44, fontWeight: 900, letterSpacing: -1 }}>RESENHA</span>
            <span style={{ fontSize: 22, color: '#f87171', letterSpacing: 6 }}>SPORTS CENTER & GASTROBAR</span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: 96, fontWeight: 900, lineHeight: 1, letterSpacing: -3 }}>Joga. Come.</span>
          <span style={{ fontSize: 96, fontWeight: 900, lineHeight: 1, letterSpacing: -3, color: '#ef4444' }}>Comemora.</span>
        </div>

        <div style={{ display: 'flex', gap: 16, fontSize: 28, color: '#cbd5e1' }}>
          <span>Beach Tennis</span>
          <span>·</span>
          <span>Futevôlei</span>
          <span>·</span>
          <span>Padel</span>
          <span>·</span>
          <span>Quiosques para festas</span>
        </div>
      </div>
    ),
    size
  );
}
