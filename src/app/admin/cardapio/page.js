'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Eye, EyeOff, Loader2, Pencil, Plus, Search, Trash2, UtensilsCrossed, PauseCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { CATEGORIAS_CARDAPIO } from '@/lib/config';
import { agruparPorCategoria, normalizarBusca, ordemCategoria } from '@/lib/cardapio';
import { formatarMoeda, lerPreco } from '@/lib/formatadores';
import { useFeedback } from '@/components/feedback';
import { CabecalhoPagina, Indicador, Segmentado, Vazio } from '@/components/admin/ui';
import Modal from '@/components/modal';
import CampoFoto from '@/components/admin/campo-foto';

const ITEM_VAZIO = { nome: '', categoria: CATEGORIAS_CARDAPIO[0], preco: '', disponivel: true, descricao: '', imagem_url: '' };

export default function AdminCardapioPage() {
  const { toast, confirmar } = useFeedback();
  const [produtos, setProdutos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState('todos');
  const [edicao, setEdicao] = useState(null); // item em edição (id ausente = novo)
  const [salvando, setSalvando] = useState(false);
  const [alternando, setAlternando] = useState(null);
  const [colunasExtras, setColunasExtras] = useState(false);

  const carregar = useCallback(async () => {
    setCarregando(true);
    const { data, error } = await supabase.from('cardapio').select('*');
    if (error) toast('Erro ao carregar cardápio: ' + error.message, 'erro');
    // Com a tabela vazia não dá para inferir as colunas pelas linhas: consulta direto.
    if (data && data.length === 0) {
      const { error: semColunas } = await supabase.from('cardapio').select('descricao, imagem_url').limit(1);
      setColunasExtras(!semColunas);
    }
    setProdutos(data || []);
    setCarregando(false);
  }, [toast]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga inicial de dados
    carregar();
  }, [carregar]);

  // Colunas opcionais: só exibimos os campos se existirem na tabela
  const temDescricao = colunasExtras || produtos.some((p) => 'descricao' in p);
  const temImagem = colunasExtras || produtos.some((p) => 'imagem_url' in p);

  const categorias = useMemo(
    () => [...new Set([...CATEGORIAS_CARDAPIO, ...produtos.map((p) => p.categoria).filter(Boolean)])].sort(ordemCategoria),
    [produtos]
  );

  const termo = normalizarBusca(busca);
  const filtrados = produtos.filter(
    (p) =>
      (filtro === 'todos' || (filtro === 'ativos' ? p.disponivel : !p.disponivel)) &&
      (!termo || normalizarBusca(p.nome).includes(termo) || normalizarBusca(p.categoria).includes(termo))
  );
  const grupos = agruparPorCategoria(filtrados);
  const ativos = produtos.filter((p) => p.disponivel).length;

  const salvar = async (e) => {
    e.preventDefault();
    const preco = lerPreco(edicao.preco);
    if (!edicao.nome.trim()) return toast('Informe o nome do item.', 'erro');
    if (!Number.isFinite(preco) || preco < 0) return toast('Preço inválido. Use o formato 19,90.', 'erro');

    const campos = {
      nome: edicao.nome.trim(),
      categoria: edicao.categoria.trim() || 'Outros',
      preco,
      disponivel: edicao.disponivel,
      ...(temDescricao && { descricao: edicao.descricao?.trim() || null }),
      ...(temImagem && { imagem_url: edicao.imagem_url?.trim() || null }),
    };

    setSalvando(true);
    const { error } = edicao.id
      ? await supabase.from('cardapio').update(campos).eq('id', edicao.id)
      : await supabase.from('cardapio').insert([campos]);
    setSalvando(false);

    if (error) return toast('Erro ao salvar: ' + error.message, 'erro');
    toast(edicao.id ? 'Item atualizado.' : 'Item adicionado ao cardápio.');
    setEdicao(null);
    carregar();
  };

  const alternarDisponivel = async (item) => {
    setAlternando(item.id);
    const { error } = await supabase.from('cardapio').update({ disponivel: !item.disponivel }).eq('id', item.id);
    setAlternando(null);
    if (error) return toast('Erro: ' + error.message, 'erro');
    setProdutos((lista) => lista.map((p) => (p.id === item.id ? { ...p, disponivel: !p.disponivel } : p)));
    toast(item.disponivel ? `${item.nome} pausado (some do cardápio público).` : `${item.nome} disponível novamente.`);
  };

  const excluir = async (item) => {
    const ok = await confirmar({
      titulo: 'Excluir item?',
      mensagem: `"${item.nome}" será removido definitivamente. Se for algo temporário, prefira pausar.`,
      textoConfirmar: 'Excluir',
      perigo: true,
    });
    if (!ok) return;
    const { error } = await supabase.from('cardapio').delete().eq('id', item.id);
    if (error) return toast('Erro ao excluir: ' + error.message, 'erro');
    setProdutos((lista) => lista.filter((p) => p.id !== item.id));
    setEdicao(null);
    toast('Item excluído.');
  };

  return (
    <>
      <CabecalhoPagina titulo="Cardápio" descricao="Itens disponíveis aparecem no cardápio público e no pré-pedido de mesas e quiosques.">
        <button onClick={() => setEdicao({ ...ITEM_VAZIO })} className="btn-primario">
          <Plus className="w-4 h-4" /> Novo item
        </button>
      </CabecalhoPagina>

      <div className="grid grid-cols-3 gap-3">
        <Indicador rotulo="Itens" valor={carregando ? '–' : produtos.length} icone={UtensilsCrossed} />
        <Indicador rotulo="Disponíveis" valor={carregando ? '–' : ativos} icone={CheckCircle2} tom="emerald" />
        <Indicador rotulo="Pausados" valor={carregando ? '–' : produtos.length - ativos} icone={PauseCircle} tom="amber" />
      </div>

      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input type="search" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar item ou categoria..." className="input pl-10 bg-white" aria-label="Buscar no cardápio" />
        </div>
        <Segmentado
          rotulo="Disponibilidade"
          valor={filtro}
          aoMudar={setFiltro}
          opcoes={[{ valor: 'todos', label: 'Todos' }, { valor: 'ativos', label: 'Disponíveis' }, { valor: 'pausados', label: 'Pausados' }]}
        />
      </div>

      {carregando ? (
        <div className="cartao p-12 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
      ) : grupos.length === 0 ? (
        <div className="cartao">
          <Vazio icone={UtensilsCrossed} titulo={produtos.length ? 'Nada encontrado' : 'Cardápio vazio'}>
            {!produtos.length && (
              <button onClick={() => setEdicao({ ...ITEM_VAZIO })} className="btn-primario mt-4"><Plus className="w-4 h-4" /> Cadastrar primeiro item</button>
            )}
          </Vazio>
        </div>
      ) : (
        grupos.map(([categoria, itens]) => (
          <section key={categoria}>
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-2">
              {categoria} <span className="text-slate-400 font-semibold">· {itens.length}</span>
            </h2>
            <ul className="cartao divide-y divide-slate-100 overflow-hidden">
              {itens.map((item) => (
                <li key={item.id} className={`flex items-center gap-3 px-4 py-3 ${item.disponivel ? '' : 'bg-slate-50'}`}>
                  <button onClick={() => setEdicao({ ...ITEM_VAZIO, ...item, preco: String(item.preco).replace('.', ','), descricao: item.descricao || '', imagem_url: item.imagem_url || '' })} className="flex-1 min-w-0 text-left group">
                    <p className={`font-bold truncate group-hover:text-red-600 ${item.disponivel ? 'text-slate-900' : 'text-slate-400 line-through'}`}>{item.nome}</p>
                    {item.descricao && <p className="text-xs text-slate-500 truncate">{item.descricao}</p>}
                  </button>
                  <span className="font-display font-black text-lg text-slate-900 tabular-nums">{formatarMoeda(item.preco)}</span>
                  <button
                    onClick={() => alternarDisponivel(item)}
                    disabled={alternando === item.id}
                    className={`chip !py-1.5 ${item.disponivel ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100' : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'}`}
                    aria-label={item.disponivel ? `Pausar ${item.nome}` : `Ativar ${item.nome}`}
                  >
                    {alternando === item.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : item.disponivel ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    <span className="hidden sm:inline">{item.disponivel ? 'Disponível' : 'Pausado'}</span>
                  </button>
                  <button onClick={() => setEdicao({ ...ITEM_VAZIO, ...item, preco: String(item.preco).replace('.', ','), descricao: item.descricao || '', imagem_url: item.imagem_url || '' })} className="p-2 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100" aria-label={`Editar ${item.nome}`}>
                    <Pencil className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}

      <Modal aberto={!!edicao} aoFechar={() => setEdicao(null)} titulo={edicao?.id ? 'Editar item' : 'Novo item'} icone={<UtensilsCrossed className="w-5 h-5 text-red-600" />}>
        {edicao && (
          <form onSubmit={salvar} className="space-y-4">
            <div>
              <label htmlFor="item-nome" className="rotulo">Nome *</label>
              <input id="item-nome" required autoFocus value={edicao.nome} onChange={(e) => setEdicao({ ...edicao, nome: e.target.value })} className="input" placeholder="Ex.: Espetinho de picanha" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="item-cat" className="rotulo">Categoria</label>
                <input id="item-cat" list="lista-categorias" value={edicao.categoria} onChange={(e) => setEdicao({ ...edicao, categoria: e.target.value })} className="input" />
                <datalist id="lista-categorias">
                  {categorias.map((c) => <option key={c} value={c} />)}
                </datalist>
              </div>
              <div>
                <label htmlFor="item-preco" className="rotulo">Preço (R$) *</label>
                <input id="item-preco" required inputMode="decimal" value={edicao.preco} onChange={(e) => setEdicao({ ...edicao, preco: e.target.value })} className="input" placeholder="19,90" />
              </div>
            </div>
            {temDescricao && (
              <div>
                <label htmlFor="item-desc" className="rotulo">Descrição</label>
                <textarea id="item-desc" rows={2} value={edicao.descricao} onChange={(e) => setEdicao({ ...edicao, descricao: e.target.value })} className="input resize-none" placeholder="Ex.: 200g, acompanha farofa e vinagrete" />
              </div>
            )}
            {temImagem && (
              <CampoFoto valor={edicao.imagem_url} aoMudar={(imagem_url) => setEdicao((atual) => ({ ...atual, imagem_url }))} />
            )}
            <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
              <input type="checkbox" checked={edicao.disponivel} onChange={(e) => setEdicao({ ...edicao, disponivel: e.target.checked })} className="w-4 h-4 accent-red-600" />
              <span className="text-sm font-semibold text-slate-700">Disponível no cardápio público</span>
            </label>
            <div className="flex items-center justify-between gap-2 pt-2">
              {edicao.id ? (
                <button type="button" onClick={() => excluir(edicao)} className="p-2.5 rounded-xl text-red-600 hover:bg-red-50" aria-label="Excluir item">
                  <Trash2 className="w-4 h-4" />
                </button>
              ) : <span />}
              <div className="flex gap-2">
                <button type="button" onClick={() => setEdicao(null)} className="btn-secundario">Cancelar</button>
                <button type="submit" disabled={salvando} className="btn-primario">
                  {salvando && <Loader2 className="w-4 h-4 animate-spin" />} Salvar
                </button>
              </div>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}
