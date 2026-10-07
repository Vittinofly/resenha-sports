'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Calendar, Clock, CheckCircle2, ShieldAlert } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const HORARIOS_DISPONIVEIS = [
  '17:00 - 18:00',
  '18:00 - 19:00',
  '19:00 - 20:00',
  '20:00 - 21:00',
  '21:00 - 22:00',
  '22:00 - 23:00'
];

export default function EsportesPage() {
  const [tipoQuadra, setTipoQuadra] = useState('futebol');
  const [dataSelecionada, setDataSelecionada] = useState('');
  const [horarioSelecionado, setHorarioSelecionado] = useState('');
  const [nomeCliente, setNomeCliente] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [reservaConfirmada, setReservaConfirmada] = useState(false);

    const handleReserva = async (e) => {
    e.preventDefault();
    if (!dataSelecionada || !horarioSelecionado || !nomeCliente || !whatsapp) {
        alert('Por favor, preencha todos os campos para continuar.');
        return;
  }

  // Separa o horário de início e fim (ex: "18:00 - 19:00")
  const [inicio, fim] = horarioSelecionado.split(' - ');

  const { data, error } = await supabase
    .from('reservas_quadras')
    .insert([
      {
        cliente_nome: nomeCliente,
        cliente_whatsapp: whatsapp,
        data_reserva: dataSelecionada,
        horario_inicio: inicio,
        horario_fim: fim,
        status: 'pendente_sinal'
      }
    ]);

  if (error) {
    alert('Erro ao realizar reserva: ' + error.message);
    return;
  }

  setReservaConfirmada(true);
};

  return (
    <main className="min-h-screen bg-stone-50 text-stone-800 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-stone-600 hover:text-stone-900 mb-6 bg-white px-3 py-1.5 rounded-full border border-stone-200"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Voltar ao Portal
        </Link>

        <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-10 shadow-sm">
          <div className="border-b border-stone-100 pb-6 mb-6">
            <span className="text-xs font-bold text-emerald-800 tracking-wider uppercase bg-emerald-50 px-3 py-1 rounded-full">
              Reserva de Quadras
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 mt-3">
              Agende o seu horário no Resenha
            </h1>
            <p className="text-sm text-stone-600 mt-1">
              Selecione o tipo de modalidade, data e horário desejado (sessões de 1 hora).
            </p>
          </div>

          {!reservaConfirmada ? (
            <form onSubmit={handleReserva} className="space-y-6">
              {/* Seleção do Tipo de Quadra */}
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
                  1. Modalidade
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setTipoQuadra('futebol')}
                    className={`py-3 px-4 rounded-xl text-sm font-semibold border transition-all ${
                      tipoQuadra === 'futebol'
                        ? 'bg-emerald-950 text-amber-400 border-emerald-950 shadow-sm'
                        : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    Futebol Society
                  </button>
                  <button
                    type="button"
                    onClick={() => setTipoQuadra('areia')}
                    className={`py-3 px-4 rounded-xl text-sm font-semibold border transition-all ${
                      tipoQuadra === 'areia'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                        : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    Quadra de Areia
                  </button>
                </div>
              </div>

              {/* Data da Reserva */}
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
                  2. Data do jogo
                </label>
                <input
                  type="date"
                  value={dataSelecionada}
                  onChange={(e) => setDataSelecionada(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-800"
                />
              </div>

              {/* Escolha do Horário */}
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
                  3. Horário disponível (1 hora)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {HORARIOS_DISPONIVEIS.map((horario) => (
                    <button
                      key={horario}
                      type="button"
                      onClick={() => setHorarioSelecionado(horario)}
                      className={`py-2.5 px-3 rounded-xl text-xs font-semibold border text-center transition-all ${
                        horarioSelecionado === horario
                          ? 'bg-emerald-800 text-white border-emerald-800 shadow-sm'
                          : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                      }`}
                    >
                      {horario}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dados de Contato */}
              <div className="grid sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
                    Seu Nome
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: João Silva"
                    value={nomeCliente}
                    onChange={(e) => setNomeCliente(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
                    WhatsApp para confirmação
                  </label>
                  <input
                    type="tel"
                    placeholder="(64) 99999-9999"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-800"
                  />
                </div>
              </div>

              {/* Aviso de Sinal */}
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 text-xs text-amber-900">
                <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <p>
                  <strong>Aviso sobre o sinal de reserva:</strong> Para garantir o agendamento da quadra, é necessária a confirmação de um sinal prévio no valor de R$ 30,00 via Pix.
                </p>
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-950 text-amber-400 font-bold py-4 rounded-xl shadow-md hover:bg-emerald-900 transition-all text-sm"
              >
                Solicitar Agendamento
              </button>
            </form>
          ) : (
            /* Tela de Sucesso */
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-stone-900">
                Pré-reserva solicitada com sucesso!
              </h2>
              <p className="text-sm text-stone-600 max-w-md mx-auto">
                Olá, <strong>{nomeCliente}</strong>. O seu horário para a modalidade{' '}
                <strong>{tipoQuadra === 'futebol' ? 'Futebol Society' : 'Quadra de Areia'}</strong> em{' '}
                <strong>{dataSelecionada}</strong> às <strong>{horarioSelecionado}</strong> foi pré-agendado.
              </p>
              <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 max-w-md mx-auto text-xs text-stone-700">
                Acesse o WhatsApp da equipe do Resenha para enviar o comprovante do sinal de R$ 30,00 e confirmar a reserva.
              </div>
              <a
                href={`https://wa.me/5564996956530?text=Olá,%20gostaria%20de%20confirmar%20minha%20reserva%20para%20${dataSelecionada}%20às%20${horarioSelecionado}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-emerald-800 text-white font-bold px-6 py-3 rounded-xl shadow-sm hover:bg-emerald-900 transition-all text-sm"
              >
                Enviar Comprovante via WhatsApp
              </a>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}