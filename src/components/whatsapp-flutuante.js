'use client';

import { MessageCircle } from 'lucide-react';
import { useEmpresa, useCaminhoAtual } from '@/components/empresa-contexto';
import { linkWhatsApp } from '@/lib/formatadores';

export default function WhatsAppFlutuante() {
  const empresa = useEmpresa();
  const pathname = useCaminhoAtual();
  if (!empresa.whatsapp || pathname.startsWith('/admin') || pathname.startsWith('/login')) return null;

  return (
    <a
      href={linkWhatsApp(empresa.whatsapp, `Olá! Vim pelo site do ${empresa.nomeCurto} e gostaria de mais informações.`)}
      target="_blank"
      rel="noreferrer"
      aria-label={`Falar com ${empresa.nomeCurto} no WhatsApp`}
      className="fixed bottom-5 right-5 z-30 flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-full shadow-xl shadow-emerald-900/20 pl-4 pr-5 py-3 transition hover:-translate-y-0.5"
    >
      <MessageCircle className="w-5 h-5" />
      <span className="text-sm hidden sm:inline">Fale conosco</span>
    </a>
  );
}
