'use client';

import { useMemo, useState } from 'react';
import { Minus, Plus, Search, ShoppingBag } from 'lucide-react';
import { agruparPorCategoria, normalizarBusca } from '@/lib/cardapio';
import { formatarMoeda } from '@/lib/formatadores';

// Seletor de itens do cardápio para pré-pedido.
// `selecionados` = { [idProduto]: quantidade }
export default function PrePedido({ cardapio, carregando, selecionados, aoMudar }) {
  const [busca, setBusca] = useState('');
  const [categoria, setCategoria] = useState('');
  const grupos = useMemo(() => agruparPorCategoria(cardapio), [cardapio]);
  const categoriaAtual = categoria || grupos[0]?.[0] || '';
  const termo = normalizarBusca(busca);

  const lista = termo
    ? cardapio.filter((p) => normalizarBusca(p.nome).includes(termo))
    : grupos.find(([c]) => c === categoriaAtual)?.[1] || [];

  const alterar = (id, delta) => {
    const atual = selecionados[id] || 0;
    const novo = Math.max(0, Math.min(99, atual + delta));
    const copia = { ...selecionados };
    if (novo === 0) delete copia[id];
    else copia[id] = novo;
    aoMudar(copia);
  };

  const contagemPorCategoria = (cat) =>
    grupos.find(([c]) => c === cat)?.[1].reduce((acc, p) => acc + (selecionados[p.id] || 0), 0) || 0;

  if (carregando) {
    return <div className="h-40 rounded-2xl bg-slate-100 animate-pulse" aria-busy="true" />;
  }

  if (cardapio.length === 0) {
    return (
      <p className="text-sm text-slate-500 bg-slate-50 rounded-2xl p-5 text-center border border-dashed border-slate-200">
        <ShoppingBag className="w-6 h-6 text-slate-300 mx-auto mb-2" />
        O pré-pedido estará disponível em breve. Você pode combinar o consumo com a equipe.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input type="search" placeholder="Buscar item..." value={busca} onChange={(e) => setBusca(e.target.value)} className="input pl-10" aria-label="Buscar item do cardápio" />
      </div>

      {!termo && (
        <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
          {grupos.map(([cat]) => {
            const qtd = contagemPorCategoria(cat);
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoria(cat)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border transition ${
                  categoriaAtual === cat ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                {cat}
                {qtd > 0 && <span className="ml-1.5 bg-red-600 text-white rounded-full px-1.5 text-[10px]">{qtd}</span>}
              </button>
            );
          })}
        </div>
      )}

      <ul className="grid sm:grid-cols-2 gap-2 max-h-96 overflow-y-auto pr-1">
        {lista.map((prod) => {
          const qtd = selecionados[prod.id] || 0;
          return (
            <li
              key={prod.id}
              className={`flex items-center justify-between gap-3 p-3 rounded-2xl border transition ${qtd ? 'bg-red-50/70 border-red-200' : 'bg-slate-50 border-slate-200'}`}
            >
              <div className="min-w-0">
                <p className="font-bold text-sm text-slate-900 truncate">{prod.nome}</p>
                <p className="text-xs font-bold text-red-600">{formatarMoeda(prod.preco)}</p>
              </div>
              <div className="flex items-center gap-1 bg-white rounded-xl border border-slate-200 p-0.5 shrink-0">
                <button
                  type="button"
                  onClick={() => alterar(prod.id, -1)}
                  disabled={!qtd}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 disabled:opacity-30"
                  aria-label={`Remover ${prod.nome}`}
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-6 text-center text-sm font-black tabular-nums" aria-live="polite">{qtd}</span>
                <button
                  type="button"
                  onClick={() => alterar(prod.id, 1)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-red-600"
                  aria-label={`Adicionar ${prod.nome}`}
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </li>
          );
        })}
        {lista.length === 0 && <li className="text-xs text-slate-500 col-span-full text-center py-4">Nenhum item encontrado.</li>}
      </ul>
    </div>
  );
}
