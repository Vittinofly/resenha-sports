-- =====================================================================
-- Multi-tenant — uma plataforma, várias empresas no mesmo banco
-- Rode no SQL Editor DEPOIS de supabase/seguranca.sql. É idempotente.
--
-- O que muda:
--   * tabela `empresas`: cadastro de cada cliente da plataforma (marca,
--     contato, quadras, regras). A primeira linha é o Resenha, com os dados
--     que até agora estavam no código.
--   * `empresa_id` em todas as tabelas de dados.
--   * `equipe` passa a ser por empresa; `super_usuarios` é a lista de quem
--     administra a plataforma inteira.
--   * as validações do visitante leem as regras da própria empresa.
--
-- Depois de rodar, torne-se super-usuário (troque o e-mail):
--   insert into public.super_usuarios (user_id)
--   select id from auth.users where email = 'voce@exemplo.com'
--   on conflict do nothing;
-- =====================================================================

-- ---------- EMPRESAS ----------
create table if not exists public.empresas (
  id         uuid primary key default gen_random_uuid(),
  slug       text not null unique,
  dominio    text unique,                -- domínio próprio, sem "www." (opcional)
  nome       text not null,
  ativo      boolean not null default true,
  config     jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.empresas drop constraint if exists empresas_slug_valido;
alter table public.empresas add constraint empresas_slug_valido check (
  slug ~ '^[a-z0-9]([a-z0-9-]{0,38}[a-z0-9])?$'
  and slug not in ('www', 'api', 'app', 'admin', 'plataforma', 'login', 'painel', 'mail', 'ftp', 'static', 'cdn')
);

alter table public.empresas drop constraint if exists empresas_dominio_valido;
alter table public.empresas add constraint empresas_dominio_valido check (
  dominio is null or (dominio = lower(dominio) and dominio ~ '^[a-z0-9-]+(\.[a-z0-9-]+)+$' and dominio !~ '^www\.')
);

alter table public.empresas enable row level security;

-- Resenha: mesmos valores que estavam em src/lib/config.js e nos textos do site.
-- "on conflict do nothing": rodar de novo não desfaz o que foi editado no painel.
insert into public.empresas (slug, nome, config) values ('resenha', 'Resenha Sports Center & Gastrobar', $json${
  "nomeCurto": "Resenha",
  "marcaDestaque": "Gastrobar",
  "subtitulo": "Sports Center & Gastrobar",
  "slogan": "Quadras de areia, padel, gastrobar e espaço para eventos em um só lugar.",
  "cor": "vermelho",
  "modulos": { "quadras": true, "mesas": true, "quiosques": true, "cardapio": true },
  "horarioFuncionamento": [
    { "dias": "Quadras", "horas": "07:00 às 23:00" },
    { "dias": "Gastrobar", "horas": "11:00 às 23:00" }
  ],
  "aberturaQuadras": 7,
  "fechamentoQuadras": 23,
  "quadras": [
    { "id": "q1", "nome": "Quadra 1 - Beach Tennis / Futevôlei", "curto": "Quadra 1", "esportes": "Beach Tennis · Futevôlei", "piso": "Areia" },
    { "id": "q2", "nome": "Quadra 2 - Beach Tennis / Futevôlei", "curto": "Quadra 2", "esportes": "Beach Tennis · Futevôlei", "piso": "Areia" },
    { "id": "q3", "nome": "Quadra 3 - Padel", "curto": "Quadra 3", "esportes": "Padel", "piso": "Sintético / Vidro" }
  ],
  "aberturaMesas": "11:00",
  "ultimaChegadaMesas": "22:00",
  "maxPessoasMesa": 30,
  "quiosques": [
    { "id": "q1", "nome": "Quiosque Família (Até 20 Pessoas)", "curto": "Quiosque Família", "capacidade": 20, "ideal": "Churrascos e encontros em família" },
    { "id": "q2", "nome": "Quiosque VIP / Aniversários (Até 50 Pessoas)", "curto": "Quiosque VIP", "capacidade": 50, "ideal": "Aniversários e comemorações" },
    { "id": "q3", "nome": "Quiosque Corporativo (Até 100 Pessoas)", "curto": "Quiosque Corporativo", "capacidade": 100, "ideal": "Confraternizações de empresas" }
  ],
  "tiposEvento": ["Aniversário", "Churrasco", "Confraternização", "Corporativo", "Despedida", "Outro"],
  "categoriasCardapio": ["Bebidas", "Drinks", "Porções", "Petiscos", "Espetinhos", "Pratos", "Comidas", "Sobremesas"],
  "pix": { "chave": "", "titular": "Resenha Sports", "cidade": "" },
  "sinal": { "quiosques": 100, "quadras": { "aPartirDe": "18:00", "fimDeSemanaTodo": true, "valorPorHora": 30 }, "mesas": 0, "prazoHoras": 24 },
  "textos": {
    "seloHero": "Esporte · Gastrobar · Eventos",
    "tituloHero": ["Joga.", "Come.", "Comemora."],
    "descricaoHero": "Quadras de areia e padel, cozinha de boteco caprichada e espaço para a sua festa. Reserve online em menos de um minuto.",
    "tituloSeo": "Resenha Sports Center & Gastrobar — Quadras, Gastrobar e Eventos",
    "sufixoTitulo": "Resenha Sports & Gastrobar",
    "palavrasChave": ["beach tennis", "futevôlei", "padel", "aluguel de quadra", "gastrobar", "quiosque para festa", "reserva de mesa", "espetinho"],
    "cozinha": "Petiscos, espetinhos e bebidas",
    "seoQuadras": "Veja os horários livres em tempo real e reserve sua quadra de Beach Tennis, Futevôlei ou Padel online, sem cadastro.",
    "seoMesas": "Reserve sua mesa no Resenha Gastrobar e adiante seu pedido de espetinhos, porções e bebidas.",
    "seoQuiosques": "Alugue um quiosque privativo para aniversários, churrascos e confraternizações de até 100 pessoas, com pré-pedido do cardápio.",
    "seoCardapio": "Espetinhos, porções, pratos, drinks e bebidas geladas. Confira o cardápio digital do Resenha Gastrobar com preços atualizados.",
    "descricaoSeo": "Reserve online quadras de Beach Tennis, Futevôlei e Padel, mesas no gastrobar e quiosques para festas. Cardápio digital com espetinhos, porções e bebidas geladas.",
    "servicoQuadras": "Beach Tennis, Futevôlei e Padel. Veja os horários livres em tempo real e reserve na hora.",
    "servicoMesas": "Garanta seu lugar no gastrobar e já deixe os petiscos e bebidas encaminhados.",
    "servicoQuiosques": "Espaço privado para aniversários, churrascos e confraternizações de até 100 pessoas.",
    "servicoCardapio": "Espetinhos, porções, drinks e cerveja gelada. Consulte preços direto do celular.",
    "chamadaQuadras": "Iluminação para jogar à noite e o bar a poucos passos.",
    "tituloEventos": "Sua festa no Resenha",
    "descricaoEventos": "Aniversário, churrasco da firma ou aquele encontro da turma. Escolha o quiosque, monte o pré-pedido e deixe o resto com a gente."
  }
}$json$::jsonb)
on conflict (slug) do nothing;

-- ---------- SUPER-USUÁRIOS ----------
create table if not exists public.super_usuarios (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.super_usuarios enable row level security;

-- Quem já era papel 'super' na equipe vira super-usuário da plataforma
insert into public.super_usuarios (user_id)
select user_id from public.equipe where papel = 'super'
on conflict (user_id) do nothing;

create or replace function public.is_super()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.super_usuarios where user_id = auth.uid());
$$;

drop policy if exists "super_le_propria" on public.super_usuarios;
create policy "super_le_propria" on public.super_usuarios
  for select to authenticated using (user_id = auth.uid());

-- ---------- empresa_id NAS TABELAS DE DADOS ----------
-- O DEFAULT apontando para o Resenha é só para a transição: mantém o site
-- antigo gravando enquanto o novo não foi publicado. Remova ao final (ver fim do arquivo).
-- Só é aplicado na primeira execução (coluna ainda inexistente), para que rodar
-- o script de novo não o recoloque depois de removido.
do $$
declare
  t text;
  v_resenha uuid := (select id from public.empresas where slug = 'resenha');
  v_nova boolean;
begin
  foreach t in array array['cardapio', 'reservas_quadras', 'reservas_mesas', 'reservas_quiosques'] loop
    v_nova := not exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = t and column_name = 'empresa_id'
    );
    execute format('alter table public.%I add column if not exists empresa_id uuid references public.empresas (id) on delete restrict', t);
    execute format('update public.%I set empresa_id = $1 where empresa_id is null', t) using v_resenha;
    execute format('alter table public.%I alter column empresa_id set not null', t);
    if v_nova then
      execute format('alter table public.%I alter column empresa_id set default %L', t, v_resenha);
    end if;
    execute format('create index if not exists %I on public.%I (empresa_id)', t || '_empresa_idx', t);
  end loop;

  alter table public.reservas_historico add column if not exists empresa_id uuid references public.empresas (id) on delete restrict;
  update public.reservas_historico set empresa_id = v_resenha where empresa_id is null;
  alter table public.reservas_historico alter column empresa_id set not null;

  alter table public.equipe add column if not exists empresa_id uuid references public.empresas (id) on delete cascade;
  update public.equipe set empresa_id = v_resenha where empresa_id is null;
  alter table public.equipe alter column empresa_id set not null;
  alter table public.equipe add column if not exists email text;
end $$;

-- Equipe: a mesma pessoa pode trabalhar em mais de uma empresa
alter table public.equipe drop constraint if exists equipe_pkey;
alter table public.equipe add constraint equipe_pkey primary key (empresa_id, user_id);
create index if not exists equipe_usuario_idx on public.equipe (user_id);

alter table public.equipe drop constraint if exists equipe_papel_check;
update public.equipe set papel = 'admin' where papel = 'super';
alter table public.equipe add constraint equipe_papel_check check (papel in ('admin', 'atendente'));

update public.equipe e set email = u.email from auth.users u where u.id = e.user_id and e.email is null;

-- ---------- PERMISSÕES POR EMPRESA ----------
create or replace function public.is_equipe(p_empresa uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_super() or exists (select 1 from public.equipe where user_id = auth.uid() and empresa_id = p_empresa);
$$;

create or replace function public.is_admin(p_empresa uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_super() or exists (select 1 from public.equipe where user_id = auth.uid() and empresa_id = p_empresa and papel = 'admin');
$$;

-- Regras da empresa, só se ela estiver ativa (null = bloqueia o visitante)
create or replace function public.config_empresa(p_empresa uuid)
returns jsonb language sql stable security definer set search_path = public as $$
  select config from public.empresas where id = p_empresa and ativo;
$$;

create or replace function public.modulo_ativo(p_empresa uuid, p_modulo text)
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((public.config_empresa(p_empresa) -> 'modulos' ->> p_modulo)::boolean, false);
$$;

-- ---------- POLÍTICAS: EMPRESAS ----------
grant select on public.empresas to anon, authenticated;
grant insert, update on public.empresas to authenticated;
grant select on public.super_usuarios to authenticated;
grant select, insert, update, delete on public.equipe to authenticated;

drop policy if exists "empresas_publico_le_ativas" on public.empresas;
create policy "empresas_publico_le_ativas" on public.empresas
  for select to anon using (ativo);

drop policy if exists "empresas_equipe_le" on public.empresas;
create policy "empresas_equipe_le" on public.empresas
  for select to authenticated using (ativo or public.is_super());

drop policy if exists "empresas_super_cria" on public.empresas;
create policy "empresas_super_cria" on public.empresas
  for insert to authenticated with check (public.is_super());

drop policy if exists "empresas_admin_altera" on public.empresas;
create policy "empresas_admin_altera" on public.empresas
  for update to authenticated using (public.is_admin(id)) with check (public.is_admin(id));

-- Administrador da empresa muda marca e regras; slug, domínio e status são do super-usuário
create or replace function public.proteger_campos_empresa()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.role() = 'authenticated' and not public.is_super()
     and (new.slug, new.dominio, new.ativo) is distinct from (old.slug, old.dominio, old.ativo) then
    raise exception 'Somente o super-usuário altera endereço e status da empresa.' using errcode = '42501';
  end if;
  return new;
end $$;

drop trigger if exists proteger_campos on public.empresas;
create trigger proteger_campos before update on public.empresas
  for each row execute function public.proteger_campos_empresa();

-- ---------- POLÍTICAS: EQUIPE ----------
drop policy if exists "equipe_le_propria" on public.equipe;
create policy "equipe_le_propria" on public.equipe
  for select to authenticated using (user_id = auth.uid() or public.is_admin(empresa_id));

drop policy if exists "equipe_super_gerencia" on public.equipe;
create policy "equipe_super_gerencia" on public.equipe
  for all to authenticated using (public.is_super()) with check (public.is_super());

-- ---------- POLÍTICAS: CARDÁPIO E RESERVAS ----------
drop policy if exists "cardapio_equipe_tudo" on public.cardapio;
create policy "cardapio_equipe_tudo" on public.cardapio
  for all to authenticated using (public.is_equipe(empresa_id)) with check (public.is_equipe(empresa_id));

drop policy if exists "historico_equipe_le" on public.reservas_historico;
create policy "historico_equipe_le" on public.reservas_historico
  for select to authenticated using (public.is_equipe(empresa_id));

do $$
declare t text;
begin
  foreach t in array array['reservas_quadras', 'reservas_mesas', 'reservas_quiosques'] loop
    execute format('drop policy if exists "equipe_tudo" on public.%I', t);
    execute format('create policy "equipe_tudo" on public.%I for all to authenticated using (public.is_equipe(empresa_id)) with check (public.is_equipe(empresa_id))', t);
  end loop;
end $$;

-- A grade pública filtra por empresa: precisa enxergar empresa_id (e nada pessoal)
grant select (empresa_id) on public.reservas_quadras to anon;
grant select (empresa_id) on public.reservas_quiosques to anon;

-- ---------- VALIDAÇÃO DO VISITANTE (agora com as regras de cada empresa) ----------
drop policy if exists "publico_valida_quadra" on public.reservas_quadras;
create policy "publico_valida_quadra" on public.reservas_quadras
  as restrictive for insert to anon with check (
    public.modulo_ativo(empresa_id, 'quadras')
    and exists (
      select 1 from jsonb_array_elements(public.config_empresa(empresa_id) -> 'quadras') q
      where q ->> 'nome' = quadra_nome
    )
    and horario_inicio >= make_time((public.config_empresa(empresa_id) ->> 'aberturaQuadras')::int, 0, 0)
    and horario_fim    <= make_time((public.config_empresa(empresa_id) ->> 'fechamentoQuadras')::int, 0, 0)
    and horario_fim - horario_inicio between interval '1 hour' and interval '4 hours'
    and extract(minute from horario_inicio) = 0
    and position('|' in cliente_nome) = 0
  );

drop policy if exists "publico_valida_mesa" on public.reservas_mesas;
create policy "publico_valida_mesa" on public.reservas_mesas
  as restrictive for insert to anon with check (
    public.modulo_ativo(empresa_id, 'mesas')
    and num_pessoas between 1 and (public.config_empresa(empresa_id) ->> 'maxPessoasMesa')::int
    and horario_inicio between (public.config_empresa(empresa_id) ->> 'aberturaMesas')::time
                           and (public.config_empresa(empresa_id) ->> 'ultimaChegadaMesas')::time
    and data_reserva <= (now() at time zone 'America/Sao_Paulo')::date + 60
    and char_length(coalesce(tipo_evento, '')) <= 2000
    and position('|' in cliente_nome) = 0
  );

drop policy if exists "publico_valida_quiosque" on public.reservas_quiosques;
create policy "publico_valida_quiosque" on public.reservas_quiosques
  as restrictive for insert to anon with check (
    public.modulo_ativo(empresa_id, 'quiosques')
    and exists (
      select 1 from jsonb_array_elements(public.config_empresa(empresa_id) -> 'quiosques') q
      where q ->> 'nome' = btrim(split_part(tipo_evento, '|', 2))
        and num_convidados between 1 and (q ->> 'capacidade')::int
    )
    and data_reserva > (now() at time zone 'America/Sao_Paulo')::date
    and char_length(tipo_evento) <= 3000
    and position('|' in cliente_nome) = 0
  );

-- ---------- ANTI-OVERBOOKING E ANTI-SPAM POR EMPRESA ----------
-- "Quadra 1" de uma empresa não pode colidir com a "Quadra 1" de outra
alter table public.reservas_quadras drop constraint if exists reservas_quadras_sem_sobreposicao;
alter table public.reservas_quadras
  add constraint reservas_quadras_sem_sobreposicao
  exclude using gist (
    empresa_id with =,
    quadra_nome with =,
    tsrange(data_reserva + horario_inicio, data_reserva + horario_fim, '[)') with &&
  ) where (status <> 'cancelado');

drop index if exists public.reservas_quiosques_um_evento_por_dia;
create unique index reservas_quiosques_um_evento_por_dia
  on public.reservas_quiosques (empresa_id, data_reserva, (btrim(split_part(tipo_evento, '|', 2))))
  where status <> 'cancelado';

create or replace function public.limitar_reservas_publicas()
returns trigger language plpgsql security definer set search_path = public as $$
declare n int;
begin
  if auth.role() <> 'anon' then return new; end if;

  execute format(
    'select count(*) from public.%I where empresa_id = $1 and cliente_whatsapp = $2 and status = ''pendente'' and data_reserva >= current_date',
    tg_table_name) into n using new.empresa_id, new.cliente_whatsapp;
  if n >= 5 then
    raise exception 'Muitas solicitações pendentes para este WhatsApp. Fale com a gente.' using errcode = 'P0001';
  end if;

  execute format(
    'select count(*) from public.%I where empresa_id = $1 and created_at > now() - interval ''10 minutes''', tg_table_name)
    into n using new.empresa_id;
  if n >= 20 then
    raise exception 'Muitas solicitações no momento. Tente novamente em alguns minutos.' using errcode = 'P0001';
  end if;

  return new;
end $$;

-- ---------- LINK DO CLIENTE: o token só vale na empresa do site aberto ----------
drop function if exists public.consultar_reserva_cliente(text, uuid);
drop function if exists public.cancelar_reserva_cliente(text, uuid);

create or replace function public.consultar_reserva_cliente(p_empresa uuid, p_tipo text, p_token uuid)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare r jsonb;
begin
  if p_tipo not in ('quadras', 'mesas', 'quiosques') or p_token is null or p_empresa is null then return null; end if;
  execute format('select to_jsonb(x) from public.%I x where token_cliente = $1 and empresa_id = $2', 'reservas_' || p_tipo)
    into r using p_token, p_empresa;
  if r is null then return null; end if;
  return (select jsonb_object_agg(key, value) from jsonb_each(r) where key = any (array[
    'cliente_nome', 'data_reserva', 'horario_inicio', 'horario_fim', 'quadra_nome', 'tipo_evento',
    'num_pessoas', 'num_convidados', 'status', 'sinal_valor', 'sinal_pago']));
end $$;

create or replace function public.cancelar_reserva_cliente(p_empresa uuid, p_tipo text, p_token uuid)
returns text language plpgsql volatile security definer set search_path = public as $$
declare v_id text;
begin
  if p_tipo not in ('quadras', 'mesas', 'quiosques') or p_token is null or p_empresa is null then return 'invalido'; end if;
  execute format(
    $q$update public.%I set status = 'cancelado'
       where token_cliente = $1
         and empresa_id = $2
         and status in ('pendente', 'agendada', 'confirmado')
         and data_reserva >= (now() at time zone 'America/Sao_Paulo')::date
       returning id::text$q$, 'reservas_' || p_tipo) into v_id using p_token, p_empresa;
  return case when v_id is null then 'nao_permitido' else 'ok' end;
end $$;

revoke all on function public.consultar_reserva_cliente(uuid, text, uuid) from public;
revoke all on function public.cancelar_reserva_cliente(uuid, text, uuid) from public;
grant execute on function public.consultar_reserva_cliente(uuid, text, uuid) to anon, authenticated;
grant execute on function public.cancelar_reserva_cliente(uuid, text, uuid) to anon, authenticated;

-- ---------- HISTÓRICO ----------
create or replace function public.registrar_historico_reserva()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_tipo text := replace(tg_table_name, 'reservas_', '');
  v_mudancas jsonb;
begin
  if tg_op = 'UPDATE' then
    select jsonb_object_agg(n.key, jsonb_build_array(o.value, n.value)) into v_mudancas
    from jsonb_each(to_jsonb(new)) n
    join jsonb_each(to_jsonb(old)) o on o.key = n.key
    where n.value is distinct from o.value and n.key not in ('created_at', 'token_cliente');
    if v_mudancas is null then return new; end if;
  end if;

  insert into public.reservas_historico (empresa_id, tipo, reserva_id, acao, mudancas, autor_id, autor_email)
  values (
    case when tg_op = 'DELETE' then old.empresa_id else new.empresa_id end,
    v_tipo,
    case when tg_op = 'DELETE' then old.id::text else new.id::text end,
    case tg_op when 'INSERT' then 'criada' when 'UPDATE' then 'alterada' else 'excluida' end,
    v_mudancas,
    auth.uid(),
    auth.jwt() ->> 'email'
  );
  return case when tg_op = 'DELETE' then old else new end;
end $$;

-- ---------- FOTOS: cada empresa só mexe na própria pasta (<empresa_id>/arquivo) ----------
create or replace function public.is_equipe_pasta(p_nome text)
returns boolean language plpgsql stable security definer set search_path = public as $$
declare v_pasta text := split_part(p_nome, '/', 1);
begin
  if v_pasta !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    return public.is_super();
  end if;
  return public.is_equipe(v_pasta::uuid);
end $$;

drop policy if exists "cardapio_fotos_equipe_envia" on storage.objects;
create policy "cardapio_fotos_equipe_envia" on storage.objects
  for insert to authenticated with check (bucket_id = 'cardapio' and public.is_equipe_pasta(name));

drop policy if exists "cardapio_fotos_equipe_altera" on storage.objects;
create policy "cardapio_fotos_equipe_altera" on storage.objects
  for update to authenticated using (bucket_id = 'cardapio' and public.is_equipe_pasta(name));

drop policy if exists "cardapio_fotos_equipe_apaga" on storage.objects;
create policy "cardapio_fotos_equipe_apaga" on storage.objects
  for delete to authenticated using (bucket_id = 'cardapio' and public.is_equipe_pasta(name));

-- As versões antigas, sem empresa, deixam de ser usadas pelas políticas acima
drop function if exists public.is_equipe();
drop function if exists public.is_admin();

-- ---------- CONVITE: localizar usuário existente pelo e-mail (só o servidor usa) ----------
create or replace function public.id_usuario_por_email(p_email text)
returns uuid language sql stable security definer set search_path = public, auth as $$
  select id from auth.users where lower(email) = lower(p_email) limit 1;
$$;
revoke all on function public.id_usuario_por_email(text) from public, anon, authenticated;
grant execute on function public.id_usuario_por_email(text) to service_role;

-- Atualiza o cache de esquema da API para enxergar tabelas e colunas novas
notify pgrst, 'reload schema';

-- =====================================================================
-- DEPOIS QUE O SITE NOVO ESTIVER NO AR, rode isto uma vez. Sem o default,
-- uma gravação sem empresa falha em vez de cair no Resenha por engano.
--
--   alter table public.cardapio           alter column empresa_id drop default;
--   alter table public.reservas_quadras   alter column empresa_id drop default;
--   alter table public.reservas_mesas     alter column empresa_id drop default;
--   alter table public.reservas_quiosques alter column empresa_id drop default;
-- =====================================================================
