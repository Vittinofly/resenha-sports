'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Script from 'next/script';
import { Cookie } from 'lucide-react';
import { GA_ID, CHAVE_CONSENTIMENTO, registrarEvento } from '@/lib/analytics';

const semAssinatura = () => () => {};
function lerConsentimento() {
  try {
    return window.localStorage.getItem(CHAVE_CONSENTIMENTO) || '';
  } catch {
    return 'negado'; // sem armazenamento: não rastreia e não insiste com o aviso
  }
}

// Google Analytics 4 com consentimento (LGPD): nada é carregado antes do "Aceitar".
// Fora do ar sem NEXT_PUBLIC_GA_ID. O painel da equipe nunca é medido.
export default function Analytics() {
  const pathname = usePathname();
  const salvo = useSyncExternalStore(semAssinatura, lerConsentimento, () => 'pendente-servidor');
  const [escolha, setEscolha] = useState(null);
  const consentimento = escolha ?? salvo;

  // Navegação do Next não recarrega a página: registra cada troca de rota.
  // A primeira visita já é contada pelo gtag('config').
  const ultimaRota = useRef(null);
  useEffect(() => {
    if (ultimaRota.current !== null && ultimaRota.current !== pathname) {
      registrarEvento('page_view', { page_path: pathname, page_location: window.location.href });
    }
    ultimaRota.current = pathname;
  }, [pathname]);

  if (!GA_ID || pathname.startsWith('/admin') || pathname.startsWith('/login')) return null;

  const decidir = (valor) => {
    try {
      window.localStorage.setItem(CHAVE_CONSENTIMENTO, valor);
    } catch {
      // ignora
    }
    setEscolha(valor);
  };

  return (
    <>
      {consentimento === 'aceito' && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
          <Script id="ga-init" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;gtag('js',new Date());gtag('config','${GA_ID}',{anonymize_ip:true});`}
          </Script>
        </>
      )}
      {consentimento === '' && (
        <div role="dialog" aria-label="Aviso de cookies" className="fixed bottom-4 left-4 right-4 sm:left-auto sm:max-w-sm z-50 cartao p-4 shadow-2xl animate-entrar">
          <p className="text-sm text-slate-700 flex gap-2">
            <Cookie className="w-5 h-5 text-amber-600 shrink-0" />
            <span>
              Usamos cookies de medição (Google Analytics) para entender como o site é usado e melhorá-lo.{' '}
              <Link href="/privacidade" className="font-semibold underline">Saiba mais</Link>.
            </span>
          </p>
          <div className="flex gap-2 mt-3">
            <button type="button" onClick={() => decidir('negado')} className="btn-secundario flex-1 !py-2 !text-xs">Recusar</button>
            <button type="button" onClick={() => decidir('aceito')} className="btn-primario flex-1 !py-2 !text-xs">Aceitar</button>
          </div>
        </div>
      )}
    </>
  );
}
