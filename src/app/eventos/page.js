import Link from 'next/link';
import { ArrowLeft, CalendarDays, Clock, MapPin, Sparkles, Users } from 'lucide-react';

const eventos = [
  {
    titulo: 'Noite de Futebol',
    data: 'Sexta, 18h às 23h',
    local: 'Quadra principal',
    descricao: 'Jogo aberto com música, churrasco e ambiente descontraído para acompanhar a partida.',
    publico: 'Aberto ao público'
  },
  {
    titulo: 'Sextou com Amigos',
    data: 'Sábado, 19h às 00h',
    local: 'Área de convivência',
    descricao: 'Especial para reunir amigos, aproveitar o espaço e entrar no ritmo da noite.',
    publico: 'Capacidade limitada'
  },
  {
    titulo: 'Domingo em Família',
    data: 'Domingo, 10h às 15h',
    local: 'Espaço de lazer',
    descricao: 'Atividade leve para toda a família com ambiente agradável e programação descontraída.',
    publico: 'Acesso livre'
  }
];

export default function EventosPage() {
  return (
    <main className="min-h-screen bg-stone-50 text-stone-800 py-8 px-4 font-sans">
      <div className="max-w-5xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-stone-600 hover:text-stone-900 bg-white px-3.5 py-2 rounded-full border border-stone-200 shadow-sm transition-all"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Voltar ao Portal
        </Link>

        <div className="mt-6 bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 shadow-sm">
          <span className="inline-flex items-center gap-2 text-xs font-bold tracking-wider uppercase bg-amber-100 text-amber-900 px-3 py-1 rounded-full">
            <Sparkles className="w-3.5 h-3.5" /> Agenda e eventos
          </span>
          <h1 className="mt-4 text-3xl sm:text-4xl font-extrabold text-stone-900">
            Eventos e Destaques do Resenha
          </h1>
          <p className="mt-3 text-sm text-stone-600 max-w-2xl">
            Fique por dentro da programação da semana, com diferentes opções para reunir amigos,
            aproveitar o ambiente e curtir o melhor da nossa estrutura.
          </p>
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-3">
          {eventos.map((evento) => (
            <article
              key={evento.titulo}
              className="bg-white border border-stone-200 rounded-3xl p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-700">
                  Destaque
                </span>
                <CalendarDays className="w-4 h-4 text-amber-600" />
              </div>

              <h2 className="mt-4 text-xl font-bold text-stone-900">{evento.titulo}</h2>

              <div className="mt-4 space-y-3 text-sm text-stone-600">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-600" />
                  <span>{evento.data}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-amber-600" />
                  <span>{evento.local}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-amber-600" />
                  <span>{evento.publico}</span>
                </div>
              </div>

              <p className="mt-4 text-sm leading-relaxed text-stone-600">{evento.descricao}</p>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
