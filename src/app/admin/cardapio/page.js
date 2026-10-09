'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, Pencil, Trash2, Upload, Loader2, Check, X } from 'lucide-react';

const CATEGORIAS_PADRAO = ['Espetinhos', 'Porções', 'Bebidas', 'Sobremesas'];

export default function AdminCardapioPage() {
  const [cardapio, setCardapio] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [itemEditandoId, setItemEditandoId] = useState(null);

  const [formItem, setFormItem] = useState({
    nome: '',
    categoria: 'Espetinhos',
    novaCategoria: '',
    descricao: '',
    preco: '',
    imagem_url: '',
  });

  const carregarCardapio = async () => {
    setLoading(true);
    const { data } = await supabase.from('cardapio').select('*').order('categoria', { ascending: true });
    if (data) setCardapio(data);
    setLoading(false);
  };

  useEffect(() => {
    carregarCardapio();
  }, []);

  const categoriasUnicas = Array.from(
    new Set([...CATEGORIAS_PADRAO, ...cardapio.map((i) => i.categoria).filter(Boolean)])
  );

  const resetarFormulario = () => {
    setFormItem({ nome: '', categoria: 'Espetinhos', novaCategoria: '', descricao: '', preco: '', imagem_url: '' });
    setItemEditandoId(null);
    setMostrarForm(false);
  };

  const handleFileUpload = async (e) => {
    try {
      setUploading(true);
      const file = e.target.files?.[0];
      if (!file) return;

      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage.from('produtos').upload(fileName, file);
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('produtos').getPublicUrl(fileName);
      setFormItem((prev) => ({ ...prev, imagem_url: data.publicUrl }));
    } catch (err) {
      alert('Erro no upload: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSalvar = async (e) => {
    e.preventDefault();

    const catFinal = formItem.categoria === '__NOVA__' ? formItem.novaCategoria.trim() : formItem.categoria.trim();

    const dados = {
      nome: formItem.nome.trim(),
      categoria: catFinal,
      descricao: formItem.descricao.trim(),
      preco: parseFloat(formItem.preco.toString().replace(',', '.')),
      imagem_url: formItem.imagem_url.trim(),
    };

    if (itemEditandoId) {
      await supabase.from('cardapio').update(dados).eq('id', itemEditandoId);
    } else {
      await supabase.from('cardapio').insert([{ ...dados, disponivel: true }]);
    }

    resetarFormulario();
    carregarCardapio();
  };

  const handleEditar = (item) => {
    const catExiste = categoriasUnicas.includes(item.categoria);
    setFormItem({
      nome: item.nome || '',
      categoria: catExiste ? item.categoria : '__NOVA__',
      novaCategoria: catExiste ? '' : item.categoria,
      descricao: item.descricao || '',
      preco: item.preco ? item.preco.toString() : '',
      imagem_url: item.imagem_url || '',
    });
    setItemEditandoId(item.id);
    setMostrarForm(true);
  };

  const handleRemover = async (id, nome) => {
    if (confirm(`Remover "${nome}" do cardápio?`)) {
      await supabase.from('cardapio').delete().eq('id', id);
      carregarCardapio();
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex justify-between items-center">
        <div>
          <h1 className="text-xl font-black text-slate-900">Gestão de Cardápio</h1>
          <p className="text-xs text-slate-500 mt-1">Adicione produtos e suba fotos diretamente para o storage.</p>
        </div>

        <button
          onClick={() => {
            if (mostrarForm) resetarFormulario();
            else {
              resetarFormulario();
              setMostrarForm(true);
            }
          }}
          className="bg-red-600 text-white font-bold px-4 py-2.5 rounded-2xl text-xs hover:bg-red-700 transition flex items-center gap-1.5 shadow-sm"
        >
          {mostrarForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {mostrarForm ? 'Fechar' : 'Novo Produto'}
        </button>
      </div>

      {mostrarForm && (
        <div className="bg-white p-6 rounded-3xl border-2 border-red-500/40 shadow-md">
          <form onSubmit={handleSalvar} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nome do Produto *</label>
                <input
                  type="text" required value={formItem.nome}
                  onChange={(e) => setFormItem({ ...formItem, nome: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Preço (R$) *</label>
                <input
                  type="text" required value={formItem.preco}
                  onChange={(e) => setFormItem({ ...formItem, preco: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Categoria *</label>
                <select
                  value={formItem.categoria}
                  onChange={(e) => setFormItem({ ...formItem, categoria: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm"
                >
                  {categoriasUnicas.map((c) => <option key={c} value={c}>{c}</option>)}
                  <option value="__NOVA__">+ Criar Nova Categoria...</option>
                </select>
              </div>

              {formItem.categoria === '__NOVA__' && (
                <div>
                  <label className="block text-xs font-bold text-red-600 uppercase mb-1">Nome da Nova Categoria *</label>
                  <input
                    type="text" required value={formItem.novaCategoria}
                    onChange={(e) => setFormItem({ ...formItem, novaCategoria: e.target.value })}
                    className="w-full bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 text-sm"
                  />
                </div>
              )}

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Foto do Produto</label>
                <div className="flex gap-3 items-center">
                  <label className="flex items-center gap-2 bg-slate-50 border border-slate-300 border-dashed rounded-xl p-2.5 cursor-pointer text-xs font-bold text-slate-700">
                    {uploading ? <Loader2 className="w-4 h-4 animate-spin text-red-600" /> : <Upload className="w-4 h-4 text-red-600" />}
                    <span>{uploading ? 'Carregando...' : 'Upload Foto'}</span>
                    <input type="file" accept="image/*" onChange={handleFileUpload} disabled={uploading} className="hidden" />
                  </label>
                  <input
                    type="url" placeholder="Ou cole a URL da imagem..." value={formItem.imagem_url}
                    onChange={(e) => setFormItem({ ...formItem, imagem_url: e.target.value })}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs"
                  />
                </div>
                {formItem.imagem_url && (
                  <div className="flex items-center gap-2 mt-2">
                    <img src={formItem.imagem_url} alt="Preview" className="w-12 h-12 object-cover rounded-xl border" />
                    <span className="text-xs text-emerald-600 font-bold flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Imagem Pronta</span>
                  </div>
                )}
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Descrição</label>
                <textarea
                  rows="2" value={formItem.descricao}
                  onChange={(e) => setFormItem({ ...formItem, descricao: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={resetarFormulario} className="px-4 py-2 bg-slate-100 rounded-xl text-xs font-bold text-slate-700">Cancelar</button>
              <button type="submit" disabled={uploading} className="px-6 py-2 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700">Salvar</button>
            </div>
          </form>
        </div>
      )}

      {/* LISTA DE PRODUTOS */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? <p className="text-xs text-slate-400">Carregando...</p> : cardapio.map((item) => (
          <div key={item.id} className="bg-white border border-slate-200 rounded-3xl p-4 flex justify-between items-center shadow-sm">
            <div className="flex items-center gap-3">
              {item.imagem_url ? (
                <img src={item.imagem_url} alt={item.nome} className="w-14 h-14 object-cover rounded-2xl" />
              ) : (
                <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center text-[10px] text-slate-400">Sem foto</div>
              )}
              <div>
                <span className="text-[10px] font-bold uppercase text-red-600 bg-red-50 px-2 py-0.5 rounded-full">{item.categoria}</span>
                <h3 className="font-extrabold text-sm text-slate-900 mt-1">{item.nome}</h3>
                <p className="text-xs font-bold text-slate-700 mt-0.5">R$ {Number(item.preco).toFixed(2).replace('.', ',')}</p>
              </div>
            </div>

            <div className="flex gap-1">
              <button onClick={() => handleEditar(item)} className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl"><Pencil className="w-4 h-4" /></button>
              <button onClick={() => handleRemover(item.id, item.nome)} className="p-2 text-red-600 hover:bg-red-50 rounded-xl"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}