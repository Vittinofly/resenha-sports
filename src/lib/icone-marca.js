import { ImageResponse } from 'next/og';

// Ícone da marca (chama na cor da empresa sobre fundo escuro) para favicon, ícone
// do app (PWA) e atalho na tela inicial do iPhone.
function IconeMarca({ tamanho, cor, arredondado }) {
  const chama = Math.round(tamanho * 0.64);
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0f172a',
        borderRadius: arredondado ? Math.round(tamanho * 0.22) : 0,
      }}
    >
      <svg width={chama} height={chama} viewBox="0 0 24 24" fill={cor} stroke={cor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
      </svg>
    </div>
  );
}

export function respostaIcone(empresa, tamanho, { arredondado = true } = {}) {
  return new ImageResponse(<IconeMarca tamanho={tamanho} cor={empresa.corHex} arredondado={arredondado} />, {
    width: tamanho,
    height: tamanho,
    headers: { 'Cache-Control': 'public, max-age=3600' },
  });
}
