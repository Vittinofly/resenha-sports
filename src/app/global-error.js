'use client'; // Error boundaries precisam ser Client Components

// Substitui o layout raiz quando ele próprio falha: não recebe o CSS global,
// por isso os estilos são inline.
export default function ErroGlobal({ retry }) {
  return (
    <html lang="pt-BR">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#020617',
          color: '#f8fafc',
          fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
          padding: 16,
          textAlign: 'center',
        }}
      >
        <title>Erro | Resenha</title>
        <main style={{ maxWidth: 420 }}>
          <p style={{ fontSize: 56, fontWeight: 900, color: '#dc2626', margin: 0 }}>Ops!</p>
          <h1 style={{ fontSize: 24, margin: '12px 0 8px' }}>O site encontrou um problema</h1>
          <p style={{ color: '#94a3b8', margin: '0 0 24px' }}>Tente novamente em instantes.</p>
          <button
            onClick={() => retry()}
            style={{ background: '#dc2626', color: '#fff', border: 0, borderRadius: 12, padding: '12px 20px', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}
          >
            Tentar novamente
          </button>
        </main>
      </body>
    </html>
  );
}
