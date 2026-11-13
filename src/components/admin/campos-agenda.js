'use client';

import { DURACOES } from '@/lib/config';
import { useEmpresa } from '@/components/empresa-contexto';

// Campos de "quando e onde" de uma reserva, por tipo. Usados no agendamento de
// balcão (nova reserva) e para remarcar uma reserva existente. As regras ficam em lib/agenda.js.
export { valoresAgenda, prepararAgenda } from '@/lib/agenda';

// Garante que o valor atual apareça no <select> mesmo fora da lista padrão
const comAtual = (lista, atual) => (atual && !lista.includes(atual) ? [...lista, atual].sort() : lista);

export default function CamposAgenda({ tipo, valores, aoMudar, comEvento = true, idPrefixo = 'ag' }) {
  const { quadras, quiosques, horariosQuadra, horariosMesas, tiposEvento } = useEmpresa();
  const mudar = (campo) => (e) => aoMudar({ ...valores, [campo]: campo === 'duracao' ? Number(e.target.value) : e.target.value });
  const id = (campo) => `${idPrefixo}-${campo}`;
  const quiosque = quiosques.find((q) => q.nome === valores.quiosque_nome);
  const acimaCapacidade = tipo === 'quiosques' && quiosque && Number(valores.pessoas) > quiosque.capacidade;

  return (
    <div className="grid grid-cols-2 gap-3">
      {tipo === 'quadras' && (
        <div className="col-span-2">
          <label htmlFor={id('quadra')} className="rotulo">Quadra</label>
          <select id={id('quadra')} value={valores.quadra_nome} onChange={mudar('quadra_nome')} className="input">
            {comAtual(quadras.map((q) => q.nome), valores.quadra_nome).map((nome) => {
              const q = quadras.find((x) => x.nome === nome);
              return <option key={nome} value={nome}>{q ? `${q.curto} — ${q.esportes}` : nome}</option>;
            })}
          </select>
        </div>
      )}

      {tipo === 'quiosques' && (
        <div className="col-span-2">
          <label htmlFor={id('quiosque')} className="rotulo">Quiosque</label>
          <select id={id('quiosque')} value={valores.quiosque_nome} onChange={mudar('quiosque_nome')} className="input">
            {comAtual(quiosques.map((q) => q.nome), valores.quiosque_nome).map((nome) => <option key={nome} value={nome}>{nome}</option>)}
          </select>
        </div>
      )}

      <div>
        <label htmlFor={id('data')} className="rotulo">Data</label>
        <input id={id('data')} type="date" required value={valores.data_reserva} onChange={mudar('data_reserva')} className="input" />
      </div>

      {tipo !== 'quiosques' && (
        <div>
          <label htmlFor={id('inicio')} className="rotulo">{tipo === 'mesas' ? 'Chegada' : 'Início'}</label>
          <select id={id('inicio')} value={valores.inicio} onChange={mudar('inicio')} className="input">
            {comAtual(tipo === 'mesas' ? horariosMesas : horariosQuadra, valores.inicio).map((h) => <option key={h}>{h}</option>)}
          </select>
        </div>
      )}

      {tipo === 'quadras' && (
        <div className="col-span-2">
          <label htmlFor={id('duracao')} className="rotulo">Duração</label>
          <select id={id('duracao')} value={valores.duracao} onChange={mudar('duracao')} className="input">
            {[...new Set([...DURACOES, valores.duracao])].sort((a, b) => a - b).map((d) => (
              <option key={d} value={d}>{d} hora{d > 1 ? 's' : ''}</option>
            ))}
          </select>
        </div>
      )}

      {tipo !== 'quadras' && (
        <div>
          <label htmlFor={id('pessoas')} className="rotulo">{tipo === 'quiosques' ? 'Convidados' : 'Pessoas'}</label>
          <input
            id={id('pessoas')}
            type="text"
            inputMode="numeric"
            required
            value={valores.pessoas}
            onChange={(e) => aoMudar({ ...valores, pessoas: e.target.value.replace(/\D/g, '').slice(0, 3) })}
            className={`input ${acimaCapacidade ? 'ring-2 ring-amber-400' : ''}`}
          />
          {acimaCapacidade && <p className="text-[11px] text-amber-700 font-semibold mt-1">Acima da capacidade ({quiosque.capacidade}).</p>}
        </div>
      )}

      {tipo === 'quiosques' && comEvento && (
        <div className="col-span-2">
          <label htmlFor={id('evento')} className="rotulo">Tipo de evento</label>
          <select id={id('evento')} value={valores.evento} onChange={mudar('evento')} className="input">
            {comAtual(tiposEvento, valores.evento).map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>
      )}
    </div>
  );
}
