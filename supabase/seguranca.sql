-- =====================================================================
-- Resenha Sports — Segurança e integridade do banco (Supabase)
-- Rode no SQL Editor do Supabase. O script é idempotente.
--
-- O site usa a chave pública (anon) direto no navegador. Sem as regras
-- abaixo, QUALQUER pessoa com a chave consegue ler nomes/telefones dos
-- clientes, alterar status ou apagar reservas e itens do cardápio.
--
-- Modelo de acesso:
--   anon (visitante)      -> lê cardápio disponível, lê só os horários
--                            ocupados, cria reservas com status 'pendente'
--   authenticated (equipe)-> acesso total
--
-- IMPORTANTE: em Authentication > Providers > Email, DESATIVE
-- "Allow new users to sign up". Caso contrário qualquer pessoa cria uma
-- conta e vira "authenticated" (= admin). Cadastre a equipe manualmente
-- em Authentication > Users.
-- =====================================================================

-- Depois da migração multi-tenant este arquivo não pode rodar de novo: ele
-- recolocaria as regras sem separação por empresa.
do $$
begin
  if to_regclass('public.empresas') is not null then
    raise exception 'Banco já migrado para multi-tenant. Rode apenas supabase/multi-tenant.sql.';
  end if;
end $$;

-- ---------- RLS ligado em todas as tabelas ----------
alter table public.cardapio           enable row level security;
alter table public.reservas_quadras   enable row level security;
alter table public.reservas_mesas     enable row level security;
alter table public.reservas_quiosques enable row level security;

-- ---------- CARDÁPIO ----------
drop policy if exists "cardapio_publico_le_disponiveis" on public.cardapio;
create policy "cardapio_publico_le_disponiveis" on public.cardapio
  for select to anon using (disponivel = true);

drop policy if exists "cardapio_equipe_tudo" on public.cardapio;
create policy "cardapio_equipe_tudo" on public.cardapio
  for all to authenticated using (true) with check (true);

-- ---------- RESERVAS: equipe tem acesso total ----------
do $$
declare t text;
begin
  foreach t in array array['reservas_quadras', 'reservas_mesas', 'reservas_quiosques'] loop
    execute format('drop policy if exists "equipe_tudo" on public.%I', t);
    execute format('create policy "equipe_tudo" on public.%I for all to authenticated using (true) with check (true)', t);

    -- Visitante só pode CRIAR reserva pendente (nunca confirmar/alterar/apagar),
    -- para hoje em diante, com nome e WhatsApp (DDD + número) válidos e sem
    -- preencher as observações internas da equipe.
    execute format('drop policy if exists "publico_cria_pendente" on public.%I', t);
    execute format($p$create policy "publico_cria_pendente" on public.%I for insert to anon with check (
      status = 'pendente'
      and data_reserva >= (now() at time zone 'America/Sao_Paulo')::date
      and data_reserva <= (now() at time zone 'America/Sao_Paulo')::date + 400
      and char_length(btrim(cliente_nome)) between 2 and 80
      and cliente_whatsapp ~ '^[0-9]{10,11}$'
      and coalesce(observacoes, '') = ''
    )$p$, t);
  end loop;
end $$;

-- ---------- Leitura pública SÓ das colunas de disponibilidade ----------
-- A grade de horários do site precisa saber o que está ocupado, mas não
-- deve expor nome/WhatsApp. Usamos permissão por coluna + política de linha.
revoke select on public.reservas_quadras from anon;
grant  select (quadra_nome, data_reserva, horario_inicio, horario_fim, status) on public.reservas_quadras to anon;

drop policy if exists "publico_le_ocupacao" on public.reservas_quadras;
create policy "publico_le_ocupacao" on public.reservas_quadras
  for select to anon using (status <> 'cancelado');

-- Quiosques: o site verifica se o quiosque já está reservado na data
revoke select on public.reservas_quiosques from anon;
grant  select (data_reserva, tipo_evento, status) on public.reservas_quiosques to anon;

drop policy if exists "publico_le_ocupacao" on public.reservas_quiosques;
create policy "publico_le_ocupacao" on public.reservas_quiosques
  for select to anon using (status <> 'cancelado');

-- Mesas: nenhuma leitura pública
revoke select on public.reservas_mesas from anon;

-- ---------- ANTI-OVERBOOKING NO BANCO ----------
-- Impede duas reservas ativas sobrepostas na mesma quadra, mesmo que duas
-- pessoas cliquem ao mesmo tempo. O site já trata o erro (código 23P01).
-- Pré-requisitos: data_reserva do tipo DATE e horario_inicio/horario_fim
-- do tipo TIME; e não pode haver sobreposições já existentes (cancele-as antes).
create extension if not exists btree_gist;

alter table public.reservas_quadras drop constraint if exists reservas_quadras_sem_sobreposicao;
alter table public.reservas_quadras
  add constraint reservas_quadras_sem_sobreposicao
  exclude using gist (
    quadra_nome with =,
    tsrange(data_reserva + horario_inicio, data_reserva + horario_fim, '[)') with &&
  ) where (status <> 'cancelado');

-- Quiosques: no máximo um evento ativo por quiosque e por dia. O nome do
-- quiosque é o 2º trecho de tipo_evento ("<evento> | <quiosque> | Pedido: [...]").
-- O site trata o erro (código 23505). Se houver duplicidades antigas, cancele-as antes.
create unique index if not exists reservas_quiosques_um_evento_por_dia
  on public.reservas_quiosques (data_reserva, (btrim(split_part(tipo_evento, '|', 2))))
  where status <> 'cancelado';

-- ---------- Validações básicas de dados ----------
alter table public.reservas_quadras drop constraint if exists reservas_quadras_horario_valido;
alter table public.reservas_quadras add constraint reservas_quadras_horario_valido check (horario_fim > horario_inicio) not valid;

-- ---------- Opcional: campos extras do cardápio ----------
-- O painel detecta estas colunas automaticamente e passa a exibir os campos.
alter table public.cardapio add column if not exists descricao  text;
alter table public.cardapio add column if not exists imagem_url text;

-- ---------- Opcional: índices para o painel ----------
create index if not exists reservas_quadras_data_idx   on public.reservas_quadras (data_reserva);
create index if not exists reservas_mesas_data_idx     on public.reservas_mesas (data_reserva);
create index if not exists reservas_quiosques_data_idx on public.reservas_quiosques (data_reserva);

-- =====================================================================
-- EQUIPE E PAPÉIS
-- Antes: qualquer usuário logado era admin. Se o cadastro público fosse
-- reativado por engano, um estranho viraria dono do painel.
-- Agora só quem está na tabela `equipe` tem acesso. Também é a base para
-- o multi-tenant (papel 'super' = super-usuário da plataforma).
-- =====================================================================
create table if not exists public.equipe (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  papel      text not null default 'admin' check (papel in ('super', 'admin', 'atendente')),
  created_at timestamptz not null default now()
);
alter table public.equipe enable row level security;

-- Bootstrap: quem já está cadastrado hoje continua com acesso.
insert into public.equipe (user_id, papel)
select id, 'admin' from auth.users
on conflict (user_id) do nothing;

create or replace function public.is_equipe()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.equipe where user_id = auth.uid());
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.equipe where user_id = auth.uid() and papel in ('super', 'admin'));
$$;

drop policy if exists "equipe_le_propria" on public.equipe;
create policy "equipe_le_propria" on public.equipe
  for select to authenticated using (user_id = auth.uid() or public.is_admin());

-- Substitui o "using (true)" por checagem de equipe
drop policy if exists "cardapio_equipe_tudo" on public.cardapio;
create policy "cardapio_equipe_tudo" on public.cardapio
  for all to authenticated using (public.is_equipe()) with check (public.is_equipe());

do $$
declare t text;
begin
  foreach t in array array['reservas_quadras', 'reservas_mesas', 'reservas_quiosques'] loop
    execute format('drop policy if exists "equipe_tudo" on public.%I', t);
    execute format('create policy "equipe_tudo" on public.%I for all to authenticated using (public.is_equipe()) with check (public.is_equipe())', t);
  end loop;
end $$;

-- =====================================================================
-- ANTI-SPAM: limita solicitações públicas por WhatsApp
-- Máx. 5 reservas pendentes futuras por número em cada tabela e
-- 20 inserções públicas por tabela a cada 10 minutos (contra robôs).
-- =====================================================================
create or replace function public.limitar_reservas_publicas()
returns trigger language plpgsql security definer set search_path = public as $$
declare n int;
begin
  if auth.role() <> 'anon' then return new; end if;

  execute format(
    'select count(*) from public.%I where cliente_whatsapp = $1 and status = ''pendente'' and data_reserva >= current_date',
    tg_table_name) into n using new.cliente_whatsapp;
  if n >= 5 then
    raise exception 'Muitas solicitações pendentes para este WhatsApp. Fale com a gente.' using errcode = 'P0001';
  end if;

  execute format(
    'select count(*) from public.%I where created_at > now() - interval ''10 minutes''', tg_table_name) into n;
  if n >= 20 then
    raise exception 'Muitas solicitações no momento. Tente novamente em alguns minutos.' using errcode = 'P0001';
  end if;

  return new;
end $$;

do $$
declare t text;
begin
  foreach t in array array['reservas_quadras', 'reservas_mesas', 'reservas_quiosques'] loop
    execute format('alter table public.%I add column if not exists created_at timestamptz not null default now()', t);
    execute format('drop trigger if exists limitar_publico on public.%I', t);
    execute format('create trigger limitar_publico before insert on public.%I for each row execute function public.limitar_reservas_publicas()', t);
  end loop;
end $$;

-- =====================================================================
-- VALIDAÇÃO EXTRA DO QUE O VISITANTE GRAVA (políticas RESTRICTIVE)
-- A política "publico_cria_pendente" garante status/data/nome/telefone.
-- Estas somam regras por tipo, para que ninguém use a chave pública para
-- gravar quadra inexistente, jogo de 20h, mesa para 5.000 pessoas ou
-- textos gigantes em tipo_evento. Se mudar quadras/horários em
-- src/lib/config.js, ajuste aqui também.
-- =====================================================================
drop policy if exists "publico_valida_quadra" on public.reservas_quadras;
create policy "publico_valida_quadra" on public.reservas_quadras
  as restrictive for insert to anon with check (
    quadra_nome in ('Quadra 1 - Beach Tennis / Futevôlei', 'Quadra 2 - Beach Tennis / Futevôlei', 'Quadra 3 - Padel')
    and horario_inicio >= time '07:00'
    and horario_fim    <= time '23:00'
    and horario_fim - horario_inicio between interval '1 hour' and interval '4 hours'
    and extract(minute from horario_inicio) = 0
    and position('|' in cliente_nome) = 0
  );

drop policy if exists "publico_valida_mesa" on public.reservas_mesas;
create policy "publico_valida_mesa" on public.reservas_mesas
  as restrictive for insert to anon with check (
    num_pessoas between 1 and 30
    and horario_inicio between time '11:00' and time '22:00'
    and data_reserva <= (now() at time zone 'America/Sao_Paulo')::date + 60
    and char_length(coalesce(tipo_evento, '')) <= 2000
    and position('|' in cliente_nome) = 0
  );

drop policy if exists "publico_valida_quiosque" on public.reservas_quiosques;
create policy "publico_valida_quiosque" on public.reservas_quiosques
  as restrictive for insert to anon with check (
    num_convidados between 1 and 100
    and data_reserva > (now() at time zone 'America/Sao_Paulo')::date
    and btrim(split_part(tipo_evento, '|', 2)) in (
      'Quiosque Família (Até 20 Pessoas)', 'Quiosque VIP / Aniversários (Até 50 Pessoas)', 'Quiosque Corporativo (Até 100 Pessoas)')
    and char_length(tipo_evento) <= 3000
    and position('|' in cliente_nome) = 0
  );

-- =====================================================================
-- SINAL VIA PIX + LINK DO CLIENTE
-- sinal_valor: quanto o cliente deve adiantar (0 = sem sinal)
-- sinal_pago : marcado pela equipe ao receber o comprovante
-- token_cliente: segredo do link /minha-reserva (consultar e cancelar).
--   O visitante nunca consegue LER essa coluna (não há grant de select).
-- =====================================================================
do $$
declare t text;
begin
  foreach t in array array['reservas_quadras', 'reservas_mesas', 'reservas_quiosques'] loop
    execute format('alter table public.%I add column if not exists sinal_valor numeric(10,2) not null default 0', t);
    execute format('alter table public.%I add column if not exists sinal_pago boolean not null default false', t);
    execute format('alter table public.%I add column if not exists token_cliente uuid default gen_random_uuid()', t);
    execute format('create unique index if not exists %I on public.%I (token_cliente)', t || '_token_idx', t);

    -- Visitante não pode se declarar "sinal pago" nem inventar valores absurdos
    execute format('drop policy if exists "publico_valida_sinal" on public.%I', t);
    execute format($p$create policy "publico_valida_sinal" on public.%I as restrictive for insert to anon
      with check (sinal_pago = false and sinal_valor between 0 and 1000)$p$, t);
  end loop;
end $$;

-- ---------- Funções do link do cliente (rodam com permissão elevada,
-- mas só enxergam a reserva cujo token foi informado) ----------
create or replace function public.consultar_reserva_cliente(p_tipo text, p_token uuid)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare r jsonb;
begin
  if p_tipo not in ('quadras', 'mesas', 'quiosques') or p_token is null then return null; end if;
  execute format('select to_jsonb(x) from public.%I x where token_cliente = $1', 'reservas_' || p_tipo) into r using p_token;
  if r is null then return null; end if;
  -- Devolve só o necessário (nada de observações internas da equipe)
  return (select jsonb_object_agg(key, value) from jsonb_each(r) where key = any (array[
    'cliente_nome', 'data_reserva', 'horario_inicio', 'horario_fim', 'quadra_nome', 'tipo_evento',
    'num_pessoas', 'num_convidados', 'status', 'sinal_valor', 'sinal_pago']));
end $$;

create or replace function public.cancelar_reserva_cliente(p_tipo text, p_token uuid)
returns text language plpgsql volatile security definer set search_path = public as $$
declare v_id text;
begin
  if p_tipo not in ('quadras', 'mesas', 'quiosques') or p_token is null then return 'invalido'; end if;
  execute format(
    $q$update public.%I set status = 'cancelado'
       where token_cliente = $1
         and status in ('pendente', 'agendada', 'confirmado')
         and data_reserva >= (now() at time zone 'America/Sao_Paulo')::date
       returning id::text$q$, 'reservas_' || p_tipo) into v_id using p_token;
  return case when v_id is null then 'nao_permitido' else 'ok' end;
end $$;

revoke all on function public.consultar_reserva_cliente(text, uuid) from public;
revoke all on function public.cancelar_reserva_cliente(text, uuid) from public;
grant execute on function public.consultar_reserva_cliente(text, uuid) to anon, authenticated;
grant execute on function public.cancelar_reserva_cliente(text, uuid) to anon, authenticated;

-- =====================================================================
-- HISTÓRICO DE ALTERAÇÕES (quem confirmou, cancelou, remarcou...)
-- Gravado por trigger: não depende do site e não pode ser editado pela equipe.
-- =====================================================================
create table if not exists public.reservas_historico (
  id          bigint generated always as identity primary key,
  tipo        text not null,
  reserva_id  text not null,
  acao        text not null,           -- criada | alterada | excluida
  mudancas    jsonb,                   -- { campo: [antes, depois] }
  autor_id    uuid,
  autor_email text,                    -- null = site/cliente (sem login)
  created_at  timestamptz not null default now()
);
create index if not exists reservas_historico_reserva_idx on public.reservas_historico (tipo, reserva_id, created_at desc);
alter table public.reservas_historico enable row level security;

drop policy if exists "historico_equipe_le" on public.reservas_historico;
create policy "historico_equipe_le" on public.reservas_historico
  for select to authenticated using (public.is_equipe());

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

  insert into public.reservas_historico (tipo, reserva_id, acao, mudancas, autor_id, autor_email)
  values (
    v_tipo,
    case when tg_op = 'DELETE' then old.id::text else new.id::text end,
    case tg_op when 'INSERT' then 'criada' when 'UPDATE' then 'alterada' else 'excluida' end,
    v_mudancas,
    auth.uid(),
    auth.jwt() ->> 'email'
  );
  return case when tg_op = 'DELETE' then old else new end;
end $$;

do $$
declare t text;
begin
  foreach t in array array['reservas_quadras', 'reservas_mesas', 'reservas_quiosques'] loop
    execute format('drop trigger if exists historico on public.%I', t);
    execute format('create trigger historico after insert or update or delete on public.%I for each row execute function public.registrar_historico_reserva()', t);
  end loop;
end $$;

-- =====================================================================
-- TEMPO REAL: o painel recebe novas reservas na hora (Supabase Realtime).
-- O RLS continua valendo: só a equipe recebe os eventos.
-- =====================================================================
do $$
declare t text;
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    foreach t in array array['reservas_quadras', 'reservas_mesas', 'reservas_quiosques'] loop
      if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t) then
        execute format('alter publication supabase_realtime add table public.%I', t);
      end if;
    end loop;
  end if;
end $$;

-- =====================================================================
-- FOTOS DO CARDÁPIO (Supabase Storage)
-- Bucket público para leitura; só a equipe envia, troca ou apaga.
-- =====================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('cardapio', 'cardapio', true, 2097152, array['image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do update set public = true, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "cardapio_fotos_equipe_envia" on storage.objects;
create policy "cardapio_fotos_equipe_envia" on storage.objects
  for insert to authenticated with check (bucket_id = 'cardapio' and public.is_equipe());

drop policy if exists "cardapio_fotos_equipe_altera" on storage.objects;
create policy "cardapio_fotos_equipe_altera" on storage.objects
  for update to authenticated using (bucket_id = 'cardapio' and public.is_equipe());

drop policy if exists "cardapio_fotos_equipe_apaga" on storage.objects;
create policy "cardapio_fotos_equipe_apaga" on storage.objects
  for delete to authenticated using (bucket_id = 'cardapio' and public.is_equipe());
