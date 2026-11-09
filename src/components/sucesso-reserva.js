'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check, CheckCircle2, Copy, Link2, MessageCircle, CalendarPlus, RotateCcw } from 'lucide-react';
import { NEGOCIO } from '@/lib/config';
import { formatarMoeda, linkWhatsApp, minutosParaHora, horaParaMinutos } from '@/lib/formatadores';
import { linkReservaCliente } from '@/lib/reservas';
import PagamentoPix from '@/components/pagamento-pix';

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

function LinkDaReserva({ link }) {
  const [copiado, setCopiado] = useState(false);
  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 3000);
    } catch {
      window.open(link, '_blank', 'noopener');
    }
  };
  return (
    <div className="mt-4 flex items-center gap-2 text-left bg-white border border-slate-200 rounded-2xl p-3">
      <Link2 className="w-4 h-4 text-slate-400 shrink-0" />
      <p className="flex-1 min-w-0 text-xs text-slate-600">
        <strong className="text-slate-900">Guarde o link da sua reserva:</strong> por ele você acompanha o status ou cancela se precisar.
      </p>
      <button type="button" onClick={copiar} className="btn-secundario !py-1.5 !px-3 !text-xs shrink-0">
        {copiado ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />} {copiado ? 'Copiado' : 'Copiar'}
      </button>
    </div>
  );
}

// `resumo` = { titulo, tipo, token, sinal, linhas: [[rótulo, valor]], mensagemWhatsApp, agenda: {titulo, data, inicio, fim, detalhes} }
export default function SucessoReserva({ resumo, aoNovaReserva, textoNova = 'Fazer outra reserva' }) {
  const linkCliente = linkReservaCliente(resumo.tipo, resumo.token);
  const mensagem = [
    resumo.mensagemWhatsApp,
    resumo.sinal > 0 ? `\nVou enviar o sinal de ${formatarMoeda(resumo.sinal)} via Pix e mando o comprovante aqui.` : '',
    linkCliente ? `\nLink da reserva: ${linkCliente}` : '',
  ].join('');
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

      {resumo.sinal > 0 && <PagamentoPix valor={resumo.sinal} txid={resumo.token ? resumo.token.replace(/-/g, '').slice(0, 25) : ''} />}
      {linkCliente && <LinkDaReserva link={linkCliente} />}

      <div className="grid sm:grid-cols-2 gap-2 mt-6">
        {NEGOCIO.whatsapp && (
          <a href={linkWhatsApp(NEGOCIO.whatsapp, mensagem)} target="_blank" rel="noreferrer" className="btn-whatsapp sm:col-span-2 !py-3">
            <MessageCircle className="w-5 h-5" /> {resumo.sinal > 0 ? 'Enviar comprovante pelo WhatsApp' : 'Agilizar confirmação pelo WhatsApp'}
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
