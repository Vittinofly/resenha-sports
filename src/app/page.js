import Link from 'next/link';
import {
  Dumbbell,
  Utensils,
  PartyPopper,
  BookOpen,
  ArrowRight,
  CalendarCheck,
  MousePointerClick,
  MessageCircle,
  Clock,
  Sun,
  Beer,
  Users,
  ChevronDown,
} from 'lucide-react';
import PaginaPublica from '@/components/pagina-publica';
import { QUADRAS, QUIOSQUES, NEGOCIO, HORARIO_FUNCIONAMENTO } from '@/lib/config';
import { linkWhatsApp } from '@/lib/formatadores';

export const metadata = {
  title: { absolute: `${NEGOCIO.nome} — Quadras, Gastrobar e Eventos` },
  alternates: { canonical: '/' },
};

const SERVICOS = [
  {
    href: '/reservas/quadras',
    icone: Dumbbell,
    titulo: 'Quadras',
    texto: 'Beach Tennis, Futevôlei e Padel. Veja os horários livres em tempo real e reserve na hora.',
    cta: 'Reservar quadra',
    destaque: true,
  },
  {
    href: '/reservas/mesas',
    icone: Utensils,
    titulo: 'Mesas',
    texto: 'Garanta seu lugar no gastrobar e já deixe os petiscos e bebidas encaminhados.',
    cta: 'Reservar mesa',
  },
  {
    href: '/reservas/quiosques',
    icone: PartyPopper,
    titulo: 'Quiosques',
    texto: 'Espaço privado para aniversários, churrascos e confraternizações de até 100 pessoas.',
    cta: 'Ver quiosques',
  },
  {
    href: '/cardapio',
    icone: BookOpen,
    titulo: 'Cardápio',
    texto: 'Espetinhos, porções, drinks e cerveja gelada. Consulte preços direto do celular.',
    cta: 'Abrir cardápio',
  },
];

const PASSOS = [
  { icone: MousePointerClick, titulo: 'Escolha', texto: 'Quadra, mesa ou quiosque — e o dia e horário que você quer.' },
  { icone: CalendarCheck, titulo: 'Solicite', texto: 'Preencha nome e WhatsApp. Leva menos de 1 minuto, sem cadastro.' },
  { icone: MessageCircle, titulo: 'Confirmado', texto: 'Nossa equipe confirma pelo WhatsApp. É só chegar e curtir.' },
];

const FAQ = [
  {
    p: 'Preciso criar conta para reservar?',
    r: 'Não. Basta informar seu nome e WhatsApp. A confirmação da reserva é feita pela nossa equipe diretamente no seu WhatsApp.',
  },
  {
    p: 'Como sei se o horário da quadra está livre?',
    r: 'A grade de horários mostra a disponibilidade em tempo real. Horários ocupados aparecem bloqueados e não podem ser selecionados.',
  },
  {
    p: 'Posso deixar o consumo encomendado?',
    r: 'Sim! Nas reservas de mesa e quiosque você pode montar um pré-pedido com itens do cardápio. Assim chegamos com tudo pronto.',
  },
  {
    p: 'Preciso cancelar ou mudar o horário. E agora?',
    r: 'Fale com a gente pelo WhatsApp o quanto antes. Assim liberamos o horário para outra pessoa e ajustamos sua reserva.',
  },
];

export default function HomePage() {
  return (
    <PaginaPublica subtitulo="Sports Center & Gastrobar">
      {/* HERO */}
      <section className="relative overflow-hidden bg-slate-950 text-white">
        <div className="absolute inset-0 fundo-quadra" aria-hidden="true" />
        <div className="absolute -right-32 -top-32 w-[28rem] h-[28rem] rounded-full bg-red-600/30 blur-3xl" aria-hidden="true" />
        <div className="absolute -left-40 bottom-0 w-96 h-96 rounded-full bg-amber-400/10 blur-3xl" aria-hidden="true" />

        <div className="relative max-w-6xl mx-auto px-4 pt-14 pb-16 sm:pt-20 sm:pb-24 grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-12 items-center">
          <div>
            <span className="chip border-red-500/40 bg-red-500/10 text-red-300 uppercase tracking-wider">
              <Sun className="w-3.5 h-3.5" /> Esporte · Gastrobar · Eventos
            </span>
            <h1 className="font-display font-black uppercase leading-[0.9] tracking-tight text-5xl sm:text-7xl mt-5">
              Joga.<br />
              Come.<br />
              <span className="text-red-500">Comemora.</span>
            </h1>
            <p className="text-slate-300 text-base sm:text-lg mt-6 max-w-xl">
              Quadras de areia e padel, cozinha de boteco caprichada e espaço para a sua festa.
              Reserve online em menos de um minuto.
            </p>
            <div className="flex flex-wrap gap-3 mt-8">
              <Link href="/reservas/quadras" className="btn-primario !px-6 !py-3.5 !text-base">
                Reservar quadra <ArrowRight className="w-5 h-5" />
              </Link>
              <Link href="/cardapio" className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold text-white border border-white/20 hover:bg-white/10 transition">
                Ver cardápio
              </Link>
            </div>
          </div>

          <dl className="grid grid-cols-3 lg:grid-cols-1 gap-3">
            {[
              { valor: QUADRAS.length, rotulo: 'quadras', icone: Dumbbell },
              { valor: HORARIO_FUNCIONAMENTO[0].horas.replace(' às ', '–').replace(/:00/g, 'h'), rotulo: 'todos os dias', icone: Clock },
              { valor: `${Math.max(...QUIOSQUES.map((q) => q.capacidade))}`, rotulo: 'pessoas no maior quiosque', icone: Users },
            ].map(({ valor, rotulo, icone: Icone }) => (
              <div key={rotulo} className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-4 lg:flex lg:items-center lg:gap-4">
                <Icone className="w-5 h-5 text-red-500 mb-2 lg:mb-0 shrink-0" />
                <div>
                  <dd className="font-display font-black text-2xl sm:text-3xl leading-none">{valor}</dd>
                  <dt className="text-[11px] sm:text-xs text-slate-400 mt-1">{rotulo}</dt>
                </div>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* SERVIÇOS */}
      <section className="max-w-6xl mx-auto px-4 -mt-8 relative">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {SERVICOS.map(({ href, icone: Icone, titulo, texto, cta, destaque }) => (
            <Link
              key={href}
              href={href}
              className={`group rounded-3xl p-6 border shadow-sm hover:shadow-xl hover:-translate-y-1 transition flex flex-col ${
                destaque ? 'bg-red-600 border-red-600 text-white' : 'bg-white border-slate-200'
              }`}
            >
              <span className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-5 ${destaque ? 'bg-white/15' : 'bg-red-50 text-red-600'}`}>
                <Icone className="w-6 h-6" />
              </span>
              <h2 className={`font-display font-black uppercase text-2xl ${destaque ? '' : 'text-slate-900'}`}>{titulo}</h2>
              <p className={`text-sm mt-1.5 flex-1 ${destaque ? 'text-red-50' : 'text-slate-500'}`}>{texto}</p>
              <span className={`text-sm font-bold mt-5 inline-flex items-center gap-1 ${destaque ? '' : 'text-red-600'}`}>
                {cta} <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section className="max-w-6xl mx-auto px-4 pt-20">
        <h2 className="titulo-secao text-3xl sm:text-4xl text-center">Reservar é simples</h2>
        <p className="text-slate-500 text-center mt-2">Sem cadastro, sem ligação, sem espera.</p>
        <ol className="grid md:grid-cols-3 gap-4 mt-10">
          {PASSOS.map(({ icone: Icone, titulo, texto }, i) => (
            <li key={titulo} className="cartao p-6 relative">
              <span className="absolute top-5 right-6 font-display font-black text-6xl text-slate-100 leading-none select-none" aria-hidden="true">
                {i + 1}
              </span>
              <Icone className="w-7 h-7 text-red-600 relative" />
              <h3 className="font-display font-bold uppercase text-xl text-slate-900 mt-4 relative">{titulo}</h3>
              <p className="text-sm text-slate-500 mt-1 relative">{texto}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* QUADRAS */}
      <section className="max-w-6xl mx-auto px-4 pt-20">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h2 className="titulo-secao text-3xl sm:text-4xl">Nossas quadras</h2>
            <p className="text-slate-500 mt-1">Iluminação para jogar à noite e o bar a poucos passos.</p>
          </div>
          <Link href="/reservas/quadras" className="btn-escuro self-start sm:self-auto">
            Ver horários livres <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid md:grid-cols-3 gap-4 mt-8">
          {QUADRAS.map((q, i) => (
            <Link
              key={q.id}
              href={`/reservas/quadras?quadra=${q.id}`}
              className="group relative overflow-hidden rounded-3xl p-6 min-h-44 flex flex-col justify-end text-white bg-gradient-to-br from-slate-800 to-slate-950 hover:from-red-700 hover:to-slate-950 transition"
            >
              <div className="absolute inset-4 border-2 border-white/10 rounded-2xl" aria-hidden="true">
                <div className="absolute inset-y-0 left-1/2 border-l-2 border-white/10" />
              </div>
              <span className="relative chip border-white/20 bg-white/10 text-white self-start">{q.piso}</span>
              <h3 className="relative font-display font-black uppercase text-3xl mt-2">Quadra {i + 1}</h3>
              <p className="relative text-sm text-slate-300">{q.esportes}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* EVENTOS */}
      <section className="max-w-6xl mx-auto px-4 pt-20">
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-red-600 to-red-800 text-white p-8 sm:p-12 grid md:grid-cols-[1.4fr_1fr] gap-8 items-center">
          <Beer className="absolute -right-6 -bottom-6 w-56 h-56 text-white/10 rotate-12" aria-hidden="true" />
          <div className="relative">
            <span className="chip border-white/30 bg-white/10 text-white uppercase tracking-wider">
              <PartyPopper className="w-3.5 h-3.5" /> Eventos privados
            </span>
            <h2 className="font-display font-black uppercase text-4xl sm:text-5xl leading-none mt-4">Sua festa no Resenha</h2>
            <p className="text-red-50 mt-3 max-w-lg">
              Aniversário, churrasco da firma ou aquele encontro da turma. Escolha o quiosque, monte o pré-pedido e deixe o resto com a gente.
            </p>
            <Link href="/reservas/quiosques" className="mt-6 inline-flex items-center gap-2 bg-white text-red-700 font-bold px-6 py-3 rounded-xl hover:bg-red-50 transition">
              Reservar quiosque <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <ul className="relative space-y-2">
            {QUIOSQUES.map((q) => (
              <li key={q.id} className="flex items-center justify-between gap-3 rounded-2xl bg-black/15 border border-white/15 px-4 py-3">
                <span>
                  <strong className="block font-bold">{q.curto}</strong>
                  <span className="text-xs text-red-100">{q.ideal}</span>
                </span>
                <span className="font-display font-black text-xl whitespace-nowrap">até {q.capacidade}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-4 pt-20">
        <h2 className="titulo-secao text-3xl sm:text-4xl text-center">Dúvidas frequentes</h2>
        <div className="mt-8 space-y-3">
          {FAQ.map(({ p, r }) => (
            <details key={p} className="group cartao px-5 py-4 open:shadow-md">
              <summary className="flex items-center justify-between gap-4 cursor-pointer list-none font-bold text-slate-900">
                {p}
                <ChevronDown className="w-5 h-5 text-slate-400 shrink-0 group-open:rotate-180 transition" />
              </summary>
              <p className="text-sm text-slate-600 mt-3 leading-relaxed">{r}</p>
            </details>
          ))}
        </div>
        {NEGOCIO.whatsapp && (
          <p className="text-center text-sm text-slate-500 mt-6">
            Ainda com dúvida?{' '}
            <a href={linkWhatsApp(NEGOCIO.whatsapp, 'Olá! Tenho uma dúvida sobre as reservas.')} target="_blank" rel="noreferrer" className="font-bold text-emerald-700 hover:underline">
              Chame a gente no WhatsApp
            </a>
          </p>
        )}
      </section>
    </PaginaPublica>
  );
}
