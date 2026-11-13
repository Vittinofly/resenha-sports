'use client';

import Link from 'next/link';
import { Clock, MapPin, MessageCircle, AtSign, ShieldCheck } from 'lucide-react';
import Logo from '@/components/logo';
import { useEmpresa } from '@/components/empresa-contexto';
import { formatarTelefone, linkWhatsApp } from '@/lib/formatadores';

export default function Footer() {
  const empresa = useEmpresa();
  const { modulos } = empresa;
  return (
    <footer className="bg-slate-950 text-slate-300 mt-16">
      <div className="max-w-6xl mx-auto px-4 py-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-3 lg:col-span-1">
          <Logo claro subtitulo={empresa.subtitulo} />
          <p className="text-sm text-slate-400 leading-relaxed">{empresa.slogan}</p>
        </div>

        <div>
          <h2 className="titulo-rodape">Reservas</h2>
          <ul className="space-y-2 text-sm">
            {modulos.quadras && <li><Link href="/reservas/quadras" className="hover:text-white">Quadras</Link></li>}
            {modulos.mesas && <li><Link href="/reservas/mesas" className="hover:text-white">Mesas</Link></li>}
            {modulos.quiosques && <li><Link href="/reservas/quiosques" className="hover:text-white">Quiosques para eventos</Link></li>}
            {modulos.cardapio && <li><Link href="/cardapio" className="hover:text-white">Cardápio digital</Link></li>}
          </ul>
        </div>

        <div>
          <h2 className="titulo-rodape">Horários</h2>
          <ul className="space-y-2 text-sm">
            {empresa.horarioFuncionamento.map((h) => (
              <li key={h.dias} className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-red-500 shrink-0" />
                <span><strong className="text-white">{h.dias}:</strong> {h.horas}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="titulo-rodape">Contato</h2>
          <ul className="space-y-2 text-sm">
            {empresa.whatsapp && (
              <li>
                <a href={linkWhatsApp(empresa.whatsapp, 'Olá! Vim pelo site e gostaria de mais informações.')} target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-white">
                  <MessageCircle className="w-4 h-4 text-emerald-400" /> {formatarTelefone(empresa.whatsapp)}
                </a>
              </li>
            )}
            {empresa.instagram && (
              <li>
                <a href={`https://instagram.com/${empresa.instagram}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-white">
                  <AtSign className="w-4 h-4 text-pink-400" /> @{empresa.instagram}
                </a>
              </li>
            )}
            {empresa.endereco && (
              <li>
                <a href={empresa.mapsUrl || `https://www.google.com/maps/search/${encodeURIComponent(`${empresa.endereco} ${empresa.cidade}`)}`} target="_blank" rel="noreferrer" className="flex items-start gap-2 hover:text-white">
                  <MapPin className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <span>{empresa.endereco}{empresa.cidade && ` — ${empresa.cidade}`}</span>
                </a>
              </li>
            )}
            {!empresa.whatsapp && !empresa.instagram && !empresa.endereco && (
              <li className="text-slate-400">Fale com a gente pelo balcão ou reserve online.</li>
            )}
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <span>
            © {empresa.nome} ·{' '}
            <Link href="/privacidade" className="hover:text-slate-300">Privacidade</Link>
          </span>
          <Link href="/login" className="inline-flex items-center gap-1.5 hover:text-slate-300">
            <ShieldCheck className="w-3.5 h-3.5" /> Área da equipe
          </Link>
        </div>
      </div>
    </footer>
  );
}
