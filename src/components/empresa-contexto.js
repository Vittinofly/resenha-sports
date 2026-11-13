'use client';

import { createContext, useContext, useMemo } from 'react';
import { useSelectedLayoutSegments } from 'next/navigation';

const EmpresaContext = createContext(null);

// Empresa do site aberto. Preenchida no layout de [empresa].
export function useEmpresa() {
  return useContext(EmpresaContext).empresa;
}

// Caminho atual sem o prefixo da empresa ("/admin/reservas"). Com a reescrita do
// proxy, usePathname pode divergir entre servidor e navegador e quebrar a hidratação.
export function useCaminhoAtual() {
  return useContext(EmpresaContext).caminho;
}

export function EmpresaProvider({ empresa, children }) {
  const segmentos = useSelectedLayoutSegments();
  const caminho = `/${segmentos.join('/')}`;
  const valor = useMemo(() => ({ empresa, caminho }), [empresa, caminho]);
  return <EmpresaContext.Provider value={valor}>{children}</EmpresaContext.Provider>;
}
