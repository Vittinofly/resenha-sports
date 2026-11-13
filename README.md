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
   O script cria a tabela `equipe`: **só quem está nela acessa o painel**. Usuários já existentes entram como `admin` automaticamente; novos membros são convidados pelo painel da plataforma (ver [Multi-tenant](#multi-tenant)). O script também limita spam de reservas públicas (5 pendentes por WhatsApp, 20 por tabela a cada 10 min) e valida no banco quadra, horário, duração, nº de pessoas e quiosque. Depois dele, rode `supabase/multi-tenant.sql`: as validações passam a usar as regras de cada empresa.
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
| `NEXT_PUBLIC_PIX_CHAVE`, `NEXT_PUBLIC_PIX_TITULAR`, `NEXT_PUBLIC_PIX_CIDADE` | Ativa o **sinal via Pix** (QR Code + copia e cola). Valores na tela de configurações da empresa |
| `NEXT_PUBLIC_GA_ID` | Google Analytics 4, carregado só após o aceite no aviso de cookies |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | Verificação do Google Search Console (método Tag HTML) |

Quadras, quiosques, horários, categorias do cardápio e regras de sinal são configurados por empresa, em `/admin/configuracoes` ou no painel da plataforma.

## Estrutura

```
src/
  proxy.js                  Traduz o domínio acessado na empresa (ver Multi-tenant)
  app/
    plataforma/             Painel do super-usuário (empresas e equipes)
    api/plataforma/equipe/  Convite de equipe (roda no servidor, com a chave de serviço)
    [empresa]/              Tudo abaixo é por empresa:
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
      configuracoes/        Marca, contato, horários e regras da empresa (só administradores)
    error.js, global-error.js, not-found.js   Telas de erro
    icon/, apple-icon/, manifest.webmanifest/  Ícone na cor da empresa e PWA (instalável no celular)
    sitemap.xml/, robots.txt/, og/, llms.txt/  SEO e GEO (IAs), por empresa
    privacidade/            Política de privacidade (LGPD), linkada nos formulários e rodapé
  components/               UI compartilhada (header, rodapé, modal, toasts, pré-pedido...)
  components/admin/         Shell do painel, modal de reserva (com remarcação), novo agendamento, indicadores
  lib/                      config, formatadores (datas/moeda/telefone), regras de reserva, hooks
supabase/seguranca.sql      RLS, anti-overbooking, validações, equipe/papéis, sinal, link do cliente,
                            histórico de alterações, tempo real e bucket de fotos do cardápio
supabase/multi-tenant.sql   Empresas, super-usuários, separação dos dados e regras por empresa
tests/                      Testes (vitest): datas, telefone, reservas, Pix, sinal e empresas
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

## Multi-tenant

Uma instalação atende várias empresas, cada uma com marca, regras, equipe e dados próprios.

| Acesso | O que abre |
|---|---|
| `plataforma.com.br` | Painel do super-usuário: cria empresas, define endereço e convida a equipe |
| `clube.plataforma.com.br` | Site e painel (`/admin`) da empresa de slug `clube` |
| `clubedoze.com.br` | A mesma empresa, se o domínio próprio estiver cadastrado |
| `localhost:3000` | Empresa padrão (`NEXT_PUBLIC_EMPRESA_PADRAO`) |
| `clube.localhost:3000` / `plataforma.localhost:3000` | Empresa `clube` / painel da plataforma, em desenvolvimento |

O `src/proxy.js` traduz o domínio em rota (`/[empresa]/...`). As regras de cada empresa ficam em `empresas.config` e são lidas por `src/lib/empresa.js`. O isolamento dos dados é garantido no banco, por RLS; alterações feitas no painel chegam ao site em até 1 minuto.

### Migrar o banco existente

1. Rode `supabase/seguranca.sql` (se ainda não rodou) e depois `supabase/multi-tenant.sql`, antes de publicar esta versão: o build consulta a tabela `empresas`.
2. Torne-se super-usuário (o comando está no início de `multi-tenant.sql`).
3. Publique o site.
4. Rode o bloco final de `multi-tenant.sql`, que remove o valor padrão de transição.

Depois da migração, `seguranca.sql` se recusa a rodar: alterações de segurança passam a ser feitas em `multi-tenant.sql`.

### Colocar a plataforma em um domínio próprio

1. Preencha `NEXT_PUBLIC_ROOT_DOMAIN` e `SUPABASE_SERVICE_ROLE_KEY` na Vercel.
2. Adicione à Vercel o domínio raiz e o curinga `*.seu-dominio.com.br` (o curinga exige usar os nameservers da Vercel).
3. No Supabase, em Authentication > URL Configuration, libere `https://*.seu-dominio.com.br/**`, para os links de convite e de nova senha funcionarem.
4. Cadastre o domínio atual do site no campo "Domínio próprio" da empresa padrão. Com o domínio raiz preenchido, um domínio sem cadastro responde 404.

Domínio próprio de um cliente: cadastre no painel da plataforma, adicione o domínio à Vercel e libere a URL no Supabase.
