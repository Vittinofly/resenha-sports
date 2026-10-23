# Resenha Sports

Este é um projeto [Next.js](https://nextjs.org) inicializado com [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## English

### Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family from Vercel.

### Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

### Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-rea).

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

---

## Português

### Primeiros Passos

Primeiro, inicie o servidor de desenvolvimento:

```bash
npm run dev
# ou
yarn dev
# ou
pnpm dev
# ou
bun dev
```

Abra [http://localhost:3000](http://localhost:3000) no navegador para ver o resultado.

Você pode começar a editar a página modificando `app/page.js`. A página é atualizada automaticamente enquanto você edita o arquivo.

Este projeto usa [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) para otimizar e carregar automaticamente a família de fontes [Geist](https://vercel.com/font), nova fonte da Vercel.

### Saiba Mais

Para aprender mais sobre o Next.js, veja os seguintes recursos:

- [Documentação do Next.js](https://nextjs.org/docs) - conheça os recursos e a API do Next.js.
- [Aprenda Next.js](https://nextjs.org/learn) - tutorial interativo do Next.js.

Você também pode conferir o [repositório do Next.js no GitHub](https://github.com/vercel/next.js) - feedback e contribuições são bem-vindos!

### Implantar na Vercel

A maneira mais fácil de implantar sua aplicação Next.js é usar a [Plataforma Vercel](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-rea).

Consulte a [documentação de deploy do Next.js](https://nextjs.org/docs/app/building-your-application/deploying) para mais detalhes.

### Definição de projeto

Este projeto é uma aplicação web desenvolvida com Next.js para funcionar como um portal digital de um espaço que combina esporte, restaurante e eventos. O objetivo principal é centralizar em um único lugar tudo o que o cliente e a equipe precisam: cardápio, reservas de quadras, agendamento de mesas e aluguel de quiosques para festas e eventos privados.

Em outras palavras, este app funciona como um sistema moderno de gestão para um “gastro bar + centro esportivo”. Ele foi pensado para facilitar a experiência do cliente e também organizar o atendimento do estabelecimento.

A aplicação tem uma página inicial com opções para o usuário escolher o que deseja fazer, como:

consultar o cardápio;
reservar uma quadra esportiva;
marcar uma mesa no restaurante;
alugar um quiosque para evento;
acessar o painel administrativo da empresa.
Como funciona na prática?
1. Cardápio digital
Há uma área onde os produtos são exibidos em formato de cardápio, com busca e filtros por categoria. Isso permite que o cliente veja itens como porções, espetinhos, bebidas e pratos, com descrição e preço, de forma visual e organizada.

2. Reserva de quadras
A aplicação permite que o cliente escolha uma quadra esportiva, selecione a data e o horário desejado, e envie a solicitação de reserva. O sistema também valida conflitos de horário para evitar sobreposição de agendamentos.

Isso é útil para locais que têm opções como:

beach tennis;
futevôlei;
padel.
3. Reserva de mesas no restaurante
Há uma área específica para agendar mesas, onde o cliente informa:

nome;
WhatsApp;
número de pessoas;
data;
horário;
e pode até incluir um pré-pedido do cardápio.
Dessa forma, a equipe do restaurante já consegue visualizar o pedido antes mesmo da chegada do cliente.

4. Aluguel de quiosques para eventos
Também existe uma funcionalidade para reservar quiosques para eventos, festas e confraternizações. O cliente pode escolher o tipo de quiosque, a data e incluir itens do cardápio para o consumo do evento.

5. Painel administrativo
O projeto também possui uma área administrativa onde a equipe pode:

ver reservas ativas;
verificar histórico;
alterar status das solicitações;
confirmar ou cancelar reservas;
registrar observações internas;
entrar em contato com o cliente via WhatsApp.
Essa parte é muito importante porque transforma o app em um sistema útil para a operação do negócio, e não apenas em uma página bonita.

Por que esse projeto é interessante?
Porque ele reúne em um único sistema várias funcionalidades que normalmente seriam separadas:

cardápio;
gestão de pedidos;
reservas esportivas;
reservas de mesa;
aluguel de espaço para eventos;
administração interna.
Isso faz com que o projeto seja uma solução prática para negócios do segmento de lazer, gastronomia e entretenimento.

Tecnologias usadas
O projeto foi construído com tecnologias modernas, principalmente:

Next.js
React
Tailwind CSS
Supabase
Lucide React
Essas tecnologias ajudam a criar uma interface bonita, responsiva e funcional, além de permitir armazenamento e gerenciamento de dados no banco via Supabase.

Resumo simples
Se eu tivesse que explicar para um amigo sem técnico, eu diria:

“É um site de um espaço esportivo e gastronômico onde as pessoas podem olhar o cardápio, reservar quadras, marcar mesa e alugar quiosques para eventos. A equipe também consegue controlar tudo em um painel administrativo.”
