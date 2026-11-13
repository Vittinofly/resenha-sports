// Domínio sem empresa cadastrada (ou empresa suspensa): não há marca para exibir.
export const metadata = { title: 'Página não encontrada', robots: { index: false, follow: false } };

export default function NotFound() {
  return (
    <main className="flex-1 flex items-center justify-center px-4 py-24 text-center bg-slate-950 text-white min-h-screen">
      <div>
        <p className="font-display font-black text-8xl leading-none text-slate-500">404</p>
        <h1 className="font-display font-black uppercase text-3xl mt-4">Site não encontrado</h1>
        <p className="text-slate-400 mt-2">Este endereço não existe ou está temporariamente indisponível.</p>
      </div>
    </main>
  );
}
