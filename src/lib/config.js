// Constantes que valem para todas as empresas. O que muda por empresa (marca,
// quadras, horários, regras de sinal) fica na tabela `empresas` — ver lib/empresa.js.

export const DURACOES = [1, 2, 3, 4];

// --- STATUS DE RESERVA ---
export const STATUS = {
  pendente: { label: 'Pendente', classe: 'bg-amber-100 text-amber-900 border-amber-200' },
  agendada: { label: 'Agendada', classe: 'bg-amber-100 text-amber-900 border-amber-200' },
  confirmado: { label: 'Confirmado', classe: 'bg-emerald-100 text-emerald-900 border-emerald-200' },
  concluido: { label: 'Concluído', classe: 'bg-slate-100 text-slate-700 border-slate-200' },
  cancelado: { label: 'Cancelado', classe: 'bg-rose-100 text-rose-800 border-rose-200' },
};

export const STATUS_ATIVOS = ['pendente', 'agendada', 'confirmado'];

