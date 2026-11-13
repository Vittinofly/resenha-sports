import { Suspense } from 'react';
import EdicaoEmpresa from './edicao-empresa';

export default function EmpresaPage() {
  return (
    <Suspense fallback={<div className="cartao h-64 animate-pulse" />}>
      <EdicaoEmpresa />
    </Suspense>
  );
}
