'use client';

import { useState } from 'react';
import { CalendarClock, CalendarDays, CheckCircle2, Clock, Flag, Loader2, MapPin, MessageCircle, Save, ShoppingBag, Users, XCircle } from 'lucide-react';
import Modal from '@/components/modal';
import { useFeedback } from '@/components/feedback';
import { BadgeStatus, IconeTipo } from '@/components/admin/ui';
import CamposAgenda, { prepararAgenda, valoresAgenda } from '@/components/admin/campos-agenda';
import { atualizarReserva, verificarDisponibilidade } from '@/lib/admin';
import { MODELOS_MENSAGEM, TIPOS_RESERVA, ERRO_CONFLITO_DB, ERRO_DUPLICADO_DB, normalizarReserva } from '@/lib/reservas';
import { formatarDataLonga, formatarTelefone, linkWhatsApp } from '@/lib/formatadores';

// Detalhes + ações de uma reserva normalizada (ver normalizarReserva).
// O componente pai deve passar `key={reserva.chave}` para reiniciar o estado ao trocar de reserva.
export default function ModalReserva({ reserva, aoFechar, aoAtualizar }) {
  const { toast, confirmar } = useFeedback();
  const [salvando, setSalvando] = useState(null);
  const [observacao, setObservacao] = useState(reserva?.observacoes || '');
  const [atual, setAtual] = useState(reserva);
  const [agenda, setAgenda] = useState(null); // valores do formulário de remarcação (null = fechado)
  const [remarcada, setRemarcada] = useState(false);

  if (!reserva || !atual) return null;

  const remarcar = async (e) => {
    e.preventDefault();
    const { campos, erro } = prepararAgenda(atual.tipo, agenda, atual);
    if (erro) return toast(erro, 'erro');

    setSalvando('remarcar');
    const { mensagem, erro: erroConsulta } = await verificarDisponibilidade(atual.tipo, campos, atual.id);
    if (mensagem || erroConsulta) {
      setSalvando(null);
      return toast(mensagem || 'Não foi possível verificar a disponibilidade. Tente novamente.', 'erro');
    }

    const { error } = await atualizarReserva(atual, campos);
    setSalvando(null);
    if (error) {
      const ocupado = error.code === ERRO_CONFLITO_DB || error.code === ERRO_DUPLICADO_DB;
      return toast(ocupado ? 'Esse horário/espaço acabou de ser ocupado.' : 'Erro ao remarcar: ' + error.message, 'erro');
    }

    const nova = normalizarReserva({ ...atual, ...campos }, atual.tipo);
    setAtual(nova);
    setAgenda(null);
    setRemarcada(true);
    aoAtualizar?.(nova);
    toast('Reserva remarcada. Avise o cliente pelo WhatsApp!');
  };

  const mudarStatus = async (status) => {
    if (status === 'cancelado') {
      const ok = await confirmar({
        titulo: 'Cancelar reserva?',
        mensagem: `A reserva de ${atual.nome} será cancelada e o horário liberado.`,
        textoConfirmar: 'Cancelar reserva',
        perigo: true,
      });
      if (!ok) return;
    }
    setSalvando(status);
    const { error } = await atualizarReserva(atual, { status });
    setSalvando(null);
    if (error) return toast('Erro ao atualizar status: ' + error.message, 'erro');

    const nova = { ...atual, status };
    setAtual(nova);
    aoAtualizar?.(nova);
    toast(
      status === 'confirmado'
        ? 'Reserva confirmada. Avise o cliente pelo WhatsApp!'
        : status === 'cancelado'
        ? 'Reserva cancelada.'
        : status === 'concluido'
        ? 'Reserva concluída.'
        : 'Status atualizado.'
    );
    if (status === 'cancelado') aoFechar();
  };

  const salvarObservacao = async () => {
    setSalvando('obs');
    const texto = observacao.trim();
    const { error } = await atualizarReserva(atual, { observacoes: texto });
    setSalvando(null);
    if (error) return toast('Erro ao salvar observação: ' + error.message, 'erro');
    const nova = { ...atual, observacoes: texto };
    setAtual(nova);
    aoAtualizar?.(nova);
    toast('Observação salva.');
  };

  const observacaoAlterada = observacao.trim() !== (atual.observacoes || '').trim();

  return (
    <Modal aberto aoFechar={aoFechar} titulo={`Reserva de ${TIPOS_RESERVA[atual.tipo].label}`} icone={<IconeTipo tipo={atual.tipo} className="w-5 h-5 text-red-600" />} largura="max-w-lg">
      <div className="space-y-5 text-sm">
        {/* CLIENTE + INFO */}
        <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-black text-lg text-slate-900 leading-tight">{atual.nome}</p>
              <a href={linkWhatsApp(atual.cliente_whatsapp)} target="_blank" rel="noreferrer" className="text-emerald-700 font-bold hover:underline text-sm">
                {formatarTelefone(atual.cliente_whatsapp)}
              </a>
            </div>
            <BadgeStatus status={atual.status} />
          </div>
          <ul className="grid sm:grid-cols-2 gap-2 text-slate-700">
            <li className="flex items-center gap-2"><MapPin className="w-4 h-4 text-red-600 shrink-0" /> {atual.local}</li>
            <li className="flex items-center gap-2"><CalendarDays className="w-4 h-4 text-red-600 shrink-0" /> {formatarDataLonga(atual.data_reserva)}</li>
            {atual.inicio && (
              <li className="flex items-center gap-2"><Clock className="w-4 h-4 text-red-600 shrink-0" /> {atual.inicio}{atual.fim && ` às ${atual.fim}`}</li>
            )}
            {atual.pessoas && (
              <li className="flex items-center gap-2"><Users className="w-4 h-4 text-red-600 shrink-0" /> {atual.pessoas} pessoas</li>
            )}
            {atual.evento && (
              <li className="flex items-center gap-2"><Flag className="w-4 h-4 text-red-600 shrink-0" /> {atual.evento}</li>
            )}
          </ul>
        </div>

        {/* REMARCAR */}
        {atual.status !== 'cancelado' && atual.status !== 'concluido' && (
          agenda ? (
            <form onSubmit={remarcar} className="rounded-2xl border border-red-200 bg-red-50/40 p-4 space-y-3">
              <p className="rotulo flex items-center gap-1.5 !mb-0"><CalendarClock className="w-3.5 h-3.5 text-red-600" /> Remarcar reserva</p>
              <CamposAgenda tipo={atual.tipo} valores={agenda} aoMudar={setAgenda} idPrefixo={`rm-${atual.chave}`} />
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setAgenda(null)} className="btn-secundario !py-2 !text-xs">Cancelar</button>
                <button type="submit" disabled={!!salvando} className="btn-primario !py-2 !text-xs">
                  {salvando === 'remarcar' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Salvar nova data
                </button>
              </div>
            </form>
          ) : (
            <button type="button" onClick={() => setAgenda(valoresAgenda(atual.tipo, { reserva: atual }))} className="btn-secundario w-full !text-xs">
              <CalendarClock className="w-4 h-4 text-red-600" /> Remarcar data, horário ou local
            </button>
          )
        )}

        {/* PRÉ-PEDIDO */}
        {atual.tipo !== 'quadras' && (
          <div>
            <p className="rotulo flex items-center gap-1.5"><ShoppingBag className="w-3.5 h-3.5 text-red-600" /> Pré-pedido</p>
            {atual.itens.length ? (
              <ul className="flex flex-wrap gap-1.5">
                {atual.itens.map((item, i) => (
                  <li key={i} className="chip bg-white border-slate-200 text-slate-800">{item}</li>
                ))}
              </ul>
            ) : (
              <p className="text-slate-400 text-xs">Sem pré-pedido.</p>
            )}
          </div>
        )}

        {/* STATUS */}
        <div>
          <p className="rotulo">Status</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { status: 'confirmado', label: 'Confirmar', icone: CheckCircle2, ativo: 'bg-emerald-600 text-white border-emerald-600' },
              { status: 'pendente', label: 'Pendente', icone: Clock, ativo: 'bg-amber-500 text-white border-amber-500' },
              { status: 'concluido', label: 'Concluir', icone: Flag, ativo: 'bg-slate-800 text-white border-slate-800' },
              { status: 'cancelado', label: 'Cancelar', icone: XCircle, ativo: 'bg-red-600 text-white border-red-600' },
            ].map(({ status, label, icone: Icone, ativo }) => (
              <button
                key={status}
                type="button"
                disabled={!!salvando || atual.status === status}
                onClick={() => mudarStatus(status)}
                className={`flex items-center justify-center gap-1.5 py-2 rounded-xl border text-xs font-bold transition disabled:cursor-default ${
                  atual.status === status ? ativo : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50'
                }`}
              >
                {salvando === status ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Icone className="w-3.5 h-3.5" />} {label}
              </button>
            ))}
          </div>
        </div>

        {/* WHATSAPP */}
        <div>
          <p className="rotulo">Mensagem rápida no WhatsApp</p>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(MODELOS_MENSAGEM).map(([chave, modelo]) => {
              const destaque = remarcada ? chave === 'remarcacao' : chave === 'confirmacao' && atual.status === 'confirmado';
              return (
                <a
                  key={chave}
                  href={linkWhatsApp(atual.cliente_whatsapp, modelo.texto(atual))}
                  target="_blank"
                  rel="noreferrer"
                  className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-bold border transition ${
                    destaque ? 'bg-emerald-600 border-emerald-600 text-white hover:bg-emerald-700' : 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100'
                  }`}
                >
                  <MessageCircle className="w-3.5 h-3.5" /> {modelo.label}
                </a>
              );
            })}
          </div>
        </div>

        {/* OBSERVAÇÕES */}
        <div>
          <label htmlFor="obs-reserva" className="rotulo">Observações internas</label>
          <textarea
            id="obs-reserva"
            rows={3}
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
            placeholder="Ex.: sinal pago via Pix, mesa perto do telão, aniversariante..."
            className="input resize-none"
          />
          <div className="flex justify-end mt-2">
            <button type="button" onClick={salvarObservacao} disabled={!observacaoAlterada || !!salvando} className="btn-escuro !py-2 !text-xs">
              {salvando === 'obs' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Salvar observação
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
