'use client';

import Link from 'next/link';
import { CheckCircle2, MessageCircle, CalendarPlus, RotateCcw } from 'lucide-react';
import { NEGOCIO } from '@/lib/config';
import { linkWhatsApp, minutosParaHora, horaParaMinutos } from '@/lib/formatadores';

function linkGoogleAgenda({ titulo, data, inicio, fim, detalhes }) {
  const d = data.replace(/-/g, '');
  const h = (hora) => hora.replace(':', '') + '00';
  const datas = inicio
    ? `${d}T${h(inicio)}/${d}T${h(fim || minutosParaHora(horaParaMinutos(inicio) + 120))}`
    : `${d}/${d}`;
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: titulo,
    dates: datas,
    details: detalhes,
    ctz: 'America/Sao_Paulo',
    ...(NEGOCIO.endereco && { location: `${NEGOCIO.endereco} ${NEGOCIO.cidade}` }),
  });
  return `https://calendar.google.com/calendar/render?${params}`;
}

// `resumo` = { titulo, linhas: [[rótulo, valor]], mensagemWhatsApp, agenda: {titulo, data, inicio, fim, detalhes} }
export default function SucessoReserva({ resumo, aoNovaReserva, textoNova = 'Fazer outra reserva' }) {
  return (
    <div className="animate-entrar text-center max-w-lg mx-auto py-4">
      <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 flex items-center justify-center">
        <CheckCircle2 className="w-9 h-9 text-emerald-600" />
      </div>
      <h2 className="titulo-secao text-3xl mt-4">{resumo.titulo}</h2>
      <p className="text-sm text-slate-500 mt-1">
        Recebemos sua solicitação. Nossa equipe vai confirmar pelo WhatsApp em breve.
      </p>

      <dl className="mt-6 text-left bg-slate-50 rounded-2xl border border-slate-200 divide-y divide-slate-200">
        {resumo.linhas.filter(([, v]) => v).map(([rotulo, valor]) => (
          <div key={rotulo} className="flex justify-between gap-4 px-4 py-2.5 text-sm">
            <dt className="text-slate-500">{rotulo}</dt>
            <dd className="font-bold text-slate-900 text-right">{valor}</dd>
          </div>
        ))}
      </dl>

      <div className="grid sm:grid-cols-2 gap-2 mt-6">
        {NEGOCIO.whatsapp && (
          <a href={linkWhatsApp(NEGOCIO.whatsapp, resumo.mensagemWhatsApp)} target="_blank" rel="noreferrer" className="btn-whatsapp sm:col-span-2 !py-3">
            <MessageCircle className="w-5 h-5" /> Agilizar confirmação pelo WhatsApp
          </a>
        )}
        {resumo.agenda && (
          <a href={linkGoogleAgenda(resumo.agenda)} target="_blank" rel="noreferrer" className="btn-secundario">
            <CalendarPlus className="w-4 h-4" /> Salvar na agenda
          </a>
        )}
        <button onClick={aoNovaReserva} className={`btn-secundario ${resumo.agenda ? '' : 'sm:col-span-2'}`}>
          <RotateCcw className="w-4 h-4" /> {textoNova}
        </button>
      </div>

      <p className="text-xs text-slate-400 mt-6">
        Enquanto isso, que tal dar uma olhada no{' '}
        <Link href="/cardapio" className="font-bold text-red-600 hover:underline">cardápio</Link>?
      </p>
    </div>
  );
}
