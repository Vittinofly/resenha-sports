'use client';

import { useMemo, useState } from 'react';
import { Search, UtensilsCrossed, X } from 'lucide-react';
import { useCardapioDisponivel, agruparPorCategoria, normalizarBusca } from '@/lib/cardapio';
import { formatarMoeda } from '@/lib/formatadores';

export default function CardapioViewer() {
  const { itens, carregando, erro } = useCardapioDisponivel();
  const [busca, setBusca] = useState('');
  const [categoriaAtiva, setCategoriaAtiva] = useState('Todos');

  const grupos = useMemo(() => agruparPorCategoria(itens), [itens]);
  const termo = normalizarBusca(busca);

  const gruposFiltrados = grupos
    .filter(([cat]) => categoriaAtiva === 'Todos' || cat === categoriaAtiva)
    .map(([cat, lista]) => [
      cat,
      lista.filter((i) => !termo || normalizarBusca(i.nome).includes(termo) || normalizarBusca(i.descricao).includes(termo)),
    ])
    .filter(([, lista]) => lista.length > 0);

  return (
    <div className="space-y-6">
      {/* Busca e filtros fixos no topo ao rolar */}
      <div className="sticky top-16 z-20 -mx-4 px-4 py-3 bg-[var(--background)]/95 backdrop-blur space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            placeholder="Buscar prato, porção ou bebida..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="input pl-10 pr-10 bg-white"
            aria-label="Buscar no cardápio"
          />
          {busca && (
            <button onClick={() => setBusca('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700" aria-label="Limpar busca">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]" role="tablist" aria-label="Categorias">
          {['Todos', ...grupos.map(([c]) => c)].map((cat) => (
            <button
              key={cat}
              role="tab"
              aria-selected={categoriaAtiva === cat}
              onClick={() => setCategoriaAtiva(cat)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition whitespace-nowrap border ${
                categoriaAtiva === cat ? 'bg-red-600 border-red-600 text-white shadow-sm' : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {carregando ? (
        <div className="grid sm:grid-cols-2 gap-3" aria-busy="true">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-20 rounded-2xl bg-slate-200/70 animate-pulse" />
          ))}
        </div>
      ) : erro ? (
        <p className="cartao p-8 text-center text-sm text-slate-500">Não foi possível carregar o cardápio agora. Tente novamente em instantes.</p>
      ) : gruposFiltrados.length === 0 ? (
        <div className="cartao p-10 text-center">
          <UtensilsCrossed className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="text-sm text-slate-500 mt-3">
            {itens.length === 0 ? 'Cardápio em atualização. Volte em breve!' : 'Nenhum item encontrado para essa busca.'}
          </p>
        </div>
      ) : (
        gruposFiltrados.map(([categoria, lista]) => (
          <section key={categoria} aria-labelledby={`cat-${categoria}`}>
            <h2 id={`cat-${categoria}`} className="titulo-secao text-2xl flex items-center gap-3 mb-3">
              {categoria}
              <span className="h-px flex-1 bg-slate-200" />
            </h2>
            <ul className="grid sm:grid-cols-2 gap-3">
              {lista.map((item) => (
                <li key={item.id} className="cartao p-4 flex gap-4 items-start hover:border-red-200 transition">
                  {item.imagem_url && (
                    // eslint-disable-next-line @next/next/no-img-element -- URLs externas arbitrárias cadastradas pelo admin
                    <img src={item.imagem_url} alt="" loading="lazy" className="w-20 h-20 rounded-2xl object-cover shrink-0 bg-slate-100" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-bold text-slate-900 leading-snug">{item.nome}</h3>
                      <span className="font-display font-black text-lg text-red-600 whitespace-nowrap leading-none mt-0.5">{formatarMoeda(item.preco)}</span>
                    </div>
                    {item.descricao && <p className="text-xs text-slate-500 mt-1 line-clamp-2">{item.descricao}</p>}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
