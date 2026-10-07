'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Utensils, 
  Dumbbell, 
  PartyPopper,
  RefreshCw,
  Search,
  Plus,
  Trash2,
  FolderPlus,
  Check,
  X,
  Pencil
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

// Categorias padrão sugeridas para o sistema
const CATEGORIAS_PADRAO = ['Espetinhos', 'Porções', 'Bebidas', 'Sobremesas'];

export default function AdminPage() {
  const [abaAtiva, setAbaAtiva] = useState('quadras'); // 'quadras', 'mesas', 'quiosques', 'cardapio'
  const [carregando, setCarregando] = useState(true);

  // Estados dos Dados
  const [reservasQuadras, setReservasQuadras] = useState([]);
  const [reservasMesas, setReservasMesas] = useState([]);
  const [reservasQuiosques, setReservasQuiosques] = useState([]);
  const [cardapio, setCardapio] = useState([]);

  // Filtros de busca no cardápio
  const [buscaCardapio, setBuscaCardapio] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('Todos');

  // Estado para Formulário de Produto (Novo ou Edição)
  const [mostrarFormItem, setMostrarFormItem] = useState(false);
  const [itemEditandoId, setItemEditandoId] = useState(null); // null = Novo | ID = Editar
  const [formItem, setFormItem] = useState({
    nome: '',
    categoria: 'Espetinhos',
    novaCategoria: '',
    descricao: '',
    preco: '',
    imagem_url: ''
  });

  // Carregar todos os dados do Supabase
  const carregarDados = async () => {
    setCarregando(true);

    const [resQuadras, resMesas, resQuiosques, resCardapio] = await Promise.all([
      supabase.from('reservas_quadras').select('*').order('created_at', { ascending: false }),
      supabase.from('reservas_mesas').select('*').order('created_at', { ascending: false }),
      supabase.from('reservas_quiosques').select('*').order('created_at', { ascending: false }),
      supabase.from('cardapio').select('*').order('categoria', { ascending: true })
    ]);

    if (resQuadras.data) setReservasQuadras(resQuadras.data);
    if (resMesas.data) setReservasMesas(resMesas.data);
    if (resQuiosques.data) setReservasQuiosques(resQuiosques.data);
    if (resCardapio.data) setCardapio(resCardapio.data);

    setCarregando(false);
  };

  useEffect(() => {
    carregarDados();
  }, []);

  // Extrai lista única de grupos/categorias existentes no banco
  const categoriasUnicas = Array.from(
    new Set([...CATEGORIAS_PADRAO, ...cardapio.map(i => i.categoria).filter(Boolean)])
  );

  // Resetar Formulário
  const resetarFormulario = () => {
    setFormItem({ nome: '', categoria: 'Espetinhos', novaCategoria: '', descricao: '', preco: '', imagem_url: '' });
    setItemEditandoId(null);
    setMostrarFormItem(false);
  };

  // Iniciar Edição de um Produto
  const handleIniciarEdicao = (item) => {
    const categoriaExiste = categoriasUnicas.includes(item.categoria);
    setFormItem({
      nome: item.nome || '',
      categoria: categoriaExiste ? item.categoria : '__NOVA__',
      novaCategoria: categoriaExiste ? '' : item.categoria,
      descricao: item.descricao || '',
      preco: item.preco ? item.preco.toString() : '',
      imagem_url: item.imagem_url || ''
    });
    setItemEditandoId(item.id);
    setMostrarFormItem(true);
    window.scrollTo({ top: 300, behavior: 'smooth' });
  };

  // Alterar Status de uma Reserva
  const atualizarStatus = async (tabela, id, novoStatus) => {
    const { error } = await supabase.from(tabela).update({ status: novoStatus }).eq('id', id);
    if (error) {
      alert('Erro ao atualizar estado: ' + error.message);
    } else {
      carregarDados();
    }
  };

  // Alternar Disponibilidade do Item do Cardápio
  const alternarDisponibilidadeItem = async (id, disponivelAtual) => {
    const { error } = await supabase.from('cardapio').update({ disponivel: !disponivelAtual }).eq('id', id);
    if (error) {
      alert('Erro ao atualizar item: ' + error.message);
    } else {
      carregarDados();
    }
  };

  // Guardar Produto (Adicionar Novo ou Guardar Alterações da Edição)
  const handleSalvarItem = async (e) => {
    e.preventDefault();

    const categoriaFinal = formItem.categoria === '__NOVA__'
      ? formItem.novaCategoria.trim()
      : formItem.categoria.trim();

    if (!formItem.nome || !categoriaFinal || !formItem.preco) {
      alert('Por favor, preencha o nome, categoria e preço do produto.');
      return;
    }

    const dadosProduto = {
      nome: formItem.nome.trim(),
      categoria: categoriaFinal,
      descricao: formItem.descricao.trim(),
      preco: parseFloat(formItem.preco.toString().replace(',', '.')),
      imagem_url: formItem.imagem_url.trim() || 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80'
    };

    if (itemEditandoId) {
      // Editar Produto Existente
      const { error } = await supabase.from('cardapio').update(dadosProduto).eq('id', itemEditandoId);

      if (error) {
        alert('Erro ao atualizar o produto: ' + error.message);
      } else {
        alert(`Produto "${formItem.nome}" atualizado com sucesso!`);
        resetarFormulario();
        carregarDados();
      }
    } else {
      // Adicionar Novo Produto
      const { error } = await supabase.from('cardapio').insert([{ ...dadosProduto, disponivel: true }]);

      if (error) {
        alert('Erro ao guardar o produto: ' + error.message);
      } else {
        alert(`Produto "${formItem.nome}" adicionado com sucesso no grupo "${categoriaFinal}"!`);
        resetarFormulario();
        carregarDados();
      }
    }
  };

  // Remover Produto do Cardápio
  const handleRemoverItem = async (id, nome) => {
    if (!confirm(`Tem a certeza que deseja remover "${nome}" da ementa?`)) {
      return;
    }

    const { error } = await supabase.from('cardapio').delete().eq('id', id);
    if (error) {
      alert('Erro ao apagar o produto: ' + error.message);
    } else {
      carregarDados();
    }
  };

  // Itens do Cardápio Filtrados
  const cardapioFiltrado = cardapio.filter(item => {
    const atendeCategoria = filtroCategoria === 'Todos' || item.categoria === filtroCategoria;
    const atendeBusca = item.nome.toLowerCase().includes(buscaCardapio.toLowerCase()) ||
                        (item.descricao && item.descricao.toLowerCase().includes(buscaCardapio.toLowerCase()));
    return atendeCategoria && atendeBusca;
  });

  return (
    <main className="min-h-screen bg-stone-100 text-stone-800 py-8 px-4 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Topo / Voltar */}
        <div className="flex justify-between items-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-stone-600 hover:text-stone-900 bg-white px-3.5 py-2 rounded-full border border-stone-200 shadow-sm transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Voltar ao Portal Público
          </Link>

          <button
            onClick={carregarDados}
            className="inline-flex items-center gap-2 text-xs font-bold bg-amber-600 text-white px-4 py-2 rounded-full shadow hover:bg-amber-700 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${carregando ? 'animate-spin' : ''}`} />
            Atualizar Dados
          </button>
        </div>

        {/* Cabeçalho Admin */}
        <div className="bg-stone-900 text-white rounded-3xl p-6 sm:p-8 shadow-md">
          <span className="text-xs font-bold text-amber-400 tracking-wider uppercase bg-amber-950/80 border border-amber-800/50 px-3 py-1 rounded-full">
            Painel de Controlo Interno
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold mt-2">
            Gestão Resenha Sports Center
          </h1>
          <p className="text-xs sm:text-sm text-stone-400 mt-1">
            Gestão unificada de reservas de quadras, mesas, eventos e ementa.
          </p>

          {/* Resumo em Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-stone-800">
            <div className="bg-stone-800/80 p-3.5 rounded-2xl border border-stone-700">
              <span className="text-[10px] text-stone-400 uppercase font-bold">Quadras</span>
              <p className="text-xl font-black text-amber-400 mt-1">{reservasQuadras.length}</p>
            </div>
            <div className="bg-stone-800/80 p-3.5 rounded-2xl border border-stone-700">
              <span className="text-[10px] text-stone-400 uppercase font-bold">Mesas</span>
              <p className="text-xl font-black text-amber-400 mt-1">{reservasMesas.length}</p>
            </div>
            <div className="bg-stone-800/80 p-3.5 rounded-2xl border border-stone-700">
              <span className="text-[10px] text-stone-400 uppercase font-bold">Quiosques</span>
              <p className="text-xl font-black text-amber-400 mt-1">{reservasQuiosques.length}</p>
            </div>
            <div className="bg-stone-800/80 p-3.5 rounded-2xl border border-stone-700">
              <span className="text-[10px] text-stone-400 uppercase font-bold">Itens Ementa</span>
              <p className="text-xl font-black text-amber-400 mt-1">{cardapio.length}</p>
            </div>
          </div>
        </div>

        {/* Separadores de Navegação */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setAbaAtiva('quadras')}
            className={`px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
              abaAtiva === 'quadras'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-white text-stone-600 hover:bg-stone-200 border border-stone-200'
            }`}
          >
            <Dumbbell className="w-4 h-4" /> Quadras Desportivas ({reservasQuadras.length})
          </button>
          <button
            onClick={() => setAbaAtiva('mesas')}
            className={`px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
              abaAtiva === 'mesas'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-white text-stone-600 hover:bg-stone-200 border border-stone-200'
            }`}
          >
            <Utensils className="w-4 h-4" /> Mesas Restaurante ({reservasMesas.length})
          </button>
          <button
            onClick={() => setAbaAtiva('quiosques')}
            className={`px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
              abaAtiva === 'quiosques'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-white text-stone-600 hover:bg-stone-200 border border-stone-200'
            }`}
          >
            <PartyPopper className="w-4 h-4" /> Quiosques Eventos ({reservasQuiosques.length})
          </button>
          <button
            onClick={() => setAbaAtiva('cardapio')}
            className={`px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
              abaAtiva === 'cardapio'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-white text-stone-600 hover:bg-stone-200 border border-stone-200'
            }`}
          >
            📖 Gestão Ementa ({cardapio.length})
          </button>
        </div>

        {/* ==================== TABELA: QUADRAS ==================== */}
        {abaAtiva === 'quadras' && (
          <TabelaContainer titulo="Reservas de Quadras">
            {reservasQuadras.length === 0 ? (
              <SemDados />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-stone-200 text-stone-400 uppercase text-[10px] font-bold">
                      <th className="py-3 px-4">Cliente</th>
                      <th className="py-3 px-4">WhatsApp</th>
                      <th className="py-3 px-4">Data</th>
                      <th className="py-3 px-4">Horário</th>
                      <th className="py-3 px-4">Estado</th>
                      <th className="py-3 px-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {reservasQuadras.map((res) => (
                      <tr key={res.id} className="hover:bg-stone-50/50">
                        <td className="py-3 px-4 font-bold text-stone-900">{res.cliente_nome}</td>
                        <td className="py-3 px-4 text-stone-600">{res.cliente_whatsapp}</td>
                        <td className="py-3 px-4 text-stone-600">{res.data_reserva}</td>
                        <td className="py-3 px-4 text-stone-600 font-semibold">{res.horario_inicio} - {res.horario_fim}</td>
                        <td className="py-3 px-4">
                          <StatusBadge status={res.status} />
                        </td>
                        <td className="py-3 px-4 text-right space-x-2">
                          <button
                            onClick={() => atualizarStatus('reservas_quadras', res.id, 'confirmado')}
                            className="bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-md text-[11px] font-bold hover:bg-emerald-200"
                          >
                            Confirmar
                          </button>
                          <button
                            onClick={() => atualizarStatus('reservas_quadras', res.id, 'cancelado')}
                            className="bg-rose-100 text-rose-800 px-2.5 py-1 rounded-md text-[11px] font-bold hover:bg-rose-200"
                          >
                            Cancelar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </TabelaContainer>
        )}

        {/* ==================== TABELA: MESAS ==================== */}
        {abaAtiva === 'mesas' && (
          <TabelaContainer titulo="Reservas de Mesas (Restaurante)">
            {reservasMesas.length === 0 ? (
              <SemDados />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-stone-200 text-stone-400 uppercase text-[10px] font-bold">
                      <th className="py-3 px-4">Cliente</th>
                      <th className="py-3 px-4">WhatsApp</th>
                      <th className="py-3 px-4">Data</th>
                      <th className="py-3 px-4">Horário</th>
                      <th className="py-3 px-4">Pessoas</th>
                      <th className="py-3 px-4">Estado</th>
                      <th className="py-3 px-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {reservasMesas.map((res) => (
                      <tr key={res.id} className="hover:bg-stone-50/50">
                        <td className="py-3 px-4 font-bold text-stone-900">{res.cliente_nome}</td>
                        <td className="py-3 px-4 text-stone-600">{res.cliente_whatsapp}</td>
                        <td className="py-3 px-4 text-stone-600">{res.data_reserva}</td>
                        <td className="py-3 px-4 text-stone-600 font-semibold">{res.horario_inicio} - {res.horario_fim}</td>
                        <td className="py-3 px-4 text-stone-600 font-bold">{res.num_pessoas} pax</td>
                        <td className="py-3 px-4">
                          <StatusBadge status={res.status} />
                        </td>
                        <td className="py-3 px-4 text-right space-x-2">
                          <button
                            onClick={() => atualizarStatus('reservas_mesas', res.id, 'agendada')}
                            className="bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-md text-[11px] font-bold hover:bg-emerald-200"
                          >
                            Aceitar
                          </button>
                          <button
                            onClick={() => atualizarStatus('reservas_mesas', res.id, 'cancelado')}
                            className="bg-rose-100 text-rose-800 px-2.5 py-1 rounded-md text-[11px] font-bold hover:bg-rose-200"
                          >
                            Cancelar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </TabelaContainer>
        )}

        {/* ==================== TABELA: QUIOSQUES ==================== */}
        {abaAtiva === 'quiosques' && (
          <TabelaContainer titulo="Solicitações de Quiosques (Eventos)">
            {reservasQuiosques.length === 0 ? (
              <SemDados />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-stone-200 text-stone-400 uppercase text-[10px] font-bold">
                      <th className="py-3 px-4">Cliente / Evento</th>
                      <th className="py-3 px-4">WhatsApp</th>
                      <th className="py-3 px-4">Data Evento</th>
                      <th className="py-3 px-4">Convidados</th>
                      <th className="py-3 px-4">Estado</th>
                      <th className="py-3 px-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {reservasQuiosques.map((res) => (
                      <tr key={res.id} className="hover:bg-stone-50/50">
                        <td className="py-3 px-4">
                          <div className="font-bold text-stone-900">{res.cliente_nome}</div>
                          <div className="text-[10px] text-amber-700 font-semibold">{res.tipo_evento}</div>
                        </td>
                        <td className="py-3 px-4 text-stone-600">{res.cliente_whatsapp}</td>
                        <td className="py-3 px-4 text-stone-600">{res.data_reserva}</td>
                        <td className="py-3 px-4 text-stone-600 font-bold">{res.num_convidados} pessoas</td>
                        <td className="py-3 px-4">
                          <StatusBadge status={res.status} />
                        </td>
                        <td className="py-3 px-4 text-right space-x-2">
                          <button
                            onClick={() => atualizarStatus('reservas_quiosques', res.id, 'aprovado')}
                            className="bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-md text-[11px] font-bold hover:bg-emerald-200"
                          >
                            Aprovar
                          </button>
                          <button
                            onClick={() => atualizarStatus('reservas_quiosques', res.id, 'recusado')}
                            className="bg-rose-100 text-rose-800 px-2.5 py-1 rounded-md text-[11px] font-bold hover:bg-rose-200"
                          >
                            Recusar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </TabelaContainer>
        )}

        {/* ==================== SEPARADOR: GESTÃO DA EMENTA DIGITAL ==================== */}
        {abaAtiva === 'cardapio' && (
          <div className="space-y-6">
            
            {/* Barra Superior de Gestão da Ementa */}
            <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h3 className="text-xl font-bold text-stone-900">Gestão de Ementa & Grupos</h3>
                <p className="text-xs text-stone-500 mt-1">
                  Adicione, edite ou remova produtos e organize por grupos (ex: Bebidas, Sobremesas, Espetinhos).
                </p>
              </div>

              <button
                onClick={() => {
                  if (mostrarFormItem) {
                    resetarFormulario();
                  } else {
                    resetarFormulario();
                    setMostrarFormItem(true);
                  }
                }}
                className="bg-amber-600 text-white font-bold px-5 py-2.5 rounded-2xl text-xs sm:text-sm hover:bg-amber-700 transition-all flex items-center gap-2 shadow-sm"
              >
                {mostrarFormItem ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                {mostrarFormItem ? 'Fechar Formulário' : 'Adicionar Novo Produto / Grupo'}
              </button>
            </div>

            {/* FORMULÁRIO DE CRIAÇÃO / EDIÇÃO DE PRODUTO */}
            {mostrarFormItem && (
              <div className="bg-white p-6 sm:p-8 rounded-3xl border-2 border-amber-500/40 shadow-md">
                <div className="flex items-center gap-2 mb-6 text-amber-800">
                  {itemEditandoId ? <Pencil className="w-5 h-5" /> : <FolderPlus className="w-5 h-5" />}
                  <h4 className="font-extrabold text-lg">
                    {itemEditandoId ? 'Editar Produto da Ementa' : 'Novo Produto na Ementa'}
                  </h4>
                </div>

                <form onSubmit={handleSalvarItem} className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    
                    {/* Nome do Produto */}
                    <div>
                      <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                        Nome do Produto *
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Petit Gâteau / Cerveja Heineken 600ml"
                        value={formItem.nome}
                        onChange={(e) => setFormItem({ ...formItem, nome: e.target.value })}
                        required
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600"
                      />
                    </div>

                    {/* Preço */}
                    <div>
                      <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                        Preço (R$) *
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: 22.00"
                        value={formItem.preco}
                        onChange={(e) => setFormItem({ ...formItem, preco: e.target.value })}
                        required
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600"
                      />
                    </div>

                    {/* Seleção do Grupo / Categoria */}
                    <div>
                      <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                        Grupo / Categoria *
                      </label>
                      <select
                        value={formItem.categoria}
                        onChange={(e) => setFormItem({ ...formItem, categoria: e.target.value })}
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600"
                      >
                        {categoriasUnicas.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                        <option value="__NOVA__">+ Criar Novo Grupo / Categoria...</option>
                      </select>
                    </div>

                    {/* Campo para Novo Grupo Personalizado */}
                    {formItem.categoria === '__NOVA__' && (
                      <div>
                        <label className="block text-xs font-bold text-amber-800 uppercase mb-1">
                          Nome do Novo Grupo / Categoria *
                        </label>
                        <input
                          type="text"
                          placeholder="Ex: Sobremesas / Vinhos / Drinques"
                          value={formItem.novaCategoria}
                          onChange={(e) => setFormItem({ ...formItem, novaCategoria: e.target.value })}
                          required
                          className="w-full bg-amber-50 border border-amber-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600"
                        />
                      </div>
                    )}

                    {/* URL da Imagem */}
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                        URL da Imagem (Opcional)
                      </label>
                      <input
                        type="url"
                        placeholder="https://images.unsplash.com/..."
                        value={formItem.imagem_url}
                        onChange={(e) => setFormItem({ ...formItem, imagem_url: e.target.value })}
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600"
                      />
                    </div>

                    {/* Descrição */}
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                        Descrição do Prato / Bebida
                      </label>
                      <textarea
                        rows="2"
                        placeholder="Ex: Acompanha gelado de baunilha e calda de chocolate quente..."
                        value={formItem.descricao}
                        onChange={(e) => setFormItem({ ...formItem, descricao: e.target.value })}
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600"
                      ></textarea>
                    </div>

                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={resetarFormulario}
                      className="px-4 py-2 bg-stone-100 text-stone-700 font-bold rounded-xl text-xs hover:bg-stone-200"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 bg-amber-600 text-white font-bold rounded-xl text-xs hover:bg-amber-700 shadow-sm"
                    >
                      {itemEditandoId ? 'Guardar Alterações' : 'Adicionar Produto'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Filtro e Pesquisa na Ementa */}
            <div className="bg-white p-4 rounded-2xl border border-stone-200 space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  placeholder="Pesquisar produto na ementa..."
                  value={buscaCardapio}
                  onChange={(e) => setBuscaCardapio(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-600"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                {['Todos', ...categoriasUnicas].map((categoria) => (
                  <button
                    key={categoria}
                    type="button"
                    onClick={() => setFiltroCategoria(categoria)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                      filtroCategoria === categoria
                        ? 'bg-stone-900 text-amber-400'
                        : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                    }`}
                  >
                    {categoria}
                  </button>
                ))}
              </div>
            </div>

            {carregando ? (
              <div className="bg-white p-8 text-center rounded-2xl border border-stone-200 text-stone-500 text-sm">
                A carregar ementa...
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {cardapioFiltrado.length === 0 ? (
                  <div className="bg-white p-8 rounded-2xl border border-stone-200 text-center text-stone-500 col-span-full">
                    Nenhum item encontrado para esta pesquisa.
                  </div>
                ) : (
                  cardapioFiltrado.map((item) => (
                    <div key={item.id} className="bg-white border border-stone-200 rounded-3xl overflow-hidden shadow-sm">
                      <img
                        src={item.imagem_url || 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80'}
                        alt={item.nome}
                        className="h-44 w-full object-cover"
                      />

                      <div className="p-4 space-y-3">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-amber-700 bg-amber-50 px-2 py-1 rounded-full">
                            {item.categoria}
                          </span>
                          <button
                            type="button"
                            onClick={() => alternarDisponibilidadeItem(item.id, !!item.disponivel)}
                            className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                              item.disponivel
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-stone-200 text-stone-700'
                            }`}
                          >
                            {item.disponivel ? 'Disponível' : 'Indisponível'}
                          </button>
                        </div>

                        <div>
                          <h4 className="text-lg font-black text-stone-900">{item.nome}</h4>
                          <p className="text-xs text-stone-500 mt-1">
                            {item.descricao || 'Sem descrição disponível.'}
                          </p>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-stone-100">
                          <span className="text-lg font-black text-amber-700">
                            R$ {Number(item.preco || 0).toFixed(2).replace('.', ',')}
                          </span>

                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => handleIniciarEdicao(item)}
                              className="bg-stone-100 text-stone-700 p-2.5 rounded-xl hover:bg-stone-200"
                              aria-label={`Editar ${item.nome}`}
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoverItem(item.id, item.nome)}
                              className="bg-rose-100 text-rose-700 p-2.5 rounded-xl hover:bg-rose-200"
                              aria-label={`Remover ${item.nome}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

function TabelaContainer({ titulo, children }) {
  return (
    <div className="bg-white rounded-3xl p-4 sm:p-6 border border-stone-200 shadow-sm">
      <h3 className="text-lg font-bold text-stone-900 mb-4">{titulo}</h3>
      {children}
    </div>
  );
}

function SemDados() {
  return (
    <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 p-8 text-center text-sm text-stone-500">
      Nenhuma reserva encontrada neste momento.
    </div>
  );
}

function StatusBadge({ status }) {
  const mapa = {
    pendente: 'bg-amber-100 text-amber-800',
    confirmada: 'bg-emerald-100 text-emerald-800',
    confirmado: 'bg-emerald-100 text-emerald-800',
    agendada: 'bg-emerald-100 text-emerald-800',
    aprovado: 'bg-emerald-100 text-emerald-800',
    cancelado: 'bg-rose-100 text-rose-800',
    recusado: 'bg-rose-100 text-rose-800',
    em_analise: 'bg-sky-100 text-sky-800',
    default: 'bg-stone-200 text-stone-700'
  };

  const texto = {
    pendente: 'Pendente',
    confirmada: 'Confirmada',
    confirmado: 'Confirmado',
    agendada: 'Agendada',
    aprovado: 'Aprovado',
    cancelado: 'Cancelado',
    recusado: 'Recusado',
    em_analise: 'Em análise'
  };

  const key = status || 'default';

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${mapa[key] || mapa.default}`}>
      {texto[key] || 'Sem status'}
    </span>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="bg-stone-800/80 p-3.5 rounded-2xl border border-stone-700">
      <span className="text-[10px] text-stone-400 uppercase font-bold">{label}</span>
      <p className="text-xl font-black text-amber-400 mt-1">{value}</p>
    </div>
  );
}
