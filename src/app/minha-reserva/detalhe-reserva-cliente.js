'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AlertCircle, CalendarDays, Clock, Loader2, MapPin, Users, XCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { NEGOCIO } from '@/lib/config';
import { TIPOS_RESERVA, normalizarReserva, sinalPendente } from '@/lib/reservas';
import { formatarDataLonga, formatarMoeda, linkWhatsApp } from '@/lib/formatadores';
import { useFeedback } from '@/components/feedback';
import { BadgeStatus } from '@/components/admin/ui';
import PagamentoPix from '@/components/pagamento-pix';

const TOKEN_VALIDO = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function DetalheReservaCliente() {
  const params = useSearchParams();
  const tipo = params.get('t');
  const token = params.get('c') || '';
  const valido = !!TIPOS_RESERVA[tipo] && TOKEN_VALIDO.test(token);
  const { confirmar, toast } = useFeedback();
  const [estado, setEstado] = useState({ carregando: valido, reserva: null, erro: !valido });
  const [cancelando, setCancelando] = useState(false);

  useEffect(() => {
    if (!valido) return;
    let ativo = true;
    supabase.rpc('consultar_reserva_cliente', { p_tipo: tipo, p_token: token }).then(({ data, error }) => {
      if (!ativo) return;
      setEstado({ carregando: false, reserva: data ? normalizarReserva(data, tipo) : null, erro: !!error || !data });
    });
    return () => {
      ativo = false;
    };
  }, [valido, tipo, token]);

  const cancelar = async () => {
    const ok = await confirmar({
      titulo: 'Cancelar reserva?',
      mensagem: 'O horário será liberado para outras pessoas. Essa ação não pode ser desfeita.',
      textoConfirmar: 'Cancelar reserva',
      perigo: true,
    });
    if (!ok) return;
    setCancelando(true);
    const { data, error } = await supabase.rpc('cancelar_reserva_cliente', { p_tipo: tipo, p_token: token });
    setCancelando(false);
    if (error || data !== 'ok') {
      return toast('Não foi possível cancelar pelo site. Fale com a gente pelo WhatsApp.', 'erro');
    }
    setEstado((e) => ({ ...e, reserva: { ...e.reserva, status: 'cancelado' } }));
    toast('Reserva cancelada. Obrigado por avisar!');
  };

  if (estado.carregando) {
    return (
      <div className="cartao p-10 flex justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (estado.erro || !estado.reserva) {
    return (
      <div className="cartao p-8 text-center space-y-3">
        <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
        <p className="text-slate-700">Não encontramos essa reserva. Confira se o link está completo.</p>
        {NEGOCIO.whatsapp && (
          <a href={linkWhatsApp(NEGOCIO.whatsapp, 'Olá! Preciso de ajuda com a minha reserva.')} target="_blank" rel="noreferrer" className="btn-whatsapp">
            Falar com a equipe
          </a>
        )}
      </div>
    );
  }

  const r = estado.reserva;
  const ativa = ['pendente', 'agendada', 'confirmado'].includes(r.status);

  return (
    <div className="cartao p-6 space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase text-slate-500">{TIPOS_RESERVA[tipo].label}</p>
          <p className="font-display font-black uppercase text-2xl text-slate-900 leading-tight">{r.nome}</p>
        </div>
        <BadgeStatus status={r.status} />
      </div>

      <ul className="space-y-2 text-sm text-slate-700">
        <li className="flex items-center gap-2"><MapPin className="w-4 h-4 text-red-600" /> {r.local}{r.evento && ` · ${r.evento}`}</li>
        <li className="flex items-center gap-2"><CalendarDays className="w-4 h-4 text-red-600" /> {formatarDataLonga(r.data_reserva)}</li>
        {r.inicio && <li className="flex items-center gap-2"><Clock className="w-4 h-4 text-red-600" /> {r.inicio}{r.fim && tipo === 'quadras' ? ` às ${r.fim}` : ''}</li>}
        {r.pessoas && <li className="flex items-center gap-2"><Users className="w-4 h-4 text-red-600" /> {r.pessoas} pessoas</li>}
      </ul>

      {r.status === 'pendente' && <p className="text-sm bg-amber-50 border border-amber-200 text-amber-900 rounded-xl p-3">Aguardando confirmação da equipe pelo WhatsApp.</p>}
      {Number(r.sinal_valor) > 0 && r.sinal_pago && <p className="text-sm bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl p-3">Sinal de {formatarMoeda(r.sinal_valor)} recebido. ✔</p>}
      {ativa && sinalPendente(r) && <PagamentoPix valor={Number(r.sinal_valor)} txid={token.replace(/-/g, '').slice(0, 25)} />}

      {ativa ? (
        <button type="button" onClick={cancelar} disabled={cancelando} className="btn-secundario w-full !text-red-700 !border-red-200 hover:!bg-red-50">
          {cancelando ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />} Cancelar reserva
        </button>
      ) : (
        <Link href={`/reservas/${tipo}`} className="btn-primario w-full">Fazer nova reserva</Link>
      )}
      {ativa && Number(r.sinal_valor) > 0 && r.sinal_pago && (
        <p className="text-[11px] text-slate-500 text-center">Sinal já pago: a devolução ou crédito é combinado com a equipe pelo WhatsApp.</p>
      )}
    </div>
  );
}
