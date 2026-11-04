'use client';

import { createContext, useCallback, useContext, useRef, useState } from 'react';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';
import Modal from '@/components/modal';

// Substitui alert()/confirm() nativos por toasts e um diálogo de confirmação
// com a identidade visual do Resenha.
const FeedbackContext = createContext(null);

const ICONES = {
  sucesso: <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />,
  erro: <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />,
  info: <Info className="w-5 h-5 text-sky-500 shrink-0" />,
};

export function FeedbackProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [confirmacao, setConfirmacao] = useState(null);
  const proximoId = useRef(0);

  const fecharToast = useCallback((id) => {
    setToasts((atual) => atual.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (mensagem, tipo = 'sucesso') => {
      const id = ++proximoId.current;
      setToasts((atual) => [...atual.slice(-3), { id, mensagem, tipo }]);
      setTimeout(() => fecharToast(id), tipo === 'erro' ? 7000 : 4000);
    },
    [fecharToast]
  );

  const confirmar = useCallback(
    ({ titulo, mensagem, textoConfirmar = 'Confirmar', perigo = false }) =>
      new Promise((resolve) => {
        setConfirmacao({ titulo, mensagem, textoConfirmar, perigo, resolve });
      }),
    []
  );

  const responder = (valor) => {
    confirmacao?.resolve(valor);
    setConfirmacao(null);
  };

  return (
    <FeedbackContext.Provider value={{ toast, confirmar }}>
      {children}

      <div aria-live="polite" className="fixed z-[60] bottom-4 left-4 right-4 sm:left-auto sm:w-96 flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            role={t.tipo === 'erro' ? 'alert' : 'status'}
            className="pointer-events-auto animate-entrar bg-slate-900 text-white rounded-2xl shadow-2xl px-4 py-3 flex items-start gap-3 text-sm font-semibold"
          >
            {ICONES[t.tipo]}
            <span className="flex-1 leading-snug">{t.mensagem}</span>
            <button onClick={() => fecharToast(t.id)} className="text-slate-400 hover:text-white" aria-label="Fechar aviso">
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      <Modal aberto={!!confirmacao} aoFechar={() => responder(false)} titulo={confirmacao?.titulo} largura="max-w-sm">
        <p className="text-sm text-slate-600">{confirmacao?.mensagem}</p>
        <div className="flex justify-end gap-2 pt-5">
          <button onClick={() => responder(false)} className="btn-secundario">
            Voltar
          </button>
          <button onClick={() => responder(true)} className={confirmacao?.perigo ? 'btn-perigo' : 'btn-primario'} autoFocus>
            {confirmacao?.textoConfirmar}
          </button>
        </div>
      </Modal>
    </FeedbackContext.Provider>
  );
}

export function useFeedback() {
  const ctx = useContext(FeedbackContext);
  if (!ctx) throw new Error('useFeedback precisa estar dentro de <FeedbackProvider>');
  return ctx;
}
