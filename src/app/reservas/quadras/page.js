'use client';

import { useState } from 'react';
import Header from '@/components/header';
import { Dumbbell, Calendar, Clock, User, Phone, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const QUADRAS_DISPONIVEIS = [
  { id: 'q1', nome: 'Quadra 1 - Beach Tennis / Futevôlei', tipo: 'Areia' },
  { id: 'q2', nome: 'Quadra 2 - Beach Tennis / Futevôlei', tipo: 'Areia' },
  { id: 'q3', nome: 'Quadra 3 - Padel', tipo: 'Sintético / Vidro' },
];

export default function ReservaQuadrasPage() {
  const [enviando, setEnviando] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  
  const hoje = new Date().toISOString().split('T')[0];

  const [formReserva, setFormReserva] = useState({
    cliente_nome: '',
    cliente_whatsapp: '',
    quadra_nome: QUADRAS_DISPONIVEIS[0].nome,
    data_reserva: '',
    horario_inicio: '',
    horario_fim: '',
  });

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

    const agora = new Date();
    const dataHoraReserva = new Date(`${formReserva.data_reserva}T${formReserva.horario_inicio || '00:00'}`);
    if (dataHoraReserva < agora) {
      alert('Não é possível realizar agendamentos para datas ou horários passados.');
      return;
    }

    setEnviando(true);

    const { error } = await supabase.from('reservas_quadras').insert([
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

    if (error) {
      alert('Erro ao solicitar reserva: ' + error.message);
    } else {
      setSucesso(true);
      setFormReserva({
        cliente_nome: '',
        cliente_whatsapp: '',
        quadra_nome: QUADRAS_DISPONIVEIS[0].nome,
        data_reserva: '',
        horario_inicio: '',
        horario_fim: '',
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-12">
      <Header subtitulo="Quadras de Beach Tennis, Futevôlei & Padel" />

      <main className="max-w-5xl mx-auto px-4 space-y-8">
        
        {/* BANNER SUPERIOR */}
        <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-md border-b-4 border-red-600">
          <span className="text-xs font-black text-red-500 tracking-wider uppercase bg-red-950/80 border border-red-800/50 px-3 py-1 rounded-full inline-flex items-center gap-1.5">
            <Dumbbell className="w-3.5 h-3.5" /> Esportes & Lazer
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold mt-2">
            Reserva de Quadras
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Escolha o horário para a sua partida com os amigos.
          </p>
        </div>

        {/* FORMULÁRIO DE RESERVA */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm">
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
              <h2 className="text-base font-black text-slate-900 border-b border-slate-100 pb-3">
                Preencha os dados do agendamento
              </h2>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Seu Nome Completo *</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="text" required placeholder="Apenas letras" value={formReserva.cliente_nome}
                      onChange={handleNomeChange} className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">WhatsApp / Telefone *</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="tel" required placeholder="Apenas números" value={formReserva.cliente_whatsapp}
                      onChange={handlePhoneChange} className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-600"
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
                      type="date" required min={hoje} value={formReserva.data_reserva}
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
                      type="time" required value={formReserva.horario_inicio}
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
                      type="time" required value={formReserva.horario_fim}
                      onChange={(e) => setFormReserva({ ...formReserva, horario_fim: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-600"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit" disabled={enviando}
                  className="w-full sm:w-auto bg-slate-900 text-white font-bold px-8 py-3 rounded-xl text-sm hover:bg-slate-800 shadow-md transition disabled:opacity-50"
                >
                  {enviando ? 'Enviando solicitação...' : 'Confirmar Reserva da Quadra'}
                </button>
              </div>
            </form>
          )}
        </div>

      </main>
    </div>
  );
}