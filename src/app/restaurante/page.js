'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Utensils, 
  Calendar, 
  Clock, 
  Users, 
  CheckCircle2, 
  Info, 
  Sparkles,
  Search
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

const CATEGORIAS = ['Todos', 'Espetinhos', 'Porções', 'Bebidas'];

const QUIOSQUES = [
  { id: 'q1', nome: 'Quiosque 01', capacidade: 'Até 30 pessoas', descricao: 'Próximo à área coberta principal' },
  { id: 'q2', nome: 'Quiosque 02', capacidade: 'Até 30 pessoas', descricao: 'Vista para a quadra de futebol' },
  { id: 'q3', nome: 'Quiosque 03', capacidade: 'Até 30 pessoas', descricao: 'Próximo à área das quadras de areia' },
  { id: 'q4', nome: 'Quiosque 04', capacidade: 'Até 30 pessoas', descricao: 'Ambiente reservado e familiar' },
  { id: 'q5', nome: 'Quiosque Master 05', capacidade: 'Até 50 pessoas', descricao: 'Espaço amplo para grandes celebrações' }
];

export default function RestaurantePage() {
  const [abaAtiva, setAbaAtiva] = useState('cardapio'); // 'cardapio', 'mesas', 'quiosques'
  const [categoriaAtiva, setCategoriaAtiva] = useState('Todos');
  const [busca, setBusca] = useState('');

  // Estados dos dados e formulários
  const [itensCardapio, setItensCardapio] = useState([]);
  const [carregandoCardapio, setCarregandoCardapio] = useState(true);

  const [formMesa, setFormMesa] = useState({ nome: '', whatsapp: '', data: '', horarioInicio: '', horarioFim: '', pessoas: '2' });
  const [formQuiosque, setFormQuiosque] = useState({ nome: '', whatsapp: '', data: '', quiosqueId: 'q1', evento: 'Aniversário', convidados: '20' });
  const [sucesso, setSucesso] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState('');

  // Obter itens da ementa a partir do Supabase
  useEffect(() => {
    async function buscarCardapio() {
      setCarregandoCardapio(true);
      const { data, error } = await supabase.from('cardapio').select('*').eq('disponivel', true);
      if (!error && data) {
        setItensCardapio(data);
      }
      setCarregandoCardapio(false);
    }
    buscarCardapio();
  }, []);

  // Filtro da Ementa
  const itensFiltrados = itensCardapio.filter(item => {
    const atendeCategoria = categoriaAtiva === 'Todos' || item.categoria === categoriaAtiva;
    const atendeBusca = item.nome.toLowerCase().includes(busca.toLowerCase()) || 
                        (item.descricao && item.descricao.toLowerCase().includes(busca.toLowerCase()));
    return atendeCategoria && atendeBusca;
  });

  const handleReservaMesa = async (e) => {
    e.preventDefault();
    if (!formMesa.nome || !formMesa.whatsapp || !formMesa.data || !formMesa.horarioInicio || !formMesa.horarioFim) {
      alert('Por favor, preencha todos os campos da reserva de mesa.');
      return;
    }

    const { error } = await supabase.from('reservas_mesas').insert([
      {
        cliente_nome: formMesa.nome,
        cliente_whatsapp: formMesa.whatsapp,
        data_reserva: formMesa.data,
        horario_inicio: formMesa.horarioInicio,
        horario_fim: formMesa.horarioFim,
        num_pessoas: parseInt(formMesa.pessoas),
        status: 'agendada'
      }
    ]);

    if (error) {
      alert('Erro ao agendar mesa: ' + error.message);
      return;
    }

    setMensagemSucesso(`Reserva de mesa para ${formMesa.nome} agendada com sucesso para ${formMesa.data} das ${formMesa.horarioInicio} às ${formMesa.horarioFim}!`);
    setSucesso(true);
  };

  const handleReservaQuiosque = async (e) => {
    e.preventDefault();
    if (!formQuiosque.nome || !formQuiosque.whatsapp || !formQuiosque.data) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    const qNome = QUIOSQUES.find(q => q.id === formQuiosque.quiosqueId)?.nome;

    const { error } = await supabase.from('reservas_quiosques').insert([
      {
        cliente_nome: formQuiosque.nome,
        cliente_whatsapp: formQuiosque.whatsapp,
        data_reserva: formQuiosque.data,
        tipo_evento: formQuiosque.evento,
        num_convidados: parseInt(formQuiosque.convidados),
        status: 'em_analise'
      }
    ]);

    if (error) {
      alert('Erro ao solicitar quiosque: ' + error.message);
      return;
    }

    setMensagemSucesso(`Solicitação do ${qNome} enviada com sucesso para ${formQuiosque.data}! A nossa equipa responderá em breve.`);
    setSucesso(true);
  };

  return (
    <main className="min-h-screen bg-stone-50 text-stone-800 py-8 px-4 font-sans">
      <div className="max-w-4xl mx-auto">
        {/* Botão de Voltar */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-stone-600 hover:text-stone-900 mb-6 bg-white px-3.5 py-2 rounded-full border border-stone-200 shadow-sm transition-all"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Voltar ao Portal
        </Link>

        {/* Cabeçalho do Módulo */}
        <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-sm mb-6">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-stone-100 pb-6">
            <div>
              <span className="text-xs font-bold text-amber-700 tracking-wider uppercase bg-amber-50 px-3 py-1 rounded-full">
                Gastronomia & Eventos
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 mt-2">
                Restaurante Resenha
              </h1>
              <p className="text-xs sm:text-sm text-stone-500 mt-1">
                Ementa digital, reservas de mesas e quiosques em São Luís de Montes Belos.
              </p>
            </div>
          </div>

          {/* Navegação de Separadores */}
          <div className="flex gap-2 mt-6 overflow-x-auto pb-1">
            <button
              onClick={() => { setAbaAtiva('cardapio'); setSucesso(false); }}
              className={`px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                abaAtiva === 'cardapio'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
               Ementa Digital
            </button>
            <button
              onClick={() => { setAbaAtiva('mesas'); setSucesso(false); }}
              className={`px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                abaAtiva === 'mesas'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
               Reservar Mesa
            </button>
            <button
              onClick={() => { setAbaAtiva('quiosques'); setSucesso(false); }}
              className={`px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                abaAtiva === 'quiosques'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
               Quiosques para Eventos
            </button>
          </div>
        </div>

        {/* ==================== SEPARADOR 1: EMENTA DIGITAL ==================== */}
        {abaAtiva === 'cardapio' && (
          <div className="space-y-6">
            <div className="bg-white p-4 rounded-2xl border border-stone-200 space-y-4">
              <div className="relative">
                <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  placeholder="Procurar prato, espetinho ou bebida..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-600"
                />
              </div>

              <div className="flex gap-2 overflow-x-auto pb-1">
                {CATEGORIAS.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setCategoriaAtiva(cat)}
                    className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
                      categoriaAtiva === cat
                        ? 'bg-stone-900 text-amber-400'
                        : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {carregandoCardapio ? (
              <div className="bg-white p-8 text-center rounded-2xl border border-stone-200 text-stone-500 text-sm">
                A carregar ementa...
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {itensFiltrados.length > 0 ? (
                  itensFiltrados.map(item => (
                    <div
                      key={item.id}
                      className="bg-white rounded-2xl border border-stone-200 p-4 flex gap-4 hover:border-amber-500/50 transition-all shadow-sm group"
                    >
                      {item.imagem_url && (
                        <img
                          src={item.imagem_url}
                          alt={item.nome}
                          className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl object-cover shrink-0 group-hover:scale-105 transition-transform duration-300"
                        />
                      )}
                      <div className="flex flex-col justify-between flex-1">
                        <div>
                          <span className="text-[10px] font-bold uppercase text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
                            {item.categoria}
                          </span>
                          <h3 className="font-bold text-stone-900 text-sm sm:text-base mt-1">
                            {item.nome}
                          </h3>
                          <p className="text-xs text-stone-500 line-clamp-2 mt-1 leading-relaxed">
                            {item.descricao}
                          </p>
                        </div>
                        <p className="text-amber-700 font-extrabold text-base sm:text-lg mt-2">
                          R$ {Number(item.preco).toFixed(2).replace('.', ',')}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full bg-white p-8 text-center rounded-2xl border border-stone-200 text-stone-500 text-xs sm:text-sm">
                    Nenhum item encontrado na ementa para esta pesquisa.
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ==================== SEPARADOR 2: RESERVA DE MESAS ==================== */}
        {abaAtiva === 'mesas' && (
          <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-sm">
            {!sucesso ? (
              <form onSubmit={handleReservaMesa} className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-stone-900">Reserve a sua Mesa Antecipadamente</h2>
                  <p className="text-xs text-stone-500 mt-1">
                    Garanta o seu lugar no restaurante para jantar com amigos ou família.
                  </p>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 text-xs text-amber-900">
                  <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong>Regra do Horário de Reserva:</strong>
                    <p className="mt-0.5">
                      A sua reserva permanece válida durante todo o período informado (ex: das 19:00 às 21:00). Caso não chegue dentro dessa janela, a mesa é automaticamente liberada ao término do horário.
                    </p>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
                      Nome Responsável
                    </label>
                    <input
                      type="text"
                      placeholder="Seu nome completo"
                      value={formMesa.nome}
                      onChange={(e) => setFormMesa({ ...formMesa, nome: e.target.value })}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
                      WhatsApp para Confirmação
                    </label>
                    <input
                      type="tel"
                      placeholder="(64) 99999-9999"
                      value={formMesa.whatsapp}
                      onChange={(e) => setFormMesa({ ...formMesa, whatsapp: e.target.value })}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
                      Data da Reserva
                    </label>
                    <input
                      type="date"
                      value={formMesa.data}
                      onChange={(e) => setFormMesa({ ...formMesa, data: e.target.value })}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
                      Quantidade de Pessoas
                    </label>
                    <select
                      value={formMesa.pessoas}
                      onChange={(e) => setFormMesa({ ...formMesa, pessoas: e.target.value })}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600"
                    >
                      <option value="2">2 Pessoas</option>
                      <option value="4">4 Pessoas</option>
                      <option value="6">6 Pessoas</option>
                      <option value="8">8 a 10 Pessoas</option>
                      <option value="12">Mais de 12 Pessoas</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
                      Horário Chegada Estimado
                    </label>
                    <input
                      type="time"
                      value={formMesa.horarioInicio}
                      onChange={(e) => setFormMesa({ ...formMesa, horarioInicio: e.target.value })}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
                      Término Estimado do Evento
                    </label>
                    <input
                      type="time"
                      value={formMesa.horarioFim}
                      onChange={(e) => setFormMesa({ ...formMesa, horarioFim: e.target.value })}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-amber-600 text-white font-bold py-3.5 rounded-xl shadow-md hover:bg-amber-700 transition-all text-sm"
                >
                  Confirmar Reserva de Mesa
                </button>
              </form>
            ) : (
              <TelaSucesso mensagem={mensagemSucesso} onVoltar={() => setSucesso(false)} />
            )}
          </div>
        )}

        {/* ==================== SEPARADOR 3: RESERVA DE QUIOSQUES ==================== */}
        {abaAtiva === 'quiosques' && (
          <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-sm">
            {!sucesso ? (
              <form onSubmit={handleReservaQuiosque} className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-stone-900">Espaços em Quiosques para Eventos</h2>
                  <p className="text-xs text-stone-500 mt-1">
                    Escolha um dos nossos 5 quiosques estruturados para comemorações e eventos corporativos ou familiares.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-3">
                    Selecione o Quiosque Desejado
                  </label>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {QUIOSQUES.map(q => (
                      <div
                        key={q.id}
                        onClick={() => setFormQuiosque({ ...formQuiosque, quiosqueId: q.id })}
                        className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                          formQuiosque.quiosqueId === q.id
                            ? 'border-amber-600 bg-amber-50/50 shadow-sm'
                            : 'border-stone-200 bg-stone-50 hover:bg-stone-100'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <h4 className="font-bold text-stone-900 text-sm">{q.nome}</h4>
                          <span className="text-[10px] font-bold bg-amber-200 text-amber-900 px-2 py-0.5 rounded-md">
                            {q.capacidade}
                          </span>
                        </div>
                        <p className="text-xs text-stone-500 mt-1">{q.descricao}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
                      Seu Nome ou Nome da Empresa
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Roberto Gomes"
                      value={formQuiosque.nome}
                      onChange={(e) => setFormQuiosque({ ...formQuiosque, nome: e.target.value })}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
                      WhatsApp de Contato
                    </label>
                    <input
                      type="tel"
                      placeholder="(64) 99999-9999"
                      value={formQuiosque.whatsapp}
                      onChange={(e) => setFormQuiosque({ ...formQuiosque, whatsapp: e.target.value })}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
                      Data do Evento
                    </label>
                    <input
                      type="date"
                      value={formQuiosque.data}
                      onChange={(e) => setFormQuiosque({ ...formQuiosque, data: e.target.value })}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
                      Tipo de Evento
                    </label>
                    <select
                      value={formQuiosque.evento}
                      onChange={(e) => setFormQuiosque({ ...formQuiosque, evento: e.target.value })}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600"
                    >
                      <option value="Aniversário">Aniversário</option>
                      <option value="Confraternização da Empresa">Confraternização da Empresa</option>
                      <option value="Reunião Familiar">Reunião Familiar / Amigos</option>
                      <option value="Outro">Outro</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-stone-900 text-amber-400 font-bold py-3.5 rounded-xl shadow-md hover:bg-stone-800 transition-all text-sm"
                >
                  Solicitar Reserva de Quiosque
                </button>
              </form>
            ) : (
              <TelaSucesso mensagem={mensagemSucesso} onVoltar={() => setSucesso(false)} />
            )}
          </div>
        )}
      </div>
    </main>
  );
}

function TelaSucesso({ mensagem, onVoltar }) {
  return (
    <div className="text-center py-8 space-y-4">
      <div className="w-16 h-16 bg-amber-100 text-amber-800 rounded-full flex items-center justify-center mx-auto">
        <CheckCircle2 className="w-8 h-8" />
      </div>
      <h3 className="text-2xl font-bold text-stone-900">
        Solicitação Recebida com Sucesso!
      </h3>
      <p className="text-sm text-stone-600 max-w-md mx-auto leading-relaxed">
        {mensagem}
      </p>
      <div className="pt-2">
        <button
          onClick={onVoltar}
          className="bg-stone-100 text-stone-800 font-bold px-6 py-2.5 rounded-xl border border-stone-200 text-xs hover:bg-stone-200 transition-all"
        >
          Fazer Nova Consulta
        </button>
      </div>
    </div>
  );
}