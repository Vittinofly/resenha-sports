// Ícone da marca (chama vermelha sobre fundo escuro) para favicon, ícone do
// app (PWA) e atalho na tela inicial do iPhone. Renderizado por ImageResponse.
export function IconeMarca({ tamanho, arredondado = true }) {
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
      <svg width={chama} height={chama} viewBox="0 0 24 24" fill="#dc2626" stroke="#dc2626" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
      </svg>
    </div>
  );
}
