'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, Download, Loader2, Megaphone, MessageCircle, Search, Send, Star, UserPlus, UserX, Users } from 'lucide-react';
import { useHoje } from '@/lib/hooks';
import { buscarReservas, baixarCSV } from '@/lib/admin';
import { STATUS_ATIVOS } from '@/lib/config';
import { useEmpresa } from '@/components/empresa-contexto';
import { TIPOS_RESERVA } from '@/lib/reservas';
import { apenasDigitos, formatarData, formatarTelefone, linkWhatsApp, primeiroNome, rotuloDia, somarDias } from '@/lib/formatadores';
import { normalizarBusca } from '@/lib/cardapio';
import { useFeedback } from '@/components/feedback';
import { CabecalhoPagina, IconeTipo, Indicador, Segmentado, Vazio } from '@/components/admin/ui';

const DIAS_SUMIDO = 30;

function modelosCampanha(empresa) {
  const { nomeCurto, siteUrl, modulos, reservaPrincipal } = empresa;
  const linkReserva = `${siteUrl}${reservaPrincipal ? `/reservas/${reservaPrincipal}` : ''}`;
  const maiorQuiosque = Math.max(0, ...empresa.quiosques.map((q) => q.capacidade));
  return [
    {
      nome: 'Sentimos sua falta',
      texto: `Oi, {nome}! Aqui é do *${nomeCurto}* 👋\nFaz tempo que você não aparece por aqui! Que tal reservar um horário essa semana? Leva 1 minuto: ${linkReserva}`,
    },
    {
      nome: 'Convite para evento',
      texto: `Fala, {nome}! Vai rolar evento especial no *${nomeCurto}* e você não pode ficar de fora 🎉\nChama a galera e garanta seu lugar: ${linkReserva}`,
    },
    ...(modulos.quiosques
      ? [{
          nome: 'Festa no quiosque',
          texto: `Oi, {nome}! Tem aniversário ou confraternização chegando? 🎂\nNossos quiosques recebem até ${maiorQuiosque} pessoas. Confira: ${siteUrl}/reservas/quiosques`,
        }]
      : []),
  ];
}

// Agrupa reservas por WhatsApp para montar o perfil de cada cliente
function montarClientes(reservas, hoje) {
  const mapa = new Map();
  for (const r of reservas) {
    const fone = apenasDigitos(r.cliente_whatsapp).replace(/^55(?=\d{10,11}$)/, '');
    if (!fone) continue;
    if (!mapa.has(fone)) {
      mapa.set(fone, { whatsapp: fone, nome: r.nome, total: 0, cancelados: 0, tipos: new Set(), primeira: null, ultima: null, proxima: null, ultimaData: '' });
    }
    const c = mapa.get(fone);
    if (r.data_reserva >= c.ultimaData) {
      c.ultimaData = r.data_reserva;
      c.nome = r.nome || c.nome;
    }
    if (r.status === 'cancelado') {
      c.cancelados++;
      continue;
    }
    c.total++;
    c.tipos.add(r.tipo);
    if (!c.primeira || r.data_reserva < c.primeira) c.primeira = r.data_reserva;
    if (r.data_reserva <= hoje && (!c.ultima || r.data_reserva > c.ultima)) c.ultima = r.data_reserva;
    if (r.data_reserva >= hoje && STATUS_ATIVOS.includes(r.status) && (!c.proxima || r.data_reserva < c.proxima)) c.proxima = r.data_reserva;
  }
  return [...mapa.values()].filter((c) => c.total > 0 || c.cancelados > 0);
}

export default function AdminClientesPage() {
  const hoje = useHoje();
  const { toast } = useFeedback();
  const empresa = useEmpresa();
  const modelos = useMemo(() => modelosCampanha(empresa), [empresa]);
  const [reservas, setReservas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState('');
  const [segmento, setSegmento] = useState('todos');
  const [ordem, setOrdem] = useState('ultima');
  const [mensagem, setMensagem] = useState(() => modelosCampanha(empresa)[0].texto);
  const [enviados, setEnviados] = useState(() => new Set());

  const carregar = useCallback(async () => {
    setCarregando(true);
    const { reservas: lista, erro } = await buscarReservas({ empresaId: empresa.id, limite: 2000 });
    if (erro) toast('Erro ao carregar histórico: ' + erro.message, 'erro');
    setReservas(lista);
    setCarregando(false);
  }, [toast, empresa.id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga inicial de dados
    carregar();
  }, [carregar]);

  const clientes = useMemo(() => (hoje ? montarClientes(reservas, hoje) : []), [reservas, hoje]);
  const limiteSumido = hoje ? somarDias(hoje, -DIAS_SUMIDO) : '';

  const SEGMENTOS = {
    todos: { label: 'Todos', testa: () => true },
    frequentes: { label: 'Frequentes (3+)', testa: (c) => c.total >= 3 },
    novos: { label: `Novos (${DIAS_SUMIDO} dias)`, testa: (c) => c.primeira && c.primeira >= limiteSumido },
    sumidos: { label: `Sumidos (+${DIAS_SUMIDO} dias)`, testa: (c) => c.ultima && c.ultima < limiteSumido && !c.proxima },
    agendados: { label: 'Com reserva futura', testa: (c) => !!c.proxima },
  };

  const termo = normalizarBusca(busca);
  const lista = clientes
    .filter(SEGMENTOS[segmento].testa)
    .filter((c) => !termo || normalizarBusca(c.nome).includes(termo) || c.whatsapp.includes(termo.replace(/\D/g, '') || '#'))
    .sort((a, b) => (ordem === 'total' ? b.total - a.total : ordem === 'nome' ? a.nome.localeCompare(b.nome) : (b.ultimaData || '').localeCompare(a.ultimaData || '')));

  const personalizar = (c) => mensagem.replaceAll('{nome}', primeiroNome(c.nome));

  const marcarEnviado = (fone) => setEnviados((s) => new Set(s).add(fone));

  const exportar = () =>
    baixarCSV(
      `clientes-${hoje}.csv`,
      ['Nome', 'WhatsApp', 'Reservas', 'Cancelamentos', 'Serviços', 'Primeira', 'Última visita', 'Próxima reserva'],
      lista.map((c) => [
        c.nome,
        formatarTelefone(c.whatsapp),
        c.total,
        c.cancelados,
        [...c.tipos].map((t) => TIPOS_RESERVA[t].plural).join(', '),
        formatarData(c.primeira),
        formatarData(c.ultima),
        formatarData(c.proxima),
      ])
    );

  const contagem = (chave) => clientes.filter(SEGMENTOS[chave].testa).length;

  return (
    <>
      <CabecalhoPagina titulo="Clientes" descricao="Base montada automaticamente a partir das reservas. Use para fidelizar e trazer clientes de volta.">
        <button onClick={exportar} disabled={!lista.length} className="btn-secundario">
          <Download className="w-4 h-4" /> Exportar CSV
        </button>
      </CabecalhoPagina>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <Indicador rotulo="Clientes" valor={carregando ? '–' : clientes.length} icone={Users} />
        <Indicador rotulo="Frequentes" valor={carregando ? '–' : contagem('frequentes')} detalhe="3 ou mais reservas" icone={Star} tom="amber" />
        <Indicador rotulo="Novos" valor={carregando ? '–' : contagem('novos')} detalhe={`nos últimos ${DIAS_SUMIDO} dias`} icone={UserPlus} tom="emerald" />
        <Indicador rotulo="Sumidos" valor={carregando ? '–' : contagem('sumidos')} detalhe="oportunidade de reativação" icone={UserX} tom="red" />
      </div>

      {/* CAMPANHA */}
      <section className="cartao p-5 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <h2 className="font-display font-bold uppercase text-xl text-slate-900 flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-red-600" /> Campanha pelo WhatsApp
          </h2>
          <div className="flex flex-wrap gap-2">
            {modelos.map((m) => (
              <button key={m.nome} onClick={() => setMensagem(m.texto)} className={`chip ${mensagem === m.texto ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}>
                {m.nome}
              </button>
            ))}
          </div>
        </div>
        <textarea value={mensagem} onChange={(e) => setMensagem(e.target.value)} rows={3} className="input resize-y" aria-label="Mensagem da campanha" />
        <p className="text-xs text-slate-500">
          Use <code className="bg-slate-100 px-1 rounded">{'{nome}'}</code> para personalizar. Filtre o segmento abaixo e clique em <strong>Enviar</strong> em cada cliente — o WhatsApp abre com a mensagem pronta.
          {enviados.size > 0 && <strong className="text-emerald-700"> {enviados.size} enviada(s) nesta sessão.</strong>}
        </p>
      </section>

      {/* FILTROS */}
      <div className="flex flex-col xl:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input type="search" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por nome ou telefone..." className="input pl-10 bg-white" aria-label="Buscar clientes" />
        </div>
        <Segmentado rotulo="Segmento" valor={segmento} aoMudar={setSegmento} opcoes={Object.entries(SEGMENTOS).map(([valor, s]) => ({ valor, label: s.label }))} />
        <select value={ordem} onChange={(e) => setOrdem(e.target.value)} className="input xl:w-48 bg-white" aria-label="Ordenar por">
          <option value="ultima">Mais recentes</option>
          <option value="total">Mais reservas</option>
          <option value="nome">Nome (A–Z)</option>
        </select>
      </div>

      {/* LISTA */}
      <section className="cartao overflow-hidden">
        {carregando ? (
          <div className="p-12 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
        ) : lista.length === 0 ? (
          <Vazio icone={Users} titulo="Nenhum cliente neste filtro" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="text-left font-bold px-4 py-3">Cliente</th>
                  <th className="text-left font-bold px-4 py-3 hidden md:table-cell">Serviços</th>
                  <th className="text-right font-bold px-4 py-3">Reservas</th>
                  <th className="text-left font-bold px-4 py-3 hidden sm:table-cell">Última visita</th>
                  <th className="text-left font-bold px-4 py-3 hidden lg:table-cell">Próxima</th>
                  <th className="px-4 py-3"><span className="sr-only">Ações</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {lista.map((c) => {
                  const enviado = enviados.has(c.whatsapp);
                  return (
                    <tr key={c.whatsapp} className="hover:bg-slate-50/60">
                      <td className="px-4 py-3">
                        <p className="font-bold text-slate-900 flex items-center gap-1.5">
                          {c.nome}
                          {c.total >= 3 && <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" aria-label="Cliente frequente" />}
                        </p>
                        <p className="text-xs text-slate-500">{formatarTelefone(c.whatsapp)}</p>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="flex gap-1.5 text-slate-500">
                          {[...c.tipos].map((t) => (
                            <span key={t} title={TIPOS_RESERVA[t].plural}><IconeTipo tipo={t} /></span>
                          ))}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-bold tabular-nums">
                        {c.total}
                        {c.cancelados > 0 && <span className="block text-[10px] font-semibold text-red-500">{c.cancelados} cancel.</span>}
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell text-slate-600">{c.ultima ? rotuloDia(c.ultima, hoje) : '—'}</td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        {c.proxima ? <span className="chip bg-emerald-50 text-emerald-800 border-emerald-200">{rotuloDia(c.proxima, hoje)}</span> : <span className="text-slate-400">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <a href={linkWhatsApp(c.whatsapp)} target="_blank" rel="noreferrer" className="p-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200" aria-label={`Abrir conversa com ${c.nome}`}>
                            <MessageCircle className="w-4 h-4" />
                          </a>
                          <a
                            href={linkWhatsApp(c.whatsapp, personalizar(c))}
                            target="_blank"
                            rel="noreferrer"
                            onClick={() => marcarEnviado(c.whatsapp)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${enviado ? 'bg-emerald-100 text-emerald-800' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}
                          >
                            {enviado ? <Check className="w-3.5 h-3.5" /> : <Send className="w-3.5 h-3.5" />} {enviado ? 'Enviado' : 'Enviar'}
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
