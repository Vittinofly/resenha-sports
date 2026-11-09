'use client';

import { useId, useRef, useState } from 'react';
import { ImagePlus, Loader2, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useFeedback } from '@/components/feedback';

const BUCKET = 'cardapio';
const LADO_MAXIMO = 1000;

// Reduz a foto (celular tira fotos de 4–12 MB) para no máx. 1000px em WebP.
async function otimizarImagem(arquivo) {
  const bitmap = await createImageBitmap(arquivo);
  const escala = Math.min(1, LADO_MAXIMO / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * escala);
  canvas.height = Math.round(bitmap.height * escala);
  canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close?.();
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('conversão'))), 'image/webp', 0.82));
}

// Foto de item do cardápio: envio para o Supabase Storage ou link https.
export default function CampoFoto({ valor, aoMudar }) {
  const { toast } = useFeedback();
  const idUrl = useId();
  const entrada = useRef(null);
  const [enviando, setEnviando] = useState(false);

  const enviar = async (e) => {
    const arquivo = e.target.files?.[0];
    e.target.value = '';
    if (!arquivo) return;
    if (!arquivo.type.startsWith('image/')) return toast('Escolha um arquivo de imagem.', 'erro');

    setEnviando(true);
    try {
      const blob = await otimizarImagem(arquivo);
      const caminho = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.webp`;
      const { error } = await supabase.storage.from(BUCKET).upload(caminho, blob, { contentType: 'image/webp', cacheControl: '31536000' });
      if (error) throw error;
      aoMudar(supabase.storage.from(BUCKET).getPublicUrl(caminho).data.publicUrl);
      toast('Foto enviada. Clique em Salvar para aplicar.');
    } catch (erro) {
      const semBucket = /bucket not found/i.test(erro?.message || '');
      toast(semBucket ? 'Armazenamento de fotos não configurado: rode o supabase/seguranca.sql.' : 'Não foi possível enviar a foto.', 'erro');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div>
      <span className="rotulo">Foto</span>
      <div className="flex gap-3 items-start">
        {valor ? (
          // eslint-disable-next-line @next/next/no-img-element -- prévia de URL arbitrária
          <img src={valor} alt="" className="w-20 h-20 rounded-2xl object-cover bg-slate-100 border border-slate-200 shrink-0" />
        ) : (
          <div className="w-20 h-20 rounded-2xl bg-slate-100 border border-dashed border-slate-300 shrink-0" />
        )}
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex gap-2">
            <button type="button" onClick={() => entrada.current?.click()} disabled={enviando} className="btn-secundario !py-2 !text-xs">
              {enviando ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImagePlus className="w-3.5 h-3.5" />} {valor ? 'Trocar foto' : 'Enviar foto'}
            </button>
            {valor && (
              <button type="button" onClick={() => aoMudar('')} className="btn-secundario !py-2 !text-xs" aria-label="Remover foto">
                <Trash2 className="w-3.5 h-3.5 text-red-600" />
              </button>
            )}
          </div>
          <input ref={entrada} type="file" accept="image/*" onChange={enviar} className="hidden" />
          <label htmlFor={idUrl} className="sr-only">Ou cole o link da foto</label>
          <input id={idUrl} type="url" pattern="https://.*" title="Use um link que comece com https://" value={valor} onChange={(e) => aoMudar(e.target.value)} className="input !text-xs" placeholder="ou cole um link https://..." />
        </div>
      </div>
    </div>
  );
}
