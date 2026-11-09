'use client';

import { useEffect, useState } from 'react';
import { Check, Copy, QrCode } from 'lucide-react';
import QRCode from 'qrcode';
import { SINAL } from '@/lib/config';
import { gerarPixCopiaECola } from '@/lib/pix';
import { formatarMoeda } from '@/lib/formatadores';

// Bloco de pagamento do sinal: QR Code + "copia e cola". `txid` identifica a
// reserva no extrato (usamos o início do token do cliente).
export default function PagamentoPix({ valor, txid }) {
  const codigo = gerarPixCopiaECola({ valor, txid: txid || '***' });
  const [qr, setQr] = useState('');
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    if (!codigo) return;
    let ativo = true;
    QRCode.toDataURL(codigo, { width: 240, margin: 1, errorCorrectionLevel: 'M' })
      .then((url) => ativo && setQr(url))
      .catch(() => {});
    return () => {
      ativo = false;
    };
  }, [codigo]);

  if (!codigo) return null;

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(codigo);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 3000);
    } catch {
      // Sem permissão de área de transferência: o campo abaixo permite copiar manualmente
    }
  };

  return (
    <section className="mt-6 text-left rounded-2xl border-2 border-amber-300 bg-amber-50 p-4 sm:p-5" aria-labelledby="titulo-sinal">
      <h3 id="titulo-sinal" className="font-display font-bold uppercase text-lg text-slate-900 flex items-center gap-2">
        <QrCode className="w-5 h-5 text-amber-600" /> Sinal de {formatarMoeda(valor)} via Pix
      </h3>
      <p className="text-xs text-slate-700 mt-1">
        Para garantir sua reserva, pague o sinal em até {SINAL.prazoHoras}h e envie o comprovante pelo WhatsApp. O valor é abatido da conta.
      </p>
      <div className="mt-4 flex flex-col sm:flex-row gap-4 items-center">
        {qr ? (
          // eslint-disable-next-line @next/next/no-img-element -- QR gerado localmente (data URL)
          <img src={qr} alt="QR Code Pix do sinal" width={160} height={160} className="w-40 h-40 rounded-xl bg-white p-1.5 border border-amber-200" />
        ) : (
          <div className="w-40 h-40 rounded-xl bg-white/60 animate-pulse" />
        )}
        <div className="flex-1 min-w-0 w-full space-y-2">
          <label htmlFor="pix-copia-cola" className="rotulo">Pix copia e cola</label>
          <textarea id="pix-copia-cola" readOnly value={codigo} rows={3} onFocus={(e) => e.target.select()} className="input !text-[11px] font-mono resize-none break-all" />
          <button type="button" onClick={copiar} className="btn-escuro w-full !py-2.5">
            {copiado ? <><Check className="w-4 h-4 text-emerald-400" /> Copiado!</> : <><Copy className="w-4 h-4" /> Copiar código Pix</>}
          </button>
        </div>
      </div>
    </section>
  );
}
