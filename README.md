# Resenha Sports Center & Gastrobar

Site e painel de gestão do Resenha: reservas online de **quadras** (Beach Tennis, Futevôlei, Padel), **mesas** no gastrobar e **quiosques** para eventos, além do **cardápio digital**.

Stack: Next.js 16 (App Router, Cache Components, React Compiler) · React 19 · Tailwind CSS 4 · Supabase (banco + autenticação).

## Primeiros passos

```bash
npm install
cp .env.example .env.local   # preencha as variáveis
npm run dev                  # http://localhost:3000
```

Antes de publicar, no painel do Supabase:

1. Rode **`supabase/seguranca.sql`** no SQL Editor (é idempotente — rode de novo sempre que o arquivo mudar). Sem isso, a chave pública permite ler e alterar qualquer reserva.
   O script cria a tabela `equipe` (papéis `super`, `admin`, `atendente`): **só quem está nela acessa o painel**. Usuários já existentes entram como `admin` automaticamente; para novos membros, cadastre em Authentication → Users e rode `insert into public.equipe (user_id, papel) values ('<uuid>', 'admin');`. O script também limita spam de reservas públicas (5 pendentes por WhatsApp, 20 por tabela a cada 10 min) e valida no banco quadra, horário, duração, nº de pessoas e quiosque. **Se mudar quadras, quiosques ou horários em `src/lib/config.js`, ajuste as políticas `publico_valida_*` no SQL.**
2. Em **Authentication → Providers → Email**, desative *Allow new users to sign up* e cadastre a equipe manualmente em **Authentication → Users**.
3. Em **Authentication → URL Configuration**, preencha *Site URL* com o domínio e adicione `https://SEU-DOMINIO/login/nova-senha` (e `http://localhost:3000/login/nova-senha` para testes) em *Redirect URLs*. É para onde aponta o link de "Esqueci minha senha".

> **Atenção (Windows):** o build do Turbopack falha se o caminho da pasta tiver `#` (ex.: `C:\projetos\#Empresas\...`), com o erro `webpack loader path "C:\\projetos\\" is outside configured roots`. Renomeie a pasta (ex.: `Empresas`) ou copie o projeto para um caminho sem `#` para rodar `npm run build` localmente (`subst` não resolve, pois o Node segue o caminho real). Na Vercel isso não acontece.

## Variáveis de ambiente

| Variável | Uso |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Conexão com o Supabase (obrigatório) |
| `NEXT_PUBLIC_SITE_URL` | Domínio público: SEO, sitemap, imagem de compartilhamento e links de divulgação |
| `NEXT_PUBLIC_WHATSAPP_CONTATO` | WhatsApp do estabelecimento (DDD + número). Ativa o botão flutuante e o envio do resumo da reserva |
| `NEXT_PUBLIC_INSTAGRAM`, `NEXT_PUBLIC_ENDERECO`, `NEXT_PUBLIC_CIDADE`, `NEXT_PUBLIC_MAPS_URL` | Rodapé e dados estruturados (Google). Cada item só aparece se preenchido |
| `NEXT_PUBLIC_PIX_CHAVE`, `NEXT_PUBLIC_PIX_TITULAR`, `NEXT_PUBLIC_PIX_CIDADE` | Ativa o **sinal via Pix** (QR Code + copia e cola). Valores em `SINAL` no `config.js` |
| `NEXT_PUBLIC_GA_ID` | Google Analytics 4, carregado só após o aceite no aviso de cookies |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | Verificação do Google Search Console (método Tag HTML) |

Quadras, quiosques, horários de funcionamento e categorias do cardápio ficam em [`src/lib/config.js`](src/lib/config.js).

## Estrutura

```
src/
  app/
    page.js                 Landing page (conversão: serviços, como funciona, eventos, FAQ)
    cardapio/               Cardápio público com busca e categorias
    reservas/quadras|mesas|quiosques/   Fluxos de reserva (page.js = servidor + metadados, reserva-*.js = formulário)
    minha-reserva/          Link do cliente: acompanhar, pagar o sinal e cancelar (sem login)
    login/                  Acesso da equipe + "esqueci minha senha"
      nova-senha/           Criar nova senha (link do e-mail) ou trocar a senha logado
    admin/
      page.js               Visão geral: pendências, agenda do dia, ocupação, kit de divulgação
      quadras/              Agenda visual (horas × quadras) + agendamento de balcão
      reservas/             Central única de reservas: filtros, busca, ações rápidas, CSV, nova reserva
      clientes/             Mini-CRM gerado das reservas + campanhas por WhatsApp
      cardapio/             Cadastro, edição, pausa e exclusão de itens
    error.js, global-error.js, not-found.js   Telas de erro
    icon.js, apple-icon.js, manifest.js       Ícone da marca e PWA (instalável no celular)
    sitemap.js, robots.js, opengraph-image.js, llms.txt/ SEO e GEO (IAs)
    privacidade/            Política de privacidade (LGPD), linkada nos formulários e rodapé
  components/               UI compartilhada (header, rodapé, modal, toasts, pré-pedido...)
  components/admin/         Shell do painel, modal de reserva (com remarcação), novo agendamento, indicadores
  lib/                      config, formatadores (datas/moeda/telefone), regras de reserva, hooks
supabase/seguranca.sql      RLS, anti-overbooking, validações, equipe/papéis, sinal, link do cliente,
                            histórico de alterações, tempo real e bucket de fotos do cardápio
tests/                      Testes (vitest): datas, telefone, regras de reserva, Pix e sinal
```

## Modelo de dados (Supabase)

| Tabela | Colunas usadas |
| --- | --- |
| `cardapio` | `id, nome, categoria, preco, disponivel` (+ opcionais `descricao, imagem_url`) |
| `reservas_quadras` | `id, cliente_nome, cliente_whatsapp, quadra_nome, data_reserva, horario_inicio, horario_fim, status, observacoes, created_at` |
| `reservas_mesas` | `id, cliente_nome, cliente_whatsapp, data_reserva, horario_inicio, horario_fim, num_pessoas, tipo_evento, status, observacoes` |
| `reservas_quiosques` | `id, cliente_nome, cliente_whatsapp, data_reserva, num_convidados, tipo_evento, status, observacoes` |

`status`: `pendente` → `confirmado` → `concluido` (ou `cancelado`). Em mesas e quiosques, `tipo_evento` guarda `"<evento> | <local> | Pedido: [2x Item, ...]"` (ver `src/lib/reservas.js`).

## Recursos do painel

- **Tempo real:** novas reservas chegam na hora (Supabase Realtime). Clique em *Ligar alertas sonoros* no menu para ouvir um aviso e receber notificação do navegador mesmo com a aba em segundo plano. O ponto verde indica conexão ativa; sem ela, o painel atualiza a cada minuto.
- **Sinal via Pix:** com a chave configurada, quiosques e quadras em horário nobre mostram QR Code ao cliente. No detalhe da reserva, *Marcar como pago* registra o recebimento; o modelo *Cobrar sinal* manda a chave pelo WhatsApp.
- **Histórico:** cada reserva mostra quem criou, confirmou, remarcou ou cancelou, e quando (gravado pelo banco, não pode ser editado).
- **Link do cliente:** toda reserva feita pelo site gera um link privado (`/minha-reserva`) para o cliente acompanhar e cancelar. Ele vai automaticamente nas mensagens de confirmação, lembrete e remarcação.
- **Fotos do cardápio:** *Enviar foto* reduz a imagem para WebP (máx. 1000px) e envia ao Supabase Storage.

## Fluxo de operação

1. Cliente solicita a reserva no site (status **pendente**) e pode enviar o resumo pelo WhatsApp.
2. O painel avisa novas solicitações (contador no menu e no título da aba, atualização a cada minuto).
3. A equipe confirma com um clique — o WhatsApp abre com a mensagem de confirmação pronta.
4. Precisa mudar algo? No detalhe da reserva, **Remarcar** troca data, horário, quadra/quiosque ou nº de pessoas (com checagem de conflito) e já oferece a mensagem "Avisar remarcação".
5. Reservas por telefone ou no balcão entram em **Agendar no balcão / Nova reserva** (quadra, mesa ou quiosque), já confirmadas.
6. Depois do uso, marca como **concluída** (há ação em lote para reservas antigas).
7. Em **Clientes**, filtre os "sumidos" e dispare mensagens personalizadas para trazê-los de volta.

## Scripts

- `npm run dev` — desenvolvimento
- `npm run build` / `npm start` — produção
- `npm run lint` — ESLint
- `npm test` — testes automatizados (vitest)
