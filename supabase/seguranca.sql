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
