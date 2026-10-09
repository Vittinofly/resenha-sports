'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Utensils, Plus, Trash2, CheckCircle2, XCircle, DollarSign, Tag } from 'lucide-react';

export default function AdminCardapioPage() {
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const [novoItem, setNovoItem] = useState({
    nome: '',
    categoria: 'Bebidas',
    preco: '',
    disponivel: true,
  });

  const carregarCardapio = async () => {
    setLoading(true);
    const { data } = await supabase.from('cardapio').select('*').order('categoria', { ascending: true });
    if (data) setProdutos(data);
    setLoading(false);
  };

  useEffect(() => {
    carregarCardapio();
  }, []);

  const handleCriarProduto = async (e) => {
    e.preventDefault();
    if (!novoItem.nome || !novoItem.preco) return;

    setSalvando(true);
    const { error } = await supabase.from('cardapio').insert([
      {
        nome: novoItem.nome.trim(),
        categoria: novoItem.categoria,
        preco: parseFloat(novoItem.preco.replace(',', '.')),
        disponivel: novoItem.disponivel,
      },
    ]);

    setSalvando(false);

    if (error) {
      alert('Erro ao adicionar item: ' + error.message);
    } else {
      setNovoItem({ nome: '', categoria: 'Bebidas', preco: '', disponivel: true });
      carregarCardapio();
    }
  };

  const toggleDisponibilidade = async (id, statusAtual) => {
    await supabase.from('cardapio').update({ disponivel: !statusAtual }).eq('id', id);
    carregarCardapio();
  };

  const deletarProduto = async (id) => {
    if (!confirm('Tem certeza que deseja excluir este item do cardápio?')) return;
    await supabase.from('cardapio').delete().eq('id', id);
    carregarCardapio();
  };

  return (
    <div className="space-y-6 font-sans text-slate-900">
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black flex items-center gap-2">
            <Utensils className="w-6 h-6 text-red-600" /> Gestão do Cardápio
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">Gerencie os itens oferecidos no pré-pedido de mesas e quiosques.</p>
        </div>
      </div>

      {/* FORMULÁRIO DE CADASTRO DE ITEM */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-1.5">
          <Plus className="w-4 h-4 text-red-600" /> Adicionar Novo Item
        </h2>

        <form onSubmit={handleCriarProduto} className="grid sm:grid-cols-4 gap-4 items-end">
          <div className="sm:col-span-2">
            <label className="block text-[11px] font-extrabold text-slate-600 uppercase mb-1">Nome do Item *</label>
            <input
              type="text"
              required
              placeholder="Ex: Cerveja Heineken Long Neck"
              value={novoItem.nome}
              onChange={(e) => setNovoItem({ ...novoItem, nome: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-red-600"
            />
          </div>

          <div>
            <label className="block text-[11px] font-extrabold text-slate-600 uppercase mb-1">Categoria</label>
            <select
              value={novoItem.categoria}
              onChange={(e) => setNovoItem({ ...novoItem, categoria: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-red-600"
            >
              <option value="Bebidas">Bebidas</option>
              <option value="Porções">Porções & Petiscos</option>
              <option value="Espetinhos">Espetinhos</option>
              <option value="Sobremesas">Sobremesas</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-extrabold text-slate-600 uppercase mb-1">Preço (R$) *</label>
            <input
              type="text"
              required
              placeholder="12,00"
              value={novoItem.preco}
              onChange={(e) => setNovoItem({ ...novoItem, preco: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-red-600"
            />
          </div>

          <div className="sm:col-span-4 flex justify-end">
            <button
              type="submit"
              disabled={salvando}
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-6 py-2.5 rounded-xl text-xs shadow-sm transition disabled:opacity-50"
            >
              {salvando ? 'Cadastrando...' : 'Cadastrar Item no Cardápio'}
            </button>
          </div>
        </form>
      </div>

      {/* LISTA DE PRODUTOS */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-3">
        <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-2">Itens Cadastrados</h2>

        {loading ? (
          <p className="text-xs text-slate-400 text-center py-6">Carregando cardápio...</p>
        ) : produtos.length === 0 ? (
          <p className="text-xs text-slate-500 py-6 text-center">Nenhum item cadastrado no cardápio.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {produtos.map((item) => (
              <div key={item.id} className="py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="bg-slate-100 text-slate-700 font-extrabold px-2.5 py-1 rounded-lg text-[10px] uppercase">
                    {item.categoria}
                  </span>
                  <div>
                    <p className="font-extrabold text-xs text-slate-900">{item.nome}</p>
                    <p className="text-xs font-bold text-red-600">
                      R$ {Number(item.preco).toFixed(2).replace('.', ',')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleDisponibilidade(item.id, item.disponivel)}
                    className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition flex items-center gap-1 ${
                      item.disponivel
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                    }`}
                  >
                    {item.disponivel ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Disponível
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3.5 h-3.5 text-slate-400" /> Pausado
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => deletarProduto(item.id)}
                    className="p-2 text-slate-400 hover:text-red-600 transition"
                    title="Excluir item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}