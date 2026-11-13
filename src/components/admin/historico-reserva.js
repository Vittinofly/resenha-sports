'use client';

import { useEffect, useState } from 'react';
import { History, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { STATUS } from '@/lib/config';
import { formatarData, formatarMoeda, hhmm } from '@/lib/formatadores';
import { parseDetalhes } from '@/lib/reservas';

const ROTULOS = {
  status: 'Status',
  data_reserva: 'Data',
  horario_inicio: 'Início',
  horario_fim: 'Fim',
  quadra_nome: 'Quadra',
  num_pessoas: 'Pessoas',
  num_convidados: 'Convidados',
  tipo_evento: 'Detalhes',
  observacoes: 'Observação',
  sinal_pago: 'Sinal',
  sinal_valor: 'Valor do sinal',
  cliente_nome: 'Nome',
  cliente_whatsapp: 'WhatsApp',
};

function formatarValor(campo, v) {
  if (v === null || v === undefined || v === '') return '—';
  if (campo === 'status') return STATUS[v]?.label || v;
  if (campo === 'data_reserva') return formatarData(v);
  if (campo.startsWith('horario_')) return hhmm(v);
  if (campo === 'sinal_pago') return v ? 'pago' : 'pendente';
  if (campo === 'sinal_valor') return formatarMoeda(v);
  if (campo === 'tipo_evento') {
    const d = parseDetalhes(v);
    return [d.evento, d.local].filter(Boolean).join(' · ');
  }
  return String(v);
}

function descreverAutor(item) {
  if (item.autor_email) return item.autor_email;
  return item.acao === 'criada' ? 'Site (cliente)' : 'Cliente (pelo link)';
}

const quando = (iso) =>
  new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

// Linha do tempo de uma reserva (tabela reservas_historico, preenchida por trigger).
export default function HistoricoReserva({ tipo, reservaId, versao }) {
  const [estado, setEstado] = useState({ carregando: true, itens: [], indisponivel: false });

  useEffect(() => {
    let ativo = true;
    supabase
      .from('reservas_historico')
      .select('id, acao, mudancas, autor_email, created_at')
      .eq('tipo', tipo)
      .eq('reserva_id', String(reservaId))
      .order('created_at', { ascending: false })
      .limit(30)
      .then(({ data, error }) => {
        if (ativo) setEstado({ carregando: false, itens: data || [], indisponivel: !!error });
      });
    return () => {
      ativo = false;
    };
  }, [tipo, reservaId, versao]);

  if (estado.indisponivel) return null; // SQL ainda não aplicado

  return (
    <details className="group rounded-2xl border border-slate-200">
      <summary className="cursor-pointer list-none flex items-center gap-2 px-4 py-3 text-xs font-bold text-slate-600 uppercase">
        <History className="w-3.5 h-3.5 text-red-600" /> Histórico
        {!estado.carregando && <span className="text-slate-400 font-semibold normal-case">({estado.itens.length})</span>}
      </summary>
      <div className="px-4 pb-4">
        {estado.carregando ? (
          <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
        ) : estado.itens.length === 0 ? (
          <p className="text-xs text-slate-400">Sem registros (alterações anteriores à ativação do histórico não aparecem).</p>
        ) : (
          <ol className="space-y-2.5 border-l-2 border-slate-100 pl-3">
            {estado.itens.map((item) => (
              <li key={item.id} className="text-xs">
                <p className="text-slate-500">
                  <span className="font-semibold text-slate-700">{quando(item.created_at)}</span> · {descreverAutor(item)}
                </p>
                {item.acao === 'criada' && <p className="text-slate-800">Reserva criada</p>}
                {item.acao === 'excluida' && <p className="text-rose-700">Reserva excluída</p>}
                {item.mudancas &&
                  Object.entries(item.mudancas)
                    .filter(([campo]) => ROTULOS[campo])
                    .map(([campo, [antes, depois]]) => (
                      <p key={campo} className="text-slate-800">
                        {ROTULOS[campo]}: <span className="text-slate-400 line-through">{formatarValor(campo, antes)}</span> → <strong>{formatarValor(campo, depois)}</strong>
                      </p>
                    ))}
              </li>
            ))}
          </ol>
        )}
      </div>
    </details>
  );
}
