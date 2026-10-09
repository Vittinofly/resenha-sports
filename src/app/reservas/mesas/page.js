'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/header';
import { Utensils, Calendar, Clock, User, Phone, Users, CheckCircle2, ShoppingBag, Plus, Minus } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function ReservaMesasPage() {
  const [enviando, setEnviando] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [cardapio, setCardapio] = useState([]);
  const [itensSelecionados, setItensSelecionados] = useState({});
  const [hoje, setHoje] = useState('');

  // Define a data atual apenas no lado do cliente
  useEffect(() => {
    setHoje(new Date().toISOString().split('T')[0]);
  }, []);

  const [formReserva, setFormReserva] = useState({
    cliente_nome: '',
    cliente_whatsapp: '',
    data_reserva: '',
    horario_inicio: '',
    horario_fim: '',
    num_pessoas: '2',
  });

  // Carregar itens do cardápio para pré-pedido
  useEffect(() => {
    async function carregarCardapio() {
      const { data } = await supabase.from('cardapio').select('*').eq('disponivel', true);
      if (data) setCardapio(data);
    }
    carregarCardapio();
  }, []);

  const handleQtdChange = (id, delta) => {
    setItensSelecionados((prev) => {
      const atual = prev[id] || 0;
      const novo = Math.max(0, atual + delta);
      if (novo === 0) {
        const copia = { ...prev };
        delete copia[id];
        return copia;
      }
      return { ...prev, [id]: novo };
    });
  };

  const handleNomeChange = (e) => {
    const val = e.target.value.replace(/[^a-zA-ZÀ-ÿ\s]/g, '');
    setFormReserva((prev) => ({ ...prev, cliente_nome: val }));
  };

  const handlePhoneChange = (e) => {
    const val = e.target.value.replace(/\D/g, '');
    setFormReserva((prev) => ({ ...prev, cliente_whatsapp: val }));
  };

  const resumoItens = Object.entries(itensSelecionados)
    .map(([id, qtd]) => {
      const prod = cardapio.find((p) => p.id === parseInt(id));
      return prod ? `${qtd}x ${prod.nome}` : null;
    })
    .filter(Boolean)
    .join(', ');

  const totalConsumo = Object.entries(itensSelecionados).reduce((acc, [id, qtd]) => {
    const prod = cardapio.find((p) => p.id === parseInt(id));
    return acc + (prod ? prod.preco * qtd : 0);
  }, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const agora = new Date();
    const dataHoraReserva = new Date(`${formReserva.data_reserva}T${formReserva.horario_inicio || '00:00'}`);
    if (dataHoraReserva < agora) {
      alert('Não é possível realizar agendamentos para datas ou horários passados.');
      return;
    }

    setEnviando(true);

    const stringDetalhada = `Reserva para ${formReserva.num_pessoas} Pessoas | Mesa Restaurante | Pedido: [${resumoItens || 'Nenhum'}]`;

    const { error } = await supabase.from('reservas_mesas').insert([
      {
        cliente_nome: formReserva.cliente_nome.trim(),
        cliente_whatsapp: formReserva.cliente_whatsapp.trim(),
        data_reserva: formReserva.data_reserva,
        horario_inicio: formReserva.horario_inicio,
        horario_fim: formReserva.horario_fim,
        num_pessoas: parseInt(formReserva.num_pessoas),
        tipo_evento: stringDetalhada,
        status: 'pendente',
      },
    ]);

    setEnviando(false);

    if (error) {
      alert('Erro ao solicitar reserva de mesa: ' + error.message);
    } else {
      setSucesso(true);
      setItensSelecionados({});
      setFormReserva({
        cliente_nome: '',
        cliente_whatsapp: '',
        data_reserva: '',
        horario_inicio: '',
        horario_fim: '',
        num_pessoas: '2',
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-12">
      <Header subtitulo="Reserva de Mesas no Restaurante" />

      <main className="max-w-5xl mx-auto px-4 space-y-8">
        
        {/* TOPO / BANNER */}
        <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-md border-b-4 border-red-600">
          <span className="text-xs font-black text-red-500 tracking-wider uppercase bg-red-950/80 border border-red-800/50 px-3 py-1 rounded-full inline-flex items-center gap-1.5">
            <Utensils className="w-3.5 h-3.5" /> Gastrobar & Restaurante
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold mt-2">
            Reserva de Mesa & Pré-Pedido
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Garanta o seu lugar no restaurante e monte a sua lista de bebidas e porções.
          </p>
        </div>

        {/* CARD DO FORMULÁRIO */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm">
          {sucesso ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
              <h3 className="text-lg font-bold text-emerald-900">Mesa Solicitada com Sucesso!</h3>
              <p className="text-xs text-emerald-700 max-w-md mx-auto">
                Registámos a sua reserva e o seu pré-pedido. Aguarde a confirmação da equipa via WhatsApp.
              </p>
              <button
                onClick={() => setSucesso(false)}
                className="mt-2 bg-emerald-600 text-white font-bold px-5 py-2 rounded-xl text-xs hover:bg-emerald-700 transition"
              >
                Reservar Outra Mesa
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-8">
              
              {/* DADOS DA RESERVA DA MESA */}
              <div className="space-y-4">
                <h2 className="text-base font-black text-slate-900 border-b border-slate-100 pb-2">
                  1. Detalhes da Reserva
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
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-600"
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
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Número de Pessoas *</label>
                    <div className="relative">
                      <Users className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                      <input
                        type="number"
                        min="1"
                        max="30"
                        required
                        value={formReserva.num_pessoas}
                        onChange={(e) => setFormReserva({ ...formReserva, num_pessoas: e.target.value })}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Data *</label>
                    <div className="relative">
                      <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                      <input
                        type="date"
                        required
                        min={hoje}
                        value={formReserva.data_reserva}
                        onChange={(e) => setFormReserva({ ...formReserva, data_reserva: e.target.value })}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Horário de Chegada *</label>
                    <div className="relative">
                      <Clock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                      <input
                        type="time"
                        required
                        value={formReserva.horario_inicio}
                        onChange={(e) => setFormReserva({ ...formReserva, horario_inicio: e.target.value })}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Horário Estimado de Saída *</label>
                    <div className="relative">
                      <Clock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                      <input
                        type="time"
                        required
                        value={formReserva.horario_fim}
                        onChange={(e) => setFormReserva({ ...formReserva, horario_fim: e.target.value })}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-600"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* SELEÇÃO DE PRÉ-PEDIDO DO CARDÁPIO */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <div className="flex justify-between items-center">
                  <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-red-600" /> 2. Pré-Pedido do Cardápio (Opcional)
                  </h2>
                  {totalConsumo > 0 && (
                    <span className="text-xs font-black text-red-600 bg-red-50 px-3 py-1 rounded-full border border-red-100">
                      Total Estimado: R$ {totalConsumo.toFixed(2).replace('.', ',')}
                    </span>
                  )}
                </div>

                <div className="grid sm:grid-cols-2 gap-3 max-h-80 overflow-y-auto p-1">
                  {cardapio.map((prod) => {
                    const qtd = itensSelecionados[prod.id] || 0;
                    return (
                      <div key={prod.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
                        <div>
                          <p className="font-extrabold text-slate-900">{prod.nome}</p>
                          <p className="text-red-600 font-bold">R$ {Number(prod.preco).toFixed(2).replace('.', ',')}</p>
                        </div>
                        <div className="flex items-center gap-2 bg-white px-2 py-1 rounded-xl border border-slate-200">
                          <button type="button" onClick={() => handleQtdChange(prod.id, -1)} className="p-1 hover:bg-slate-100 rounded">
                            <Minus className="w-3 h-3 text-slate-600" />
                          </button>
                          <span className="font-black text-slate-900 w-4 text-center">{qtd}</span>
                          <button type="button" onClick={() => handleQtdChange(prod.id, 1)} className="p-1 hover:bg-slate-100 rounded">
                            <Plus className="w-3 h-3 text-red-600" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* BOTÃO DE CONFIRMAÇÃO */}
              <div className="flex justify-end pt-4 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={enviando}
                  className="w-full sm:w-auto bg-red-600 text-white font-bold px-8 py-3 rounded-xl text-sm hover:bg-red-700 shadow-md transition disabled:opacity-50"
                >
                  {enviando ? 'Enviando solicitação...' : 'Confirmar Reserva de Mesa'}
                </button>
              </div>

            </form>
          )}
        </div>

      </main>
    </div>
  );
}