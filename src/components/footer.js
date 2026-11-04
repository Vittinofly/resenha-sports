import Link from 'next/link';
import { Clock, MapPin, MessageCircle, AtSign, ShieldCheck } from 'lucide-react';
import Logo from '@/components/logo';
import { NEGOCIO, HORARIO_FUNCIONAMENTO } from '@/lib/config';
import { formatarTelefone, linkWhatsApp } from '@/lib/formatadores';

export default function Footer() {
  return (
    <footer className="bg-slate-950 text-slate-300 mt-16">
      <div className="max-w-6xl mx-auto px-4 py-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-3 lg:col-span-1">
          <Logo claro subtitulo="Sports Center & Gastrobar" />
          <p className="text-sm text-slate-400 leading-relaxed">{NEGOCIO.slogan}</p>
        </div>

        <div>
          <h3 className="titulo-rodape">Reservas</h3>
          <ul className="space-y-2 text-sm">
            <li><Link href="/reservas/quadras" className="hover:text-white">Quadras de areia e padel</Link></li>
            <li><Link href="/reservas/mesas" className="hover:text-white">Mesa no gastrobar</Link></li>
            <li><Link href="/reservas/quiosques" className="hover:text-white">Quiosques para eventos</Link></li>
            <li><Link href="/cardapio" className="hover:text-white">Cardápio digital</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="titulo-rodape">Horários</h3>
          <ul className="space-y-2 text-sm">
            {HORARIO_FUNCIONAMENTO.map((h) => (
              <li key={h.dias} className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-red-500 shrink-0" />
                <span><strong className="text-white">{h.dias}:</strong> {h.horas}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="titulo-rodape">Contato</h3>
          <ul className="space-y-2 text-sm">
            {NEGOCIO.whatsapp && (
              <li>
                <a href={linkWhatsApp(NEGOCIO.whatsapp, 'Olá! Vim pelo site e gostaria de mais informações.')} target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-white">
                  <MessageCircle className="w-4 h-4 text-emerald-400" /> {formatarTelefone(NEGOCIO.whatsapp)}
                </a>
              </li>
            )}
            {NEGOCIO.instagram && (
              <li>
                <a href={`https://instagram.com/${NEGOCIO.instagram}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-white">
                  <AtSign className="w-4 h-4 text-pink-400" /> @{NEGOCIO.instagram}
                </a>
              </li>
            )}
            {NEGOCIO.endereco && (
              <li>
                <a href={NEGOCIO.mapsUrl || `https://www.google.com/maps/search/${encodeURIComponent(`${NEGOCIO.endereco} ${NEGOCIO.cidade}`)}`} target="_blank" rel="noreferrer" className="flex items-start gap-2 hover:text-white">
                  <MapPin className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <span>{NEGOCIO.endereco}{NEGOCIO.cidade && ` — ${NEGOCIO.cidade}`}</span>
                </a>
              </li>
            )}
            {!NEGOCIO.whatsapp && !NEGOCIO.instagram && !NEGOCIO.endereco && (
              <li className="text-slate-500">Fale com a gente pelo balcão ou reserve online.</li>
            )}
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <span>© {NEGOCIO.nome}</span>
          <Link href="/login" className="inline-flex items-center gap-1.5 hover:text-slate-300">
            <ShieldCheck className="w-3.5 h-3.5" /> Área da equipe
          </Link>
        </div>
      </div>
    </footer>
  );
}
