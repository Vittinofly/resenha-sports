'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/header';
import { Dumbbell, Calendar, Clock, User, Phone, CheckCircle2, AlertTriangle, Info, Timer } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const QUADRAS_DISPONIVEIS = [
  { id: 'q1', nome: 'Quadra 1 - Beach Tennis / Futevôlei', tipo: 'Areia' },
  { id: 'q2', nome: 'Quadra 2 - Beach Tennis / Futevôlei', tipo: 'Areia' },
  { id: 'q3', nome: 'Quadra 3 - Padel', tipo: 'Sintético / Vidro' },
];

// Grade de horários das 07:00 às 22:00 (Fechamento do complexo às 23:00)
const HORARIOS_DIA = Array.from({ length: 16 }, (_, i) => {
  const hora = i + 7;
  return `${hora < 10 ? '0' : ''}${hora}:00`;
});

const OPCOES_DURACAO = [
  { label: '1 Hora', valor: 1 },
  { label: '2 Horas', valor: 2 },
  { label: '3 Horas', valor: 3 },
  { label: '4 Horas', valor: 4 },
];

export default function ReservaQuadrasPage() {
  const [enviando, setEnviando] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [erroConflito, setErroConflito] = useState('');
  const [hoje, setHoje] = useState('');
  const [reservasDoDia, setReservasDoDia] = useState([]);
  const [duracaoHoras, setDuracaoHoras] = useState(1);

  const [formReserva, setFormReserva] = useState({
    cliente_nome: '',
    cliente_whatsapp: '',
    quadra_nome: QUADRAS_DISPONIVEIS[0].nome,
    data_reserva: '',
    horario_inicio: '',
    horario_fim: '',
  });

  useEffect(() => {
    const dataAtual = new Date().toISOString().split('T')[0];
    setHoje(dataAtual);
    setFormReserva((prev) => ({ ...prev, data_reserva: dataAtual }));
  }, []);

  // Busca reservas da quadra e data selecionadas
  useEffect(() => {
    async function carregarReservasQuadra() {
      if (!formReserva.data_reserva || !formReserva.quadra_nome) return;

      const { data } = await supabase
        .from('reservas_quadras')
        .select('horario_inicio, horario_fim, status')
        .eq('quadra_nome', formReserva.quadra_nome)
        .eq('data_reserva', formReserva.data_reserva)
        .neq('status', 'cancelado');

      setReservasDoDia(data || []);
    }
    carregarReservasQuadra();
  }, [formReserva.data_reserva, formReserva.quadra_nome]);

  // Verifica se uma hora específica de 1h está ocupada por alguma reserva
  const isHorarioOcupado = (horaSlot) => {
    const horaFimSlot = `${parseInt(horaSlot.split(':')[0]) + 1}:00`.padStart(5, '0');
    return reservasDoDia.some((r) => {
      return horaSlot < r.horario_fim && horaFimSlot > r.horario_inicio;
    });
  };

  // Verifica se um horário está dentro do intervalo selecionado
  const isHorarioSelecionado = (horaSlot) => {
    if (!formReserva.horario_inicio || !formReserva.horario_fim) return false;
    return horaSlot >= formReserva.horario_inicio && horaSlot < formReserva.horario_fim;
  };

  // Seleciona o horário na grade com limite máximo de fechamento às 23:00
  const selecionarHorarioGrid = (horaInicio) => {
    if (isHorarioOcupado(horaInicio)) return;

    const horaInicioNum = parseInt(horaInicio.split(':')[0]);
    const horaFimNum = horaInicioNum + duracaoHoras;

    // Trava de horário de fechamento (23:00)
    if (horaFimNum > 23) {
      const maxInicio = 23 - duracaoHoras;
      alert(`O complexo encerra as atividades às 23:00. Para jogar ${duracaoHoras}h, selecione o horário inicial até no máximo ${maxInicio < 10 ? '0' : ''}${maxInicio}:00.`);
      return;
    }

    const horaFimStr = `${horaFimNum < 10 ? '0' : ''}${horaFimNum}:00`;

    // Verifica conflito nos blocos do intervalo
    let conflitoNoIntervalo = false;
    for (let h = horaInicioNum; h < horaFimNum; h++) {
      const slotStr = `${h < 10 ? '0' : ''}${h}:00`;
      if (isHorarioOcupado(slotStr)) {
        conflitoNoIntervalo = true;
        break;
      }
    }

    if (conflitoNoIntervalo) {
      alert(`Não é possível reservar ${duracaoHoras}h seguidas a partir das ${horaInicio}, pois há um horário ocupado no meio do período.`);
      return;
    }

    setFormReserva((prev) => ({
      ...prev,
      horario_inicio: horaInicio,
      horario_fim: horaFimStr,
    }));
  };

  const handleNomeChange = (e) => {
    const val = e.target.value.replace(/[^a-zA-ZÀ-ÿ\s]/g, '');
    setFormReserva((prev) => ({ ...prev, cliente_nome: val }));
  };

  const handlePhoneChange = (e) => {
    const val = e.target.value.replace(/\D/g, '');
    setFormReserva((prev) => ({ ...prev, cliente_whatsapp: val }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErroConflito('');

    const agora = new Date();
    const dataHoraReserva = new Date(`${formReserva.data_reserva}T${formReserva.horario_inicio || '00:00'}`);
    if (dataHoraReserva < agora) {
      alert('Não é possível realizar agendamentos para datas ou horários passados.');
      return;
    }

    if (formReserva.horario_inicio >= formReserva.horario_fim) {
      alert('O horário de término deve ser posterior ao horário de início.');
      return;
    }

    setEnviando(true);

    // Validação estrita no Supabase
    const { data: reservasExistentes, error: errorCheck } = await supabase
      .from('reservas_quadras')
      .select('*')
      .eq('quadra_nome', formReserva.quadra_nome)
      .eq('data_reserva', formReserva.data_reserva)
      .neq('status', 'cancelado');

    if (errorCheck) {
      setEnviando(false);
      alert('Erro ao verificar disponibilidade: ' + errorCheck.message);
      return;
    }

    const temConflito = reservasExistentes.some((r) => {
      return formReserva.horario_inicio < r.horario_fim && formReserva.horario_fim > r.horario_inicio;
    });

    if (temConflito) {
      setEnviando(false);
      setErroConflito(`Conflito de horário! A quadra já possui uma reserva ocupando o período entre ${formReserva.horario_inicio} e ${formReserva.horario_fim}.`);
      return;
    }

    const { error: errorInsert } = await supabase.from('reservas_quadras').insert([
      {
        cliente_nome: formReserva.cliente_nome.trim(),
        cliente_whatsapp: formReserva.cliente_whatsapp.trim(),
        quadra_nome: formReserva.quadra_nome,
        data_reserva: formReserva.data_reserva,
        horario_inicio: formReserva.horario_inicio,
        horario_fim: formReserva.horario_fim,
        status: 'pendente',
      },
    ]);

    setEnviando(false);

    if (errorInsert) {
      alert('Erro ao solicitar reserva: ' + errorInsert.message);
    } else {
      setSucesso(true);
      setFormReserva((prev) => ({
        ...prev,
        cliente_nome: '',
        cliente_whatsapp: '',
        horario_inicio: '',
        horario_fim: '',
      }));
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-12">
      <Header subtitulo="Quadras de Beach Tennis, Futevôlei & Padel" />

      <main className="max-w-5xl mx-auto px-4 space-y-6 sm:space-y-8">
        
        {/* BANNER DE TOPO */}
        <div className="bg-slate-900 text-white rounded-3xl p-5 sm:p-8 shadow-md border-b-4 border-red-600">
          <span className="text-xs font-black text-red-500 tracking-wider uppercase bg-red-950/80 border border-red-800/50 px-3 py-1 rounded-full inline-flex items-center gap-1.5">
            <Dumbbell className="w-3.5 h-3.5" /> Esportes & Lazer
          </span>
          <h1 className="text-xl sm:text-3xl font-extrabold mt-2">Reserva de Quadras</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">Escolha a duração e selecione seu horário na grade em tempo real.</p>
        </div>

        {/* PAINEL DE DISPONIBILIDADE RESPONSIVO */}
        <div className="bg-white p-4 sm:p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          
          {/* TOPO DO PAINEL DE GRADE */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Calendar className="w-4 h-4 text-red-600" /> Grade de Horários ({formReserva.data_reserva || '...'})
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">Selecione o tempo de jogo e depois clique na hora inicial.</p>
            </div>

            {/* SELETOR DE DURAÇÃO */}
            <div className="flex items-center justify-between sm:justify-start gap-1 bg-slate-100 p-1.5 rounded-2xl w-full sm:w-auto overflow-x-auto">
              <span className="text-[11px] font-bold text-slate-600 px-2 flex items-center gap-1 shrink-0">
                <Timer className="w-3.5 h-3.5 text-red-600" /> Tempo:
              </span>
              <div className="flex gap-1 w-full sm:w-auto">
                {OPCOES_DURACAO.map((op) => (
                  <button
                    key={op.valor}
                    type="button"
                    onClick={() => {
                      setDuracaoHoras(op.valor);
                      if (formReserva.horario_inicio) {
                        const hInic = parseInt(formReserva.horario_inicio.split(':')[0]);
                        const hFim = hInic + op.valor;
                        if (hFim <= 23) {
                          setFormReserva((prev) => ({
                            ...prev,
                            horario_fim: `${hFim < 10 ? '0' : ''}${hFim}:00`,
                          }));
                        } else {
                          setFormReserva((prev) => ({
                            ...prev,
                            horario_inicio: '',
                            horario_fim: '',
                          }));
                        }
                      }
                    }}
                    className={`flex-1 sm:flex-none px-2.5 sm:px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-black transition whitespace-nowrap ${
                      duracaoHoras === op.valor
                        ? 'bg-red-600 text-white shadow-sm'
                        : 'text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {op.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* LEGENDA AJUSTADA (BOLINHA BRANCA PARA LIVRE) */}
          <div className="flex items-center justify-start sm:justify-end gap-3 text-[11px] sm:text-xs font-bold text-slate-700">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-white border border-slate-300 inline-block shadow-xs"></span> Livre
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-red-600 inline-block"></span> Selecionado
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-slate-300 inline-block"></span> Ocupado
            </span>
          </div>

          {/* GRADE DE BOTÕES (RESPONSIVA: 3 COLUNAS NO CELULAR, 4 EM TABLET, 8 EM DESKTOP) */}
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-8 gap-1.5 sm:gap-2">
            {HORARIOS_DIA.map((hora) => {
              const ocupado = isHorarioOcupado(hora);
              const selecionado = isHorarioSelecionado(hora);

              return (
                <button
                  type="button"
                  key={hora}
                  onClick={() => selecionarHorarioGrid(hora)}
                  disabled={ocupado}
                  className={`py-2 sm:py-2.5 px-1 text-center rounded-xl text-[11px] sm:text-xs font-extrabold transition border ${
                    ocupado
                      ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed line-through'
                      : selecionado
                      ? 'bg-red-600 text-white border-red-600 shadow-md ring-2 ring-red-400'
                      : 'bg-white text-slate-800 border-slate-200 hover:bg-red-50 hover:text-red-700 hover:border-red-300'
                  }`}
                >
                  {hora}
                  <span className="block text-[9px] font-normal mt-0.5 opacity-80">
                    {ocupado ? 'Ocupado' : selecionado ? 'Sua Escolha' : 'Livre'}
                  </span>
                </button>
              );
            })}
          </div>

          <p className="text-[11px] sm:text-xs text-slate-500 flex items-center gap-1 pt-1">
            <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            {formReserva.horario_inicio && formReserva.horario_fim ? (
              <span className="font-bold text-slate-800">
                Horário selecionado: das {formReserva.horario_inicio} às {formReserva.horario_fim} ({duracaoHoras}h de jogo).
              </span>
            ) : (
              <span>Escolha a duração acima e selecione o horário de início desejado.</span>
            )}
          </p>
        </div>

        {/* FORMULÁRIO DE DADOS */}
        <div className="bg-white p-5 sm:p-8 rounded-3xl border border-slate-200 shadow-sm">
          {erroConflito && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 text-red-800 text-xs font-bold">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-extrabold text-red-900">Horário Indisponível</p>
                <p className="mt-0.5">{erroConflito}</p>
              </div>
            </div>
          )}

          {sucesso ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
              <h3 className="text-lg font-bold text-emerald-900">Solicitação Enviada com Sucesso!</h3>
              <p className="text-xs text-emerald-700 max-w-md mx-auto">
                A sua reserva foi registrada. Nossa equipe entrará em contato via WhatsApp para confirmar o agendamento.
              </p>
              <button
                onClick={() => setSucesso(false)}
                className="mt-2 bg-slate-900 text-white font-bold px-5 py-2 rounded-xl text-xs hover:bg-slate-800 transition"
              >
                Fazer Outra Reserva
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <h2 className="text-sm sm:text-base font-black text-slate-900 border-b border-slate-100 pb-3">
                Preencha os dados para confirmar a solicitação
              </h2>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Seu Nome Completo *</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      required
                      placeholder="Apenas letras"
                      value={formReserva.cliente_nome}
                      onChange={handleNomeChange}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">WhatsApp / Telefone *</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="tel"
                      required
                      placeholder="Apenas números"
                      value={formReserva.cliente_whatsapp}
                      onChange={handlePhoneChange}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Quadra *</label>
                  <select
                    value={formReserva.quadra_nome}
                    onChange={(e) => setFormReserva({ ...formReserva, quadra_nome: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-600"
                  >
                    {QUADRAS_DISPONIVEIS.map((q) => (
                      <option key={q.id} value={q.nome}>
                        {q.nome} ({q.tipo})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Data da Reserva *</label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="date"
                      required
                      min={hoje}
                      value={formReserva.data_reserva}
                      onChange={(e) => setFormReserva({ ...formReserva, data_reserva: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Horário de Início *</label>
                  <div className="relative">
                    <Clock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="time"
                      required
                      value={formReserva.horario_inicio}
                      onChange={(e) => setFormReserva({ ...formReserva, horario_inicio: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Horário de Término *</label>
                  <div className="relative">
                    <Clock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="time"
                      required
                      value={formReserva.horario_fim}
                      onChange={(e) => setFormReserva({ ...formReserva, horario_fim: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-600"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={enviando}
                  className="w-full sm:w-auto bg-slate-900 text-white font-bold px-8 py-3 rounded-xl text-sm hover:bg-slate-800 shadow-md transition disabled:opacity-50"
                >
                  {enviando ? 'Verificando e salvando...' : 'Confirmar Reserva da Quadra'}
                </button>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}