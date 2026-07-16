# Monitor PJe Cloud

Este repositório contém dois produtos independentes no mesmo projeto Next.js:

1. **Monitor PJe Cloud** (`/monitor`) — monitoramento de processos judiciais eletrônicos via DataJud/CNJ,
   com alertas por Telegram.
2. **Di Pallacio Enterprise** (`/`) — site institucional e plataforma de clientes de um escritório de
   advocacia especializado em ações de distrato de multipropriedade (timeshare).

Os dois convivem no mesmo app Next.js (App Router), com camadas de dados e temas visuais separados.
O Monitor PJe usa `@vercel/kv`; a plataforma Di Pallacio usa PostgreSQL via Prisma.

> **Dados fictícios**: todo o seed da plataforma Di Pallacio usa nomes, valores e conteúdos fictícios.
> Nenhum dado real de cliente, CPF ou número de processo deve ser inserido em ambiente de exemplo.

---

## Como rodar o projeto

### 1. Instalar dependências

```bash
npm install
```

### 2. Banco de dados (PostgreSQL)

A plataforma Di Pallacio exige um banco PostgreSQL. Duas opções:

- **Local**: instale o PostgreSQL localmente e crie um banco/usuário:
  ```sql
  CREATE ROLE dipallacio LOGIN PASSWORD 'dipallacio_dev' CREATEDB;
  CREATE DATABASE dipallacio_dev OWNER dipallacio;
  ```
- **Gerenciado**: crie um banco gratuito em [Neon](https://neon.tech) ou [Supabase](https://supabase.com)
  e copie a connection string fornecida.

### 3. Variáveis de ambiente

Copie `.env.example` para `.env` e preencha:

```bash
cp .env.example .env
```

| Variável | Descrição |
|---|---|
| `DATABASE_URL` | Connection string do PostgreSQL (Di Pallacio) |
| `NEXTAUTH_SECRET` | Segredo do NextAuth — gere com `openssl rand -base64 32` |
| `NEXTAUTH_URL` | URL base da aplicação (`http://localhost:3000` em dev) |
| `WHATSAPP_NUMERO` | Número do escritório para o botão flutuante de WhatsApp |
| `LEADS_EMAIL_DESTINO` | E-mail de referência para leads (v1 usa apenas o painel admin) |
| `DATAJUD_API_KEY`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, `KV_*`, `CRON_SECRET` | Específicas do Monitor PJe — ver seção abaixo |

### 4. Migrations e seed

```bash
npm run db:migrate   # aplica as migrations do schema.prisma
npm run db:seed      # popula dados fictícios (empreendimentos, cotas, índices, vídeos, artigos, leads)
```

O seed cria dois usuários de teste:

- **Admin**: `admin@dipallacio.example` / `admin123`
- **Cliente**: `cliente@dipallacio.example` / `cliente123`

### 5. Rodar em desenvolvimento

```bash
npm run dev
```

- Site institucional: http://localhost:3000
- Área do cliente: http://localhost:3000/area-do-cliente (login necessário)
- Painel admin: http://localhost:3000/admin (login com role `admin`)
- Monitor PJe (dashboard original): http://localhost:3000/monitor

### 6. Testes

```bash
npm test
```

Cobre principalmente o módulo `lib/calculadora` (correção monetária, cenários de retenção e as duas
teses de juros) com funções puras e determinísticas — nunca geradas por um modelo de linguagem.

### 7. Build de produção

```bash
npm run build
npm start
```

---

## Populando a tabela de índices (INCC-DI/FGV e IPCA)

A calculadora de distrato depende de uma série mensal de números-índice (não percentuais de variação)
para corrigir monetariamente os pagamentos. Essa série fica na tabela `IndiceEconomico` e é editável
pelo painel admin em **`/admin/indices`**:

1. Escolha o índice (`INCC-DI/FGV` ou `IPCA`).
2. Escolha o mês de competência.
3. Informe o número-índice acumulado daquele mês (não a variação percentual isolada).

O seed (`prisma/seed.ts`) já popula uma série fictícia de 2019 a 2026 para os dois índices, suficiente
para rodar a calculadora localmente. Em produção, atualize mensalmente com os números-índice oficiais
publicados pelo IBGE (IPCA) e pela FGV (INCC-DI) — uma futura integração automática com as APIs
públicas do IBGE/FGV pode substituir a entrada manual sem alterar a lógica de cálculo.

Os demais parâmetros da calculadora (percentuais dos três cenários, tese de juros padrão, meses
estimados até o trânsito em julgado, taxa SELIC mensal e taxa de juros simples) são editáveis em
**`/admin/calculadora`**, sem necessidade de alterar código.

---

## Estrutura do projeto (Di Pallacio Enterprise)

```
app/(site)/              → site institucional + área do cliente (mesmo tema visual)
app/admin/                → painel administrativo (layout próprio)
app/(monitor)/monitor/    → dashboard original do Monitor PJe Cloud
app/api/                  → rotas de API (leads, cotas, cálculo, anúncios, trocas, admin/*)
lib/calculadora/          → módulo de cálculo puro e determinístico + testes (vitest)
lib/auth/                 → configuração do NextAuth e guardas de admin
prisma/schema.prisma      → modelo de dados completo (User, Empreendimento, Cota, Pagamento,
                             CalculoResultado, Lead, Anuncio, PropostaTroca, Video, Artigo,
                             IndiceEconomico, CalculadoraConfig)
prisma/seed.ts             → dados fictícios de exemplo
```

### Autenticação

NextAuth com provedor de credenciais (e-mail/senha, hash bcrypt) e sessão JWT. Roles: `cliente` e
`admin`. `middleware.ts` protege `/area-do-cliente/*` (qualquer usuário logado) e `/admin/*` (somente
`role = admin`).

### Módulo de cálculo

Implementado como funções puras em `lib/calculadora/*.ts`:

- `correcaoMonetaria.ts` — corrige cada pagamento pelo índice pré-habite-se (até o habite-se) e depois
  pós-habite-se (até a data de referência), ou diretamente pelo pós-habite-se quando o pagamento é
  posterior ao habite-se.
- `cenarios.ts` — sempre calcula os três cenários de retenção (conservador/intermediário/otimista),
  nunca um número único.
- `juros.ts` — duas teses configuráveis lado a lado (SELIC líquida de IPCA desde o trânsito em julgado
  estimado; e 1% a.m. simples desde a citação/desistência).
- `calcularDistrato.ts` — orquestra as etapas acima.

Nenhuma dessas funções depende de rede, banco de dados ou modelo de linguagem — são testadas
isoladamente em `lib/calculadora/calculadora.test.ts`.

---

## Monitor PJe Cloud (produto original)

```bash
npm run dev        # Servidor de desenvolvimento
npm run build      # Build de produção
```

Variáveis de ambiente específicas: `DATAJUD_API_KEY`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`,
`KV_URL`/`KV_REST_API_URL`/`KV_REST_API_TOKEN`, `CRON_SECRET`. Veja `.env.example` para instruções de
como configurar o bot do Telegram e o cron de verificação.
