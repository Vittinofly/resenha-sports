'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { NOMES_CORES, PALETAS } from '@/lib/empresa';
import { configParaFormulario, formularioParaLinha, gerarSlug, validarEndereco } from '@/lib/empresa-form';
import CampoFoto from '@/components/admin/campo-foto';

function Secao({ titulo, descricao, children }) {
  return (
    <section className="cartao p-5 sm:p-6 space-y-4">
      <div>
        <h2 className="font-display font-bold uppercase text-xl text-slate-900">{titulo}</h2>
        {descricao && <p className="text-xs text-slate-500 mt-0.5">{descricao}</p>}
      </div>
      {children}
    </section>
  );
}

// Formulário único da empresa: cadastro e edição pelo super-usuário
// (`comEndereco`) e configurações pelo administrador da própria empresa.
// `aoSalvar({ linha, endereco })` faz a gravação; o retorno é ignorado.
export default function FormularioEmpresa({ inicial, comEndereco = false, raiz = '', aoSalvar, textoBotao = 'Salvar alterações', aoErro }) {
  const [f, setF] = useState(() => configParaFormulario(inicial));
  const [slugTocado, setSlugTocado] = useState(!!inicial?.slug);
  const [salvando, setSalvando] = useState(false);

  const mudar = (campo, valor) => setF((a) => ({ ...a, [campo]: valor }));

  const entrada = (campo, rotulo, props = {}) => (
    <div className={props.largo ? 'sm:col-span-2' : ''}>
      <label htmlFor={`e-${campo}`} className="rotulo">{rotulo}</label>
      <input id={`e-${campo}`} value={f[campo]} onChange={(e) => mudar(campo, e.target.value)} placeholder={props.placeholder} type={props.type || 'text'} inputMode={props.inputMode} className="input" />
    </div>
  );

  const area = (campo, rotulo, ajuda, linhas = 4) => (
    <div className="sm:col-span-2">
      <label htmlFor={`e-${campo}`} className="rotulo">{rotulo}</label>
      <textarea id={`e-${campo}`} rows={linhas} value={f[campo]} onChange={(e) => mudar(campo, e.target.value)} className="input font-mono !text-xs" />
      {ajuda && <p className="text-[11px] text-slate-500 mt-1">{ajuda}</p>}
    </div>
  );

  const caixa = (campo, rotulo) => (
    <label className="flex items-center gap-2 text-sm font-semibold text-slate-800">
      <input type="checkbox" checked={f[campo]} onChange={(e) => mudar(campo, e.target.checked)} className="w-4 h-4 accent-red-600" /> {rotulo}
    </label>
  );

  const enviar = async (e) => {
    e.preventDefault();
    const { linha, erro } = formularioParaLinha(f, inicial?.config || {});
    if (erro) return aoErro(erro);
    let endereco;
    if (comEndereco) {
      const r = validarEndereco(f);
      if (r.erro) return aoErro(r.erro);
      endereco = r.campos;
    }
    setSalvando(true);
    await aoSalvar({ linha, endereco });
    setSalvando(false);
  };

  return (
    <form onSubmit={enviar} className="space-y-4">
      <Secao titulo="Marca">
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <label htmlFor="e-nome" className="rotulo">Nome completo *</label>
            <input
              id="e-nome"
              required
              value={f.nome}
              onChange={(e) => setF((a) => ({ ...a, nome: e.target.value, ...(comEndereco && !slugTocado && { slug: gerarSlug(e.target.value) }) }))}
              className="input"
            />
          </div>
          {entrada('nomeCurto', 'Nome curto (logo)')}
          {entrada('marcaDestaque', 'Complemento ao lado do logo', { placeholder: 'Ex.: Gastrobar' })}
          {entrada('subtitulo', 'Subtítulo', { placeholder: 'Ex.: Sports Center' })}
          {entrada('slogan', 'Slogan')}
          <div>
            <span className="rotulo">Cor da marca</span>
            <div className="flex gap-2 flex-wrap" role="radiogroup" aria-label="Cor da marca">
              {Object.entries(NOMES_CORES).map(([cor, nomeCor]) => (
                <button
                  key={cor}
                  type="button"
                  role="radio"
                  aria-checked={f.cor === cor}
                  aria-label={nomeCor}
                  title={nomeCor}
                  onClick={() => mudar('cor', cor)}
                  style={{ background: PALETAS[cor][600] }}
                  className={`w-9 h-9 rounded-xl ${f.cor === cor ? 'ring-2 ring-offset-2 ring-slate-900' : ''}`}
                />
              ))}
            </div>
          </div>
          <div className="sm:col-span-2">
            {inicial?.id ? (
              <CampoFoto pasta={inicial.id} valor={f.logoUrl} aoMudar={(v) => mudar('logoUrl', v)} />
            ) : (
              <p className="text-xs text-slate-500">O logo pode ser enviado depois de criar a empresa.</p>
            )}
          </div>
        </div>
      </Secao>

      {comEndereco && (
        <Secao titulo="Endereço do site">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="e-slug" className="rotulo">Subdomínio *</label>
              <input
                id="e-slug"
                required
                value={f.slug}
                onChange={(e) => {
                  setSlugTocado(true);
                  mudar('slug', e.target.value.toLowerCase());
                }}
                className="input"
              />
              <p className="text-[11px] text-slate-500 mt-1">{f.slug || 'empresa'}.{raiz || 'sua-plataforma.com.br'}</p>
            </div>
            {entrada('dominio', 'Domínio próprio (opcional)', { placeholder: 'clubedoze.com.br' })}
            <div className="sm:col-span-2">{caixa('ativo', 'Empresa ativa (desligado, o site sai do ar e para de receber reservas)')}</div>
          </div>
        </Secao>
      )}

      <Secao titulo="Contato">
        <div className="grid sm:grid-cols-2 gap-3">
          {entrada('whatsapp', 'WhatsApp (DDD + número)', { inputMode: 'numeric' })}
          {entrada('instagram', 'Instagram')}
          {entrada('endereco', 'Endereço')}
          {entrada('cidade', 'Cidade')}
          {entrada('mapsUrl', 'Link do Google Maps', { largo: true, placeholder: 'https://...' })}
          {area('horarios', 'Horários exibidos no site', 'Um por linha: Rótulo; Horário. Ex.: Quadras; 07:00 às 23:00', 2)}
        </div>
      </Secao>

      <Secao titulo="O que a empresa oferece" descricao="O que estiver desligado some do site e do painel.">
        <div className="grid grid-cols-2 gap-2">
          {caixa('moduloQuadras', 'Quadras')}
          {caixa('moduloMesas', 'Mesas')}
          {caixa('moduloQuiosques', 'Quiosques')}
          {caixa('moduloCardapio', 'Cardápio')}
        </div>
      </Secao>

      {f.moduloQuadras && (
        <Secao titulo="Quadras" descricao="Renomear uma quadra não altera as reservas já feitas com o nome antigo.">
          <div className="grid sm:grid-cols-2 gap-3">
            {entrada('aberturaQuadras', 'Abertura (hora)', { inputMode: 'numeric' })}
            {entrada('fechamentoQuadras', 'Fechamento (hora)', { inputMode: 'numeric' })}
            {area('quadras', 'Lista de quadras', 'Uma por linha: Nome completo; Nome curto; Esportes; Piso')}
          </div>
        </Secao>
      )}

      {f.moduloMesas && (
        <Secao titulo="Mesas">
          <div className="grid sm:grid-cols-3 gap-3">
            {entrada('aberturaMesas', 'Primeira chegada', { type: 'time' })}
            {entrada('ultimaChegadaMesas', 'Última chegada', { type: 'time' })}
            {entrada('maxPessoasMesa', 'Máximo de pessoas', { inputMode: 'numeric' })}
          </div>
        </Secao>
      )}

      {f.moduloQuiosques && (
        <Secao titulo="Quiosques">
          <div className="grid sm:grid-cols-2 gap-3">
            {area('quiosques', 'Lista de quiosques', 'Um por linha: Nome completo; Nome curto; Capacidade; Ideal para')}
            {entrada('tiposEvento', 'Tipos de evento (separados por vírgula)', { largo: true })}
          </div>
        </Secao>
      )}

      {f.moduloCardapio && (
        <Secao titulo="Cardápio">
          <div className="grid sm:grid-cols-2 gap-3">{entrada('categoriasCardapio', 'Ordem das categorias (separadas por vírgula)', { largo: true })}</div>
        </Secao>
      )}

      <Secao titulo="Sinal via Pix" descricao="Sem chave Pix, nenhuma reserva cobra sinal.">
        <div className="grid sm:grid-cols-3 gap-3">
          {entrada('pixChave', 'Chave Pix')}
          {entrada('pixTitular', 'Titular (até 25 letras)')}
          {entrada('pixCidade', 'Cidade (até 15 letras)')}
          {entrada('sinalQuiosques', 'Sinal do quiosque (R$)', { inputMode: 'decimal' })}
          {entrada('sinalMesas', 'Sinal da mesa (R$)', { inputMode: 'decimal' })}
          {entrada('sinalPrazo', 'Prazo para pagar (horas)', { inputMode: 'numeric' })}
          {entrada('sinalHora', 'Sinal por hora de quadra (R$)', { inputMode: 'decimal' })}
          {entrada('sinalAPartirDe', 'Horário nobre a partir de', { type: 'time' })}
          <div className="flex items-end pb-2">{caixa('sinalFimDeSemana', 'Fim de semana todo é nobre')}</div>
        </div>
      </Secao>

      <Secao titulo="Textos do site" descricao="Em branco, o site usa um texto padrão.">
        <div className="grid sm:grid-cols-2 gap-3">
          {entrada('seloHero', 'Selo do topo')}
          {entrada('tituloEventos', 'Título da seção de eventos')}
          {area('tituloHero', 'Título principal', 'Uma frase por linha. A última fica na cor da marca.', 3)}
          {area('descricaoHero', 'Descrição do topo', null, 2)}
          {area('descricaoEventos', 'Descrição da seção de eventos', null, 2)}
          {area('descricaoSeo', 'Descrição para o Google', null, 2)}
        </div>
      </Secao>

      <Secao titulo="Google">
        <div className="grid sm:grid-cols-2 gap-3">
          {entrada('gaId', 'Google Analytics (G-XXXXXXX)')}
          {entrada('googleVerification', 'Código do Search Console')}
        </div>
      </Secao>

      <div className="flex justify-end">
        <button type="submit" disabled={salvando} className="btn-primario !py-3">
          {salvando && <Loader2 className="w-4 h-4 animate-spin" />} {textoBotao}
        </button>
      </div>
    </form>
  );
}
