'use client';

import { useState, useEffect } from 'react';
import { Search, Utensils } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function CardapioViewer({ titulo = "Ementa & Restaurante", subtitulo = "Consulte as nossas opções de pratos, espetinhos e bebidas." }) {
  const [cardapio, setCardapio] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState('');
  const [categoriaAtiva, setCategoriaAtiva] = useState('Todos');

  useEffect(() => {
    async function carregarCardapio() {
      setCarregando(true);
      const { data } = await supabase
        .from('cardapio')
        .select('*')
        .eq('disponivel', true)
        .order('categoria', { ascending: true });

      if (data) setCardapio(data);
      setCarregando(false);
    }
    carregarCardapio();
  }, []);

  const categorias = ['Todos', ...Array.from(new Set(cardapio.map((i) => i.categoria).filter(Boolean)))];

  const itensFiltrados = cardapio.filter((item) => {
    const atendeCat = categoriaAtiva === 'Todos' || item.categoria === categoriaAtiva;
    const atendeBusca = item.nome.toLowerCase().includes(busca.toLowerCase()) ||
                        (item.descricao && item.descricao.toLowerCase().includes(busca.toLowerCase()));
    return atendeCat && atendeBusca;
  });

  return (
    <div className="space-y-6">
      {titulo && (
        <div className="border-b border-slate-200 pb-4">
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Utensils className="w-5 h-5 text-red-600" /> {titulo}
          </h2>
          {subtitulo && <p className="text-xs text-slate-500 mt-1">{subtitulo}</p>}
        </div>
      )}

      {/* Busca e Filtros */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            placeholder="Pesquisar prato ou bebida..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-600 text-slate-900"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {categorias.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoriaAtiva(cat)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                categoriaAtiva === cat
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'bg-slate-200/70 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid de Produtos */}
      {carregando ? (
        <div className="p-8 text-center text-slate-400 text-sm">A carregar ementa...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {itensFiltrados.length === 0 ? (
            <p className="text-xs text-slate-500 col-span-full text-center py-6">
              Nenhum item encontrado nesta categoria.
            </p>
          ) : (
            itensFiltrados.map((item) => (
              <div key={item.id} className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm flex flex-col justify-between">
                {item.imagem_url && (
                  <img src={item.imagem_url} alt={item.nome} className="h-40 w-full object-cover" />
                )}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-100">
                      {item.categoria}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 mt-1">{item.nome}</h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{item.descricao}</p>
                  </div>
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-base font-black text-red-600">
                      R$ {Number(item.preco || 0).toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}