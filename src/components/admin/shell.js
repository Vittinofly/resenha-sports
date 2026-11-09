'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, CalendarRange, ListChecks, Users, UtensilsCrossed, LogOut, Loader2, ExternalLink, KeyRound, Bell, BellOff } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { contarPendentes } from '@/lib/admin';
import { TIPOS_RESERVA } from '@/lib/reservas';
import { formatarData, hhmm } from '@/lib/formatadores';
import { useFeedback } from '@/components/feedback';
import Logo from '@/components/logo';

const TEMPO_INATIVIDADE_MS = 30 * 60 * 1000;
const INTERVALO_PENDENTES_MS = 60 * 1000;

const NAV = [
  { href: '/admin', label: 'Visão geral', icone: LayoutDashboard, exato: true },
  { href: '/admin/quadras', label: 'Agenda de quadras', icone: CalendarRange },
  { href: '/admin/reservas', label: 'Reservas', icone: ListChecks, badge: true },
  { href: '/admin/clientes', label: 'Clientes', icone: Users },
  { href: '/admin/cardapio', label: 'Cardápio', icone: UtensilsCrossed },
];

const CHAVE_ALERTAS = 'resenha:alertas';

function lerPreferenciaAlertas() {
  try {
    return typeof window !== 'undefined' && window.localStorage.getItem(CHAVE_ALERTAS) === '1';
  } catch {
    return false;
  }
}

function salvarPreferenciaAlertas(ligado) {
  try {
    window.localStorage.setItem(CHAVE_ALERTAS, ligado ? '1' : '0');
  } catch {
    // armazenamento indisponível
  }
}

function criarAudio() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    return Ctx ? new Ctx() : null;
  } catch {
    return null;
  }
}

// Dois bipes curtos gerados na hora (sem arquivo de áudio)
function tocarBipe(ref) {
  ref.current ??= criarAudio();
  const ctx = ref.current;
  if (!ctx) return;
  ctx.resume?.();
  [0, 0.18].forEach((atraso) => {
    const osc = ctx.createOscillator();
    const ganho = ctx.createGain();
    osc.frequency.value = 880;
    ganho.gain.setValueAtTime(0.15, ctx.currentTime + atraso);
    ganho.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + atraso + 0.15);
    osc.connect(ganho).connect(ctx.destination);
    osc.start(ctx.currentTime + atraso);
    osc.stop(ctx.currentTime + atraso + 0.16);
  });
}

const AdminContext = createContext({ pendentes: 0, atualizarPendentes: () => {}, usuario: null });
export const useAdmin = () => useContext(AdminContext);

export default function AdminShell({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useFeedback();
  const [usuario, setUsuario] = useState(null);
  const [verificando, setVerificando] = useState(true);
  const [pendentes, setPendentes] = useState(0);
  const pendentesAnteriores = useRef(null);
  const timerInatividade = useRef(null);
  const ultimaAtividade = useRef(0);
  const audio = useRef(null);
  const [alertasLigados, setAlertasLigados] = useState(lerPreferenciaAlertas);
  const [tempoReal, setTempoReal] = useState(false);

  const sair = useCallback(
    async (motivo) => {
      clearTimeout(timerInatividade.current);
      await supabase.auth.signOut();
      router.replace(motivo ? `/login?motivo=${motivo}` : '/login');
    },
    [router]
  );

  // Som + notificação do sistema (funciona com o painel aberto, inclusive em segundo plano)
  const alertar = useCallback(
    (titulo, corpo, tag) => {
      if (!alertasLigados) return;
      tocarBipe(audio);
      try {
        if ('Notification' in window && Notification.permission === 'granted' && document.hidden) {
          const n = new Notification(titulo, { body: corpo, tag, icon: '/icon' });
          n.onclick = () => {
            window.focus();
            router.push('/admin/reservas?status=pendente');
            n.close();
          };
        }
      } catch {
        // Alguns navegadores móveis só permitem notificação via service worker
      }
    },
    [alertasLigados, router]
  );

  const alternarAlertas = async () => {
    if (alertasLigados) {
      setAlertasLigados(false);
      salvarPreferenciaAlertas(false);
      return;
    }
    // O áudio só pode ser criado após um clique do usuário
    audio.current ??= criarAudio();
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission().catch(() => {});
    }
    setAlertasLigados(true);
    salvarPreferenciaAlertas(true);
    tocarBipe(audio);
    toast('Alertas ligados: você ouvirá um aviso a cada nova reserva.', 'info');
  };

  const atualizarPendentes = useCallback(async () => {
    const total = await contarPendentes();
    if (pendentesAnteriores.current !== null && total > pendentesAnteriores.current) {
      toast(`Nova solicitação de reserva! (${total} pendente${total > 1 ? 's' : ''})`, 'info');
    }
    pendentesAnteriores.current = total;
    setPendentes(total);
  }, [toast]);

  // Sessão
  useEffect(() => {
    let ativo = true;
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!ativo) return;
      if (!user) {
        router.replace('/login');
        return;
      }
      // Só quem está na tabela `equipe` acessa o painel (ver supabase/seguranca.sql).
      // Se a tabela ainda não existe (script não rodado), a consulta dá erro e o
      // comportamento antigo é mantido.
      const { data: membro, error } = await supabase.from('equipe').select('papel').eq('user_id', user.id).maybeSingle();
      if (!ativo) return;
      // Erro de rede não derruba a sessão: os dados continuam protegidos pelo RLS do banco.
      if (!error && !membro) {
        await supabase.auth.signOut();
        router.replace('/login?motivo=sem-acesso');
        return;
      }
      setUsuario({ ...user, papel: membro?.papel || 'admin' });
      setVerificando(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((evento, sessao) => {
      if (evento === 'SIGNED_OUT' || !sessao) router.replace('/login');
    });

    return () => {
      ativo = false;
      listener.subscription.unsubscribe();
    };
  }, [router]);

  // Logout automático após 30 min sem interação
  useEffect(() => {
    if (!usuario) return;
    const reiniciar = () => {
      const agora = Date.now();
      if (agora - ultimaAtividade.current < 15 * 1000) return; // throttle
      ultimaAtividade.current = agora;
      clearTimeout(timerInatividade.current);
      timerInatividade.current = setTimeout(() => sair('inatividade'), TEMPO_INATIVIDADE_MS);
    };
    const eventos = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    reiniciar();
    eventos.forEach((ev) => window.addEventListener(ev, reiniciar, { passive: true }));
    return () => {
      eventos.forEach((ev) => window.removeEventListener(ev, reiniciar));
      clearTimeout(timerInatividade.current);
    };
  }, [usuario, sair]);

  // Contador de pendentes (polling + ao voltar para a aba)
  useEffect(() => {
    if (!usuario) return;
    const tick = () => atualizarPendentes();
    tick();
    const id = setInterval(tick, INTERVALO_PENDENTES_MS);
    window.addEventListener('focus', tick);
    return () => {
      clearInterval(id);
      window.removeEventListener('focus', tick);
    };
  }, [usuario, atualizarPendentes]);

  // Tempo real: o banco avisa na hora quando entra uma reserva (Supabase Realtime).
  // O polling acima continua como reserva caso a conexão caia.
  useEffect(() => {
    if (!usuario) return;
    const canal = supabase.channel('painel-reservas');
    for (const [tipo, { tabela, label }] of Object.entries(TIPOS_RESERVA)) {
      canal.on('postgres_changes', { event: 'INSERT', schema: 'public', table: tabela }, ({ new: linha }) => {
        if (linha?.status !== 'pendente') return; // agendamentos de balcão não alertam
        atualizarPendentes();
        alertar(`Nova reserva: ${label}`, `${String(linha.cliente_nome || '').split('|')[0]} · ${formatarData(linha.data_reserva)}${linha.horario_inicio ? ` ${hhmm(linha.horario_inicio)}` : ''}`, `${tipo}-${linha.id}`);
      });
    }
    canal.subscribe((status) => setTempoReal(status === 'SUBSCRIBED'));
    return () => {
      supabase.removeChannel(canal);
    };
  }, [usuario, atualizarPendentes, alertar]);

  // Título da aba com o número de pendentes
  useEffect(() => {
    const base = 'Painel | Resenha';
    document.title = pendentes > 0 ? `(${pendentes}) ${base}` : base;
  }, [pendentes]);

  if (verificando) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-slate-100">
        <Loader2 className="w-8 h-8 text-red-600 animate-spin" />
        <span className="text-sm font-semibold text-slate-600">Verificando acesso...</span>
      </div>
    );
  }

  const ativo = (item) => (item.exato ? pathname === item.href : pathname.startsWith(item.href));

  return (
    <AdminContext.Provider value={{ pendentes, atualizarPendentes, usuario }}>
      <div className="min-h-screen bg-slate-100 lg:grid lg:grid-cols-[248px_1fr]">
        {/* SIDEBAR (desktop) / TOPO (mobile) */}
        <aside className="bg-slate-950 text-slate-300 lg:min-h-screen lg:sticky lg:top-0 lg:h-screen flex flex-col">
          <div className="px-4 py-4 flex items-center justify-between lg:block">
            <Link href="/admin"><Logo claro subtitulo="Painel da equipe" /></Link>
            <span className="flex lg:hidden">
              <Link href="/login/nova-senha" className="p-2 rounded-lg text-slate-400 hover:text-white" aria-label="Alterar senha">
                <KeyRound className="w-5 h-5" />
              </Link>
              <button onClick={() => sair()} className="p-2 rounded-lg text-slate-400 hover:text-white" aria-label="Sair">
                <LogOut className="w-5 h-5" />
              </button>
            </span>
          </div>

          <nav className="flex lg:flex-col gap-1 px-2 pb-2 lg:px-3 overflow-x-auto [scrollbar-width:none]" aria-label="Admin">
            {NAV.map((item) => {
              const Icone = item.icone;
              const selecionado = ativo(item);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={selecionado ? 'page' : undefined}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition ${
                    selecionado ? 'bg-white/10 text-white' : 'hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Icone className={`w-4 h-4 ${selecionado ? 'text-red-500' : ''}`} />
                  <span className="flex-1">{item.label}</span>
                  {item.badge && pendentes > 0 && (
                    <span className="bg-red-600 text-white text-[10px] font-black rounded-full px-1.5 min-w-5 text-center leading-5">{pendentes}</span>
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="px-2 lg:px-3 pb-2 lg:pt-2">
            <button
              onClick={alternarAlertas}
              aria-pressed={alertasLigados}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold transition ${alertasLigados ? 'bg-emerald-500/10 text-emerald-300' : 'hover:bg-white/5 hover:text-white'}`}
            >
              {alertasLigados ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
              <span className="flex-1 text-left">{alertasLigados ? 'Alertas ligados' : 'Ligar alertas sonoros'}</span>
              <span className={`w-2 h-2 rounded-full ${tempoReal ? 'bg-emerald-400' : 'bg-slate-600'}`} title={tempoReal ? 'Conectado em tempo real' : 'Sem tempo real (atualiza a cada minuto)'} />
            </button>
          </div>

          <div className="hidden lg:block mt-auto p-3 space-y-1 border-t border-white/10">
            <Link href="/" target="_blank" className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm hover:bg-white/5 hover:text-white">
              <ExternalLink className="w-4 h-4" /> Ver site
            </Link>
            <Link href="/login/nova-senha" className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm hover:bg-white/5 hover:text-white">
              <KeyRound className="w-4 h-4" /> Alterar senha
            </Link>
            <button onClick={() => sair()} className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm hover:bg-white/5 hover:text-white">
              <LogOut className="w-4 h-4" /> Sair
            </button>
            <p className="px-3 pt-2 text-[11px] text-slate-500 truncate" title={usuario?.email}>{usuario?.email}</p>
          </div>
        </aside>

        <main className="min-w-0 p-4 sm:p-6 lg:p-8 space-y-6">{children}</main>
      </div>
    </AdminContext.Provider>
  );
}
