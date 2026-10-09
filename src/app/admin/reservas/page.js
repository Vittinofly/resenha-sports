'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  CheckCircle, 
  XCircle, 
  History, 
  Clock, 
  RefreshCw, 
  ChevronDown, 
  ChevronUp, 
  MessageCircle, 
  Save, 
  FileText, 
  ShoppingBag,
  User,
  Phone,
  Calendar,
  PartyPopper,
  Home,
  Users
} from 'lucide-react';

export default function AdminReservasPage() {
  const [visualizacao, setVisualizacao] = useState('ativas'); // 'ativas' | 'historico'
  const [tabelaAtiva, setTabelaAtiva] = useState('quadras'); // 'quadras' | 'mesas' | 'quiosques'
  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState(null);

  const [itemExpandidoId, setItemExpandidoId] = useState(null);
  const [observacoesTemp, setObservacoesTemp] = useState({});
  const [salvandoObs, setSalvandoObs] = useState(false);

  const carregarReservas = async () => {
    setLoading(true);
    let nomeTabela = 'reservas_quadras';
    if (tabelaAtiva === 'mesas') nomeTabela = 'reservas_mesas';
    if (tabelaAtiva === 'quiosques') nomeTabela = 'reservas_quiosques';

    const { data } = await supabase.from(nomeTabela).select('*').order('created_at', { ascending: false });
    
    if (data) {
      setReservas(data);
      const obsMap = {};
      data.forEach((r) => {
        obsMap[r.id] = r.observacoes || '';
      });
      setObservacoesTemp(obsMap);
    }
    setUltimaAtualizacao(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    setLoading(false);
  };

  useEffect(() => {
    carregarReservas();

    const interval = setInterval(() => {
      carregarReservas();
    }, 2 * 60 * 1000);

    return () => clearInterval(interval);
  }, [tabelaAtiva]);

  const toggleExpansao = (id) => {
    setItemExpandidoId(itemExpandidoId === id ? null : id);
  };

  const alterarStatus = async (id, novoStatus) => {
    let nomeTabela = 'reservas_quadras';
    if (tabelaAtiva === 'mesas') nomeTabela = 'reservas_mesas';
    if (tabelaAtiva === 'quiosques') nomeTabela = 'reservas_quiosques';

    await supabase.from(nomeTabela).update({ status: novoStatus }).eq('id', id);
    carregarReservas();
  };

  const handleSalvarObservacao = async (id) => {
    setSalvandoObs(true);
    let nomeTabela = 'reservas_quadras';
    if (tabelaAtiva === 'mesas') nomeTabela = 'reservas_mesas';
    if (tabelaAtiva === 'quiosques') nomeTabela = 'reservas_quiosques';

    const textoObs = observacoesTemp[id] || '';
    const { error } = await supabase.from(nomeTabela).update({ observacoes: textoObs }).eq('id', id);

    setSalvandoObs(false);

    if (error) {
      alert('Erro ao salvar observação: ' + error.message);
    } else {
      alert('Observação salva com sucesso!');
      carregarReservas();
    }
  };

  // Função para interpretar e separar Quiosque, Evento e Consumo de forma organizada
  const parseDetalhesEvento = (texto) => {
    if (!texto) return { evento: 'Não informado', quiosque: 'Não especificado', consumoItens: [] };

    const partes = texto.split('|').map((p) => p.trim());
    
    let evento = partes[0] || 'Evento';
    let quiosque = partes[1] || 'Quiosque Solicitado';
    let consumoTexto = partes.find((p) => p.toLowerCase().includes('pedido:') || p.toLowerCase().includes('pré-pedido:')) || '';

    let consumoLimpo = consumoTexto.replace(/^(pedido|pré-pedido):\s*\[?/i, '').replace(/\]$/, '').trim();

    let consumoItens = consumoLimpo && consumoLimpo !== 'Nenhum'
      ? consumoLimpo.split(',').map((item) => item.trim())
      : [];

    return { evento, quiosque, consumoItens, textoCompleto: texto };
  };

  const abrirWhatsApp = (res) => {
    const numLimpo = (res.cliente_whatsapp || '').replace(/\D/g, '');
    if (!numLimpo) {
      alert('Número de telefone inválido.');
      return;
    }

    const phoneComDDI = numLimpo.startsWith('55') ? numLimpo : `55${numLimpo}`;
    const info = parseDetalhesEvento(res.tipo_evento || res.quadra_nome);

    const mensagem = `Olá, ${res.cliente_nome}! 👋🏼\n\nFalamos do *Resenha Sports Center & Gastrobar*.\nReferente à sua reserva para *${res.data_reserva}* (${info.quiosque || info.evento}).\n\nConfirmamos os detalhes e o seu pedido de consumo?`;

    window.open(`https://wa.me/${phoneComDDI}?text=${encodeURIComponent(mensagem)}`, '_blank');
  };

  const reservasFiltradas = reservas.filter((r) => {
    const ehAtiva = r.status === 'pendente' || r.status === 'confirmado' || r.status === 'agendada';
    return visualizacao === 'ativas' ? ehAtiva : !ehAtiva;
  });

  return (
    <div className="space-y-6 font-sans text-slate-900">
      
      {/* TOPO DO PAINEL */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-black">⚙️ Gestão de Agendamentos</h1>
          <p className="text-xs text-slate-500 mt-0.5">Acompanhe reservas, consulte o quiosque e os itens do cardápio solicitados.</p>
        </div>

        <div className="flex items-center gap-3">
          {ultimaAtualizacao && (
            <span className="text-[10px] font-bold text-slate-400 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-xl flex items-center gap-1">
              <RefreshCw className={`w-3 h-3 text-emerald-600 ${loading ? 'animate-spin' : ''}`} />
              Atualizado: {ultimaAtualizacao} (Auto 2m)
            </span>
          )}

          <div className="flex gap-2 bg-slate-100 p-1.5 rounded-2xl">
            <button
              onClick={() => setVisualizacao('ativas')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                visualizacao === 'ativas' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Clock className="w-3.5 h-3.5" /> Reservas Ativas
            </button>
            <button
              onClick={() => setVisualizacao('historico')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                visualizacao === 'historico' ? 'bg-red-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <History className="w-3.5 h-3.5" /> Histórico / Concluídas
            </button>
          </div>
        </div>
      </div>

      {/* SELETOR DE CATEGORIA */}
      <div className="flex gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => { setTabelaAtiva('quadras'); setItemExpandidoId(null); }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            tabelaAtiva === 'quadras' ? 'bg-slate-900 text-white shadow-sm' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
          }`}
        >
          🎾 Quadras Esportivas
        </button>
        <button
          onClick={() => { setTabelaAtiva('mesas'); setItemExpandidoId(null); }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            tabelaAtiva === 'mesas' ? 'bg-slate-900 text-white shadow-sm' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
          }`}
        >
          🍽️ Mesas Restaurante
        </button>
        <button
          onClick={() => { setTabelaAtiva('quiosques'); setItemExpandidoId(null); }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            tabelaAtiva === 'quiosques' ? 'bg-slate-900 text-white shadow-sm' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
          }`}
        >
          🛖 Quiosques Eventos
        </button>
      </div>

      {/* LISTAGEM DE RESERVAS */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
        {loading && reservas.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-6">Carregando agendamentos...</p>
        ) : reservasFiltradas.length === 0 ? (
          <p className="text-xs text-slate-500 py-8 text-center">Nenhuma reserva encontrada nesta seção.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {reservasFiltradas.map((item) => {
              const estaExpandido = itemExpandidoId === item.id;
              const detalhes = parseDetalhesEvento(item.tipo_evento || item.quadra_nome);

              return (
                <div key={item.id} className="py-4 space-y-3 transition">
                  
                  {/* RESUMO (RESUMIDO) */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => toggleExpansao(item.id)}
                        className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition shrink-0"
                        title={estaExpandido ? "Recolher detalhes" : "Expandir detalhes, quiosque e consumo"}
                      >
                        {estaExpandido ? <ChevronUp className="w-4 h-4 text-red-600" /> : <ChevronDown className="w-4 h-4" />}
                      </button>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-sm text-slate-900">{item.cliente_nome.split('|')[0]}</span>
                          <span className="text-xs text-slate-500">({item.cliente_whatsapp})</span>
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5">
                          Data: <strong className="text-slate-900">{item.data_reserva}</strong>
                          {item.horario_inicio && ` às ${item.horario_inicio}`}
                          {` | ${detalhes.quiosque !== 'Quiosque Solicitado' ? detalhes.quiosque : detalhes.evento}`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${
                        item.status === 'concluido' ? 'bg-slate-100 text-slate-700' :
                        item.status === 'cancelado' ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {item.status}
                      </span>

                      <button
                        onClick={() => abrirWhatsApp(item)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                      >
                        <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                      </button>

                      {visualizacao === 'ativas' && (
                        <>
                          <button
                            onClick={() => alterarStatus(item.id, 'concluido')}
                            className="bg-slate-900 text-white px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-slate-800 flex items-center gap-1 shadow-sm transition"
                          >
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Concluir
                          </button>
                          <button
                            onClick={() => alterarStatus(item.id, 'cancelado')}
                            className="bg-red-50 text-red-700 px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-red-100 flex items-center gap-1 transition"
                          >
                            <XCircle className="w-3.5 h-3.5" /> Cancelar
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* CARD EXPANDIDO: QUIOSQUE + CONSUMO + OBSERVAÇÕES */}
                  {estaExpandido && (
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 text-xs text-slate-800 space-y-4 mt-2">
                      
                      {/* INFORMAÇÕES DO CLIENTE */}
                      <div className="grid sm:grid-cols-4 gap-4 border-b border-slate-200 pb-4">
                        <div>
                          <span className="font-bold text-slate-400 uppercase text-[10px] flex items-center gap-1">
                            <User className="w-3 h-3 text-red-600" /> Cliente
                          </span>
                          <p className="font-extrabold text-slate-900 text-sm mt-0.5">{item.cliente_nome.split('|')[0]}</p>
                        </div>

                        <div>
                          <span className="font-bold text-slate-400 uppercase text-[10px] flex items-center gap-1">
                            <Phone className="w-3 h-3 text-red-600" /> WhatsApp
                          </span>
                          <p className="font-extrabold text-slate-900 text-sm mt-0.5">{item.cliente_whatsapp}</p>
                        </div>

                        <div>
                          <span className="font-bold text-slate-400 uppercase text-[10px] flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-red-600" /> Data / Horário
                          </span>
                          <p className="font-extrabold text-slate-900 text-sm mt-0.5">
                            {item.data_reserva} {item.horario_inicio ? `(${item.horario_inicio} - ${item.horario_fim || '--'})` : ''}
                          </p>
                        </div>

                        <div>
                          <span className="font-bold text-slate-400 uppercase text-[10px] flex items-center gap-1">
                            <Users className="w-3 h-3 text-red-600" /> Pessoas / Pax
                          </span>
                          <p className="font-extrabold text-slate-900 text-sm mt-0.5">
                            {item.num_convidados || item.num_pessoas || 'Conforme quiosque'} pessoas
                          </p>
                        </div>
                      </div>

                      {/* BLOCOS DE DESTAQUE: ESPAÇO x CONSUMO */}
                      <div className="grid sm:grid-cols-2 gap-4">
                        
                        {/* QUIOSQUE / ESPAÇO */}
                        <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
                          <span className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                            <Home className="w-4 h-4 text-red-600" /> Local / Quiosque Reservado:
                          </span>
                          <div className="bg-slate-900 text-white p-3 rounded-xl font-black text-sm">
                            {detalhes.quiosque}
                          </div>
                          <p className="text-[11px] text-slate-500">
                            <strong>Tipo de Evento:</strong> {detalhes.evento}
                          </p>
                        </div>

                        {/* LISTA DE CONSUMO DO CARDÁPIO */}
                        <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
                          <span className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                            <ShoppingBag className="w-4 h-4 text-red-600" /> Consumo Pré-Pedido (Cardápio):
                          </span>

                          {detalhes.consumoItens.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {detalhes.consumoItens.map((prod, idx) => (
                                <span
                                  key={idx}
                                  className="bg-emerald-50 text-emerald-900 border border-emerald-200 font-extrabold px-3 py-1 rounded-xl text-xs flex items-center gap-1"
                                >
                                  {prod}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <p className="text-slate-400 italic text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
                              Nenhum item do cardápio foi selecionado no pré-pedido.
                            </p>
                          )}
                        </div>

                      </div>

                      {/* CAMPO DE OBSERVAÇÕES INTERNAS DA EQUIPE */}
                      <div className="space-y-2 pt-2 border-t border-slate-200">
                        <label className="font-bold text-slate-900 flex items-center gap-1 text-xs">
                          <FileText className="w-3.5 h-3.5 text-red-600" /> Observações Internas da Equipe (ex: Mesa preferida, exigências do cliente):
                        </label>
                        
                        <div className="flex gap-2">
                          <textarea
                            rows="2"
                            placeholder="Escreva aqui observações internas sobre a reserva..."
                            value={observacoesTemp[item.id] || ''}
                            onChange={(e) => setObservacoesTemp({ ...observacoesTemp, [item.id]: e.target.value })}
                            className="flex-1 bg-white border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-red-600 text-slate-900 font-medium"
                          ></textarea>

                          <button
                            onClick={() => handleSalvarObservacao(item.id)}
                            disabled={salvandoObs}
                            className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 rounded-xl flex items-center gap-1.5 transition text-xs shrink-0 disabled:opacity-50"
                          >
                            <Save className="w-3.5 h-3.5 text-red-500" /> Salvar Obs.
                          </button>
                        </div>
                      </div>

                    </div>
                  )}

                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}