'use client';

import { useState } from 'react';
import { Loader2, Plus } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { verificarDisponibilidade } from '@/lib/admin';
import { TIPOS_RESERVA, ERRO_CONFLITO_DB, ERRO_DUPLICADO_DB, normalizarReserva } from '@/lib/reservas';
import { apenasDigitos, formatarTelefone, telefoneValido } from '@/lib/formatadores';
import { useFeedback } from '@/components/feedback';
import { useEmpresa } from '@/components/empresa-contexto';
import { Segmentado } from '@/components/admin/ui';
import CamposAgenda, { prepararAgenda, valoresAgenda } from '@/components/admin/campos-agenda';
import Modal from '@/components/modal';

// Agendamento feito pela equipe (balcão, telefone, WhatsApp). Já nasce confirmado.
// `inicial` = { tipo, data_reserva, quadra_nome?, inicio? }; `tipoFixo` esconde a troca de tipo.
// Monte só enquanto aberto (`{novo && <ModalNovaReserva .../>}`) para o formulário sempre começar limpo.
export default function ModalNovaReserva({ inicial, aoFechar, aoCriar, tipoFixo = false }) {
  const { toast } = useFeedback();
  const empresa = useEmpresa();
  const [tipo, setTipo] = useState(inicial.tipo || empresa.reservaPrincipal);
  const [agenda, setAgenda] = useState(() => valoresAgenda(empresa, inicial.tipo || empresa.reservaPrincipal, inicial));
  const [contato, setContato] = useState({ nome: '', whatsapp: '' });
  const [observacoes, setObservacoes] = useState('');
  const [salvando, setSalvando] = useState(false);

  const trocarTipo = (novo) => {
    setTipo(novo);
    setAgenda((v) => ({ ...valoresAgenda(empresa, novo, inicial), data_reserva: v.data_reserva }));
  };

  const salvar = async (e) => {
    e.preventDefault();
    const nome = contato.nome.trim().replace(/\s+/g, ' ');
    if (nome.length < 2) return toast('Informe o nome do cliente.', 'erro');
    if (!telefoneValido(contato.whatsapp)) return toast('WhatsApp inválido (DDD + número).', 'erro');

    const { campos, erro } = prepararAgenda(empresa, tipo, agenda);
    if (erro) return toast(erro, 'erro');

    setSalvando(true);
    const { mensagem, erro: erroConsulta } = await verificarDisponibilidade(empresa.id, tipo, campos);
    if (mensagem || erroConsulta) {
      setSalvando(false);
      return toast(mensagem || 'Não foi possível verificar a disponibilidade. Tente novamente.', 'erro');
    }

    const linha = { ...campos, empresa_id: empresa.id, cliente_nome: nome, cliente_whatsapp: contato.whatsapp, observacoes: observacoes.trim(), status: 'confirmado' };
    const { data, error } = await supabase.from(TIPOS_RESERVA[tipo].tabela).insert([linha]).select().single();
    setSalvando(false);

    if (error) {
      const ocupado = error.code === ERRO_CONFLITO_DB || error.code === ERRO_DUPLICADO_DB;
      return toast(ocupado ? 'Esse horário/espaço acabou de ser ocupado.' : 'Erro ao agendar: ' + error.message, 'erro');
    }
    toast(`${TIPOS_RESERVA[tipo].label} agendada e confirmada.`);
    aoCriar?.(normalizarReserva(data || linha, tipo));
    aoFechar();
  };

  if (!tipo) return null; // empresa sem nenhum módulo de reserva

  return (
    <Modal aberto aoFechar={aoFechar} titulo="Novo agendamento" icone={<Plus className="w-5 h-5 text-red-600" />}>
      <form onSubmit={salvar} className="space-y-4">
        {!tipoFixo && (
          <Segmentado
            rotulo="Tipo de reserva"
            valor={tipo}
            aoMudar={trocarTipo}
            opcoes={Object.entries(TIPOS_RESERVA).filter(([valor]) => empresa.modulos[valor]).map(([valor, t]) => ({ valor, label: t.label }))}
          />
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 sm:col-span-1">
            <label htmlFor="nr-nome" className="rotulo">Nome do cliente *</label>
            <input id="nr-nome" required autoFocus value={contato.nome} onChange={(e) => setContato({ ...contato, nome: e.target.value })} className="input" placeholder="Ex.: João da Silva" />
          </div>
          <div className="col-span-2 sm:col-span-1">
            <label htmlFor="nr-fone" className="rotulo">WhatsApp *</label>
            <input
              id="nr-fone"
              required
              type="tel"
              inputMode="numeric"
              value={formatarTelefone(contato.whatsapp)}
              onChange={(e) => setContato({ ...contato, whatsapp: apenasDigitos(e.target.value).slice(0, 11) })}
              className="input"
              placeholder="(11) 99999-9999"
            />
          </div>
        </div>

        <CamposAgenda tipo={tipo} valores={agenda} aoMudar={setAgenda} idPrefixo="nr" />

        <div>
          <label htmlFor="nr-obs" className="rotulo">Observação interna</label>
          <textarea id="nr-obs" rows={2} value={observacoes} onChange={(e) => setObservacoes(e.target.value)} className="input resize-none" placeholder="Ex.: pago no balcão via Pix" />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={aoFechar} className="btn-secundario">Cancelar</button>
          <button type="submit" disabled={salvando} className="btn-primario">
            {salvando && <Loader2 className="w-4 h-4 animate-spin" />} Confirmar agendamento
          </button>
        </div>
      </form>
    </Modal>
  );
}
