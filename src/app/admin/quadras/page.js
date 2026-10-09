'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Calendar,
  Clock,
  User,
  Phone,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Plus,
  MessageSquare,
  Info,
  X,
  Check,
  Dumbbell,
  FileText
} from 'lucide-react';

const QUADRAS = [
  'Quadra 1 - Beach Tennis / Futevôlei',
  'Quadra 2 - Beach Tennis / Futevôlei',
  'Quadra 3 - Padel',
];

const HORARIOS_DIA = Array.from({ length: 16 }, (_, i) => {
  const hora = i + 7;
  return `${hora < 10 ? '0' : ''}${hora}:00`;
});

export default function AdminQuadrasUnificadoPage() {
  const hojeStr = new Date().toISOString().split('T')[0];

  const [dataSelecionada, setDataSelecionada] = useState(hojeStr);
  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modais
  const [modalNovoOpen, setModalNovoOpen] = useState(false);
  const [modalDetalhesOpen, setModalDetalhesOpen] = useState(false);
  const [reservaSelecionada, setReservaSelecionada] = useState(null);

  // Formulário de Novo Agendamento Balcão/Telefone
  const [formNovo, setFormNovo] = useState({
    cliente_nome: '',
    cliente_whatsapp: '',
    quadra_nome: QUADRAS[0],
    data_reserva: hojeStr,
    horario_inicio: '08:00',
    duracao_horas: 1,
    observacoes: '',
  });

  const [observacaoEdicao, setObservacaoEdicao] = useState('');
  const [salvando, setSalvando] = useState(false);

  // Carregar reservas da data selecionada
  const carregarReservas = useCallback(async () => {
    if (!dataSelecionada) return;
    setLoading(true);

    const { data, error } = await supabase
      .from('reservas_quadras')
      .select('*')
      .eq('data_reserva', dataSelecionada)
      .neq('status', 'cancelado')
      .order('horario_inicio', { ascending: true });

    if (!error && data) {
      setReservas(data);
    }
    setLoading(false);
  }, [dataSelecionada]);

  useEffect(() => {
    if (!dataSelecionada) return;

    const timer = setTimeout(() => {
      void carregarReservas();
    }, 0);

    return () => clearTimeout(timer);
  }, [dataSelecionada, carregarReservas]);

  // Atalhos de Data Rápida
  const setDataHoje = () => {
    const hojeStr = new Date().toISOString().split('T')[0];
    setDataSelecionada(hojeStr);
  };

  const setDataAmanha = () => {
    const amanha = new Date();
    amanha.setDate(amanha.getDate() + 1);
    setDataSelecionada(amanha.toISOString().split('T')[0]);
  };

  // Verifica qual reserva ocupa uma determinada hora na quadra
  const getReservaNoSlot = (quadraNome, horaSlot) => {
    const horaFimSlot = `${parseInt(horaSlot.split(':')[0]) + 1}:00`.padStart(5, '0');
    return reservas.find(
      (r) =>
        r.quadra_nome === quadraNome &&
        horaSlot < r.horario_fim &&
        horaFimSlot > r.horario_inicio
    );
  };

  // Abrir Modal de Novo Agendamento ao Clicar em Horário Livre
  const handleAbrirNovoSlot = (quadraNome, horaSlot) => {
    setFormNovo({
      cliente_nome: '',
      cliente_whatsapp: '',
      quadra_nome: quadraNome,
      data_reserva: dataSelecionada,
      horario_inicio: horaSlot,
      duracao_horas: 1,
      observacoes: '',
    });
    setModalNovoOpen(true);
  };

  // Criar Agendamento Interno (Balcão/Telefone)
  const handleCriarReservaBalcao = async (e) => {
    e.preventDefault();
    setSalvando(true);

    const hInic = parseInt(formNovo.horario_inicio.split(':')[0]);
    const hFim = hInic + parseInt(formNovo.duracao_horas);

    if (hFim > 23) {
      alert('O horário de término não pode ultrapassar as 23:00.');
      setSalvando(false);
      return;
    }

    const horarioFimStr = `${hFim < 10 ? '0' : ''}${hFim}:00`;

    // Checagem Anti-Overbooking
    const { data: existentes } = await supabase
      .from('reservas_quadras')
      .select('*')
      .eq('quadra_nome', formNovo.quadra_nome)
      .eq('data_reserva', formNovo.data_reserva)
      .neq('status', 'cancelado');

    const temConflito = existentes?.some(
      (r) => formNovo.horario_inicio < r.horario_fim && horarioFimStr > r.horario_inicio
    );

    if (temConflito) {
      alert('Aviso: Já existe um agendamento ocupando esse intervalo de horário!');
      setSalvando(false);
      return;
    }

    const { error } = await supabase.from('reservas_quadras').insert([
      {
        cliente_nome: formNovo.cliente_nome.trim(),
        cliente_whatsapp: formNovo.cliente_whatsapp.trim(),
        quadra_nome: formNovo.quadra_nome,
        data_reserva: formNovo.data_reserva,
        horario_inicio: formNovo.horario_inicio,
        horario_fim: horarioFimStr,
        observacoes: formNovo.observacoes.trim(),
        status: 'confirmado',
      },
    ]);

    setSalvando(false);

    if (error) {
      alert('Erro ao agendar: ' + error.message);
    } else {
      setModalNovoOpen(false);
      carregarReservas();
    }
  };

  // Abrir Modal de Detalhes da Reserva Existente
  const handleAbrirDetalhes = (reserva) => {
    setReservaSelecionada(reserva);
    setObservacaoEdicao(reserva.observacoes || '');
    setModalDetalhesOpen(true);
  };

  // Alternar Status (Pendente <-> Confirmado)
  const handleAtualizarStatus = async (novoStatus) => {
    if (!reservaSelecionada) return;
    setSalvando(true);

    const { error } = await supabase
      .from('reservas_quadras')
      .update({ status: novoStatus })
      .eq('id', reservaSelecionada.id);

    setSalvando(false);

    if (error) {
      alert('Erro ao atualizar status: ' + error.message);
    } else {
      setReservaSelecionada((prev) => ({ ...prev, status: novoStatus }));
      carregarReservas();
    }
  };

  // Salvar Observações Internas
  const handleSalvarObservacao = async () => {
    if (!reservaSelecionada) return;
    setSalvando(true);

    const { error } = await supabase
      .from('reservas_quadras')
      .update({ observacoes: observacaoEdicao.trim() })
      .eq('id', reservaSelecionada.id);

    setSalvando(false);

    if (error) {
      alert('Erro ao salvar observação: ' + error.message);
    } else {
      alert('Observação salva com sucesso!');
      setReservaSelecionada((prev) => ({ ...prev, observacoes: observacaoEdicao.trim() }));
      carregarReservas();
    }
  };

  // Cancelar Reserva
  const handleCancelarReserva = async () => {
    if (!reservaSelecionada) return;
    if (!confirm('Tem certeza que deseja cancelar esta reserva? O horário será liberado na grade.')) return;

    setSalvando(true);
    const { error } = await supabase
      .from('reservas_quadras')
      .update({ status: 'cancelado' })
      .eq('id', reservaSelecionada.id);

    setSalvando(false);

    if (error) {
      alert('Erro ao cancelar: ' + error.message);
    } else {
      setModalDetalhesOpen(false);
      carregarReservas();
    }
  };

  // Métricas do Dia
  const totalConfirmadas = reservas.filter((r) => r.status === 'confirmado').length;
  const totalPendentes = reservas.filter((r) => r.status === 'pendente').length;

  return (
    <div className="space-y-6 font-sans text-slate-900 pb-12">
      
      {/* BARRA SUPERIOR DE CONTROLE E DATAS */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black flex items-center gap-2 text-slate-900">
            <Dumbbell className="w-6 h-6 text-red-600" /> Painel de Quadras & Agenda
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Gerencie horários, confirme agendamentos e faça lançamentos de balcão.
          </p>
        </div>

        {/* SELETOR DE DATA E BOTÃO DE NOVO AGENDAMENTO BALCÃO */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200">
            <button
              onClick={setDataHoje}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                dataSelecionada === new Date().toISOString().split('T')[0]
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              Hoje
            </button>
            <button
              onClick={setDataAmanha}
              className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition"
            >
              Amanhã
            </button>
            <input
              type="date"
              value={dataSelecionada}
              onChange={(e) => setDataSelecionada(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-2.5 py-1 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-600"
            />
          </div>

          <button
            onClick={() => setModalNovoOpen(true)}
            className="bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition"
          >
            <Plus className="w-4 h-4" /> Novo Agendamento
          </button>
        </div>
      </div>

      {/* CARDS DE MÉTRICAS RÁPIDAS DO DIA */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-extrabold uppercase text-slate-400">Confirmados Hoje</p>
            <p className="text-lg font-black text-slate-900">{totalConfirmadas}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl border border-amber-100">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-extrabold uppercase text-slate-400">Aguardando Confirmação</p>
            <p className="text-lg font-black text-amber-600">{totalPendentes}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3 col-span-2 sm:col-span-1">
          <div className="p-2.5 bg-slate-100 text-slate-600 rounded-xl border border-slate-200">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-extrabold uppercase text-slate-400">Data em Exibição</p>
            <p className="text-xs font-black text-slate-900">{dataSelecionada}</p>
          </div>
        </div>
      </div>

      {/* GRADE VISUAL DAS QUADRAS LADO A LADO */}
      <div className="bg-white p-4 sm:p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <h2 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Calendar className="w-4 h-4 text-red-600" /> Grade de Horários por Quadra
          </h2>
          <div className="flex items-center gap-3 text-[11px] font-bold">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-white border border-slate-300"></span> Livre</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Pendente</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Confirmado</span>
          </div>
        </div>

        {loading ? (
          <p className="text-xs text-slate-400 text-center py-12">Carregando horários das quadras...</p>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            {QUADRAS.map((quadraNome) => (
              <div key={quadraNome} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="bg-slate-900 text-white p-3 rounded-xl flex justify-between items-center">
                  <span className="font-extrabold text-xs">{quadraNome}</span>
                </div>

                <div className="space-y-1.5 max-h-[500px] overflow-y-auto pr-1">
                  {HORARIOS_DIA.map((hora) => {
                    const reserva = getReservaNoSlot(quadraNome, hora);

                    if (reserva) {
                      const eInicio = reserva.horario_inicio === hora;
                      const eConfirmado = reserva.status === 'confirmado';

                      return (
                        <div
                          key={hora}
                          onClick={() => handleAbrirDetalhes(reserva)}
                          className={`p-2.5 rounded-xl border text-xs cursor-pointer transition flex items-center justify-between ${
                            eConfirmado
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-950 hover:bg-emerald-100'
                              : 'bg-amber-50 border-amber-200 text-amber-950 hover:bg-amber-100'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-black text-[11px] w-10 shrink-0">{hora}</span>
                            <div className="truncate">
                              <p className="font-extrabold text-xs truncate">{reserva.cliente_nome}</p>
                              <p className="text-[10px] opacity-80">
                                {reserva.horario_inicio} - {reserva.horario_fim} {eInicio ? '' : '(Em andamento)'}
                              </p>
                            </div>
                          </div>

                          <span
                            className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                              eConfirmado ? 'bg-emerald-200 text-emerald-900' : 'bg-amber-200 text-amber-900'
                            }`}
                          >
                            {reserva.status}
                          </span>
                        </div>
                      );
                    }

                    // Slot Livre
                    return (
                      <button
                        key={hora}
                        type="button"
                        onClick={() => handleAbrirNovoSlot(quadraNome, hora)}
                        className="w-full p-2 bg-white hover:bg-emerald-50 text-slate-600 hover:text-emerald-800 border border-slate-200 hover:border-emerald-300 rounded-xl text-xs font-bold transition flex items-center justify-between"
                      >
                        <span className="font-extrabold w-10 text-left text-slate-800">{hora}</span>
                        <span className="text-[10px] font-semibold text-slate-400 hover:text-emerald-700 flex items-center gap-1">
                          <Plus className="w-3 h-3" /> Reservar
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* LISTA DE SOLICITAÇÕES PENDENTES DO DIA */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-600" /> Solicitações Pendentes de Confirmação ({totalPendentes})
        </h2>

        {reservas.filter((r) => r.status === 'pendente').length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">Nenhuma solicitação pendente para esta data.</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {reservas
              .filter((r) => r.status === 'pendente')
              .map((r) => (
                <div key={r.id} className="p-4 bg-amber-50/60 border border-amber-200 rounded-2xl space-y-3 text-xs">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-extrabold text-slate-900">{r.cliente_nome}</p>
                      <p className="text-[11px] text-slate-600 font-semibold">{r.quadra_nome}</p>
                    </div>
                    <span className="bg-amber-200 text-amber-900 font-black text-[10px] px-2 py-0.5 rounded-md uppercase">
                      Pendente
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-slate-700 font-bold bg-white/80 px-2.5 py-1.5 rounded-xl border border-amber-200/50">
                    <Clock className="w-3.5 h-3.5 text-amber-600" /> {r.horario_inicio} às {r.horario_fim}
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-amber-200/40">
                    <a
                      href={`https://wa.me/55${r.cliente_whatsapp}?text=${encodeURIComponent(
                        `Olá ${r.cliente_nome}! Sobre a sua solicitação de reserva na ${r.quadra_nome} para o dia${r.data_reserva} das ${r.horario_inicio} às ${r.horario_fim}...`
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-emerald-700 hover:underline font-extrabold flex items-center gap-1"
                    >
                      <Phone className="w-3.5 h-3.5" /> WhatsApp
                    </a>

                    <button
                      onClick={() => handleAbrirDetalhes(r)}
                      className="bg-slate-900 text-white font-bold px-3 py-1 rounded-xl text-[11px] hover:bg-slate-800 transition"
                    >
                      Gerenciar
                    </button>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* MODAL: NOVO AGENDAMENTO BALCÃO / TELEFONE */}
      {modalNovoOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-5">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                <Plus className="w-5 h-5 text-red-600" /> Agendar Horário (Balcão/Telefone)
              </h3>
              <button onClick={() => setModalNovoOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCriarReservaBalcao} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Nome do Cliente *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: João da Silva"
                  value={formNovo.cliente_nome}
                  onChange={(e) => setFormNovo({ ...formNovo, cliente_nome: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">WhatsApp / Telefone *</label>
                <input
                  type="tel"
                  required
                  placeholder="Apenas números"
                  value={formNovo.cliente_whatsapp}
                  onChange={(e) => setFormNovo({ ...formNovo, cliente_whatsapp: e.target.value.replace(/\D/g, '') })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Quadra</label>
                  <select
                    value={formNovo.quadra_nome}
                    onChange={(e) => setFormNovo({ ...formNovo, quadra_nome: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-600"
                  >
                    {QUADRAS.map((q) => (
                      <option key={q} value={q}>
                        {q}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Data</label>
                  <input
                    type="date"
                    value={formNovo.data_reserva}
                    onChange={(e) => setFormNovo({ ...formNovo, data_reserva: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Início</label>
                  <select
                    value={formNovo.horario_inicio}
                    onChange={(e) => setFormNovo({ ...formNovo, horario_inicio: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-600"
                  >
                    {HORARIOS_DIA.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Duração</label>
                  <select
                    value={formNovo.duracao_horas}
                    onChange={(e) => setFormNovo({ ...formNovo, duracao_horas: parseInt(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-600"
                  >
                    <option value={1}>1 Hora</option>
                    <option value={2}>2 Horas</option>
                    <option value={3}>3 Horas</option>
                    <option value={4}>4 Horas</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Observação Interna (Opcional)</label>
                <textarea
                  rows={2}
                  placeholder="Ex: Pago no balcão via Pix"
                  value={formNovo.observacoes}
                  onChange={(e) => setFormNovo({ ...formNovo, observacoes: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-600"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalNovoOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 font-bold hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando}
                  className="bg-slate-900 text-white font-bold px-5 py-2 rounded-xl hover:bg-slate-800 disabled:opacity-50"
                >
                  {salvando ? 'Salvando...' : 'Confirmar Agendamento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DETALHES E GERENCIAMENTO DE RESERVA EXISTENTE */}
      {modalDetalhesOpen && reservaSelecionada && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-5">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-black text-slate-900 text-base">Detalhes da Reserva</h3>
              <button onClick={() => setModalDetalhesOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1">
                <p className="font-black text-sm text-slate-900">{reservaSelecionada.cliente_nome}</p>
                <p className="text-slate-600 font-semibold">{reservaSelecionada.quadra_nome}</p>
                <p className="text-red-600 font-extrabold flex items-center gap-1 mt-1">
                  <Clock className="w-3.5 h-3.5" /> {reservaSelecionada.data_reserva} | {reservaSelecionada.horario_inicio} às {reservaSelecionada.horario_fim}
                </p>
              </div>

              {/* CONTROLE DE STATUS */}
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1.5">Status da Reserva</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleAtualizarStatus('confirmado')}
                    className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition ${
                      reservaSelecionada.status === 'confirmado'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Confirmado
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAtualizarStatus('pendente')}
                    className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition ${
                      reservaSelecionada.status === 'pendente'
                        ? 'bg-amber-500 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" /> Pendente
                  </button>
                </div>
              </div>

              {/* BOTAO WHATSAPP */}
              <a
                href={`https://wa.me/55${reservaSelecionada.cliente_whatsapp}?text=${encodeURIComponent(
                  `Olá ${reservaSelecionada.cliente_nome}! A sua reserva na ${reservaSelecionada.quadra_nome} para o dia ${reservaSelecionada.data_reserva} (${reservaSelecionada.horario_inicio} às ${reservaSelecionada.horario_fim}) foi${reservaSelecionada.status === 'confirmado' ? 'CONFIRMADA' : 'atualizada'}. Te aguardamos!`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-sm transition"
              >
                <MessageSquare className="w-4 h-4" /> Falar com Cliente no WhatsApp
              </a>

              {/* OBSERVAÇÕES INTERNAS */}
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1 flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-slate-400" /> Observações Internas (Recepção)
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: Sinal pago via Pix, observação da quadra..."
                  value={observacaoEdicao}
                  onChange={(e) => setObservacaoEdicao(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-600"
                />
                <button
                  type="button"
                  onClick={handleSalvarObservacao}
                  disabled={salvando}
                  className="mt-1 text-[11px] font-bold text-slate-900 hover:underline flex items-center gap-1"
                >
                  <Check className="w-3 h-3 text-emerald-600" />
                  Salvar observação
                </button>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setModalDetalhesOpen(false)}
                    className="px-4 py-2 rounded-xl text-slate-600 font-bold hover:bg-slate-100"
                  >
                    Fechar
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelarReserva}
                    disabled={salvando}
                    className="bg-red-600 text-white font-bold px-4 py-2 rounded-xl hover:bg-red-700 disabled:opacity-50"
                  >
                    Cancelar Reserva
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}