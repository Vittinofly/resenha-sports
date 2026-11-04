import Header from '@/components/header';
import Footer from '@/components/footer';

export default function PaginaPublica({ subtitulo, children }) {
  return (
    <>
      <Header subtitulo={subtitulo} />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}

// Faixa de título das páginas internas
export function HeroPagina({ selo, icone: Icone, titulo, descricao, children }) {
  return (
    <section className="relative overflow-hidden bg-slate-950 text-white">
      <div className="absolute inset-0 fundo-quadra opacity-60" aria-hidden="true" />
      <div className="absolute -right-24 -top-24 w-80 h-80 rounded-full bg-red-600/25 blur-3xl" aria-hidden="true" />
      <div className="relative max-w-6xl mx-auto px-4 py-10 sm:py-14">
        <span className="chip border-red-500/40 bg-red-500/10 text-red-300 uppercase tracking-wider">
          {Icone && <Icone className="w-3.5 h-3.5" />} {selo}
        </span>
        <h1 className="font-display font-black uppercase text-4xl sm:text-5xl tracking-tight mt-3">{titulo}</h1>
        {descricao && <p className="text-slate-300 text-sm sm:text-base mt-2 max-w-2xl">{descricao}</p>}
        {children}
      </div>
    </section>
  );
}
