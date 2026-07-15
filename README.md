# Gerador de Landing Pages — Causi

Plataforma self-service para advogados com plano Causi (id=9) criarem, personalizarem e publicarem landing pages jurídicas com geração de copy via IA.

## Stack

| Camada | Tecnologia |
|--------|------------|
| Framework | Next.js 16 (App Router) |
| UI | React 19 + Tailwind CSS 4 |
| Auth | Supabase Auth (`@supabase/ssr`) |
| Banco | Supabase PostgreSQL — dual project |
| IA (copy) | OpenAI GPT-4o |
| Imagens | Unsplash API + Sharp |
| Linguagem | TypeScript 5 |

## Arquitetura dual-database

O sistema usa **dois projetos Supabase independentes**:

| Projeto | Responsabilidade |
|---------|-----------------|
| **A — Causi** | Autenticação (`auth.users`), contas e billing (`billing.plans`, `billing.subscriptions`) |
| **B — Gerador LP** | Landing pages (`lps`), leads (`leads_gerador`), configurações do usuário (`user_settings`) |

Autenticação e validação de plano acontecem no Projeto A via RPC `get_current_user_details_v4`. Dados de LP são persistidos no Projeto B via `service_role` server-side, sempre filtrados por `causi_user_id`.

Diagrama detalhado: [docs/architecture.md](docs/architecture.md)

## Setup

### Pré-requisitos

- Node.js 20+
- Dois projetos Supabase configurados (Causi + Gerador LP)
- Chave OpenAI

### Instalação

```bash
pnpm install
cp .env.local.example .env.local
# preencha as variáveis (veja seção abaixo)
pnpm dev
```

### Variáveis de ambiente

| Variável | Obrigatória | Descrição |
|----------|:-----------:|-----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Sim | URL do Supabase Causi (Auth) |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Sim | Anon key do Causi |
| `LP_SUPABASE_URL` | Sim | URL do Supabase Gerador LP |
| `LP_SUPABASE_SERVICE_ROLE_KEY` | Sim | Service role do Gerador LP |
| `OPENAI_API_KEY` | Sim | Geração e melhoria de texto (GPT-4o) |
| `UNSPLASH_ACCESS_KEY` | Não | Imagens de cenário; sem ela ficam vazias |
| `NEXT_PUBLIC_CAUSI_APP_URL` | Não | Link para o app Causi no sidebar e em `AccessDenied` (default: `https://app.causi.com.br`) |

### Schema do banco

Aplicar migrations do Projeto B em ordem (`supabase db push`):

1. `supabase/migrations/20260629130000_refactor_structure.sql`
2. `supabase/migrations/20260629140000_migrate_legacy_lps_and_leads.sql`

Ver [supabase/README.md](supabase/README.md). **Nunca edite migrations já aplicadas** — sempre crie um novo arquivo com timestamp posterior.

## Estrutura de pastas

```
app/
  page.tsx              # Galeria de LPs (/)
  nova/                 # Wizard de criação multi-step
  lp/[slug]/            # Editor de LP
  dashboard/            # Dashboard de contatos/leads
  login/                # Login Causi
  auth/callback/        # Callback OAuth PKCE
  sem-acesso/           # Página informativa (sem plano)
  api/                  # Route Handlers (IA, imagens)
  actions/              # Server Actions (save, delete, config)
components/
  builder/              # Editor, wizard, LpStudio
  preview/              # LandingPreview (renderer único)
  sections/             # Blocos da LP (Hero, Dor, LeadPopup…)
  ui/                   # AppShell, AppSidebar
lib/
  session/              # getSession, guards de acesso
  supabase/             # Clientes (browser, server, admin)
  schema.ts             # Contrato JSON da LP (LpSchema)
  lpStore.ts            # CRUD de landing pages
  focos.ts              # Focos jurídicos e buildSchema
  config.ts             # Configuração global do usuário
supabase/               # Schemas SQL de referência
docs/                   # Documentação
```

## Rotas

| Rota | Autenticação | Plano 9 | Descrição |
|------|:---:|:---:|-----------|
| `/login` | — | — | Login e-mail/senha |
| `/auth/callback` | — | — | Callback OAuth PKCE |
| `/sem-acesso` | — | — | Página informativa |
| `/p/*` | — | — | LPs publicadas (não implementado) |
| `/` | Sim | Sim | Galeria de landing pages |
| `/nova` | Sim | Sim | Wizard de criação (3 passos) |
| `/lp/[slug]` | Sim | Sim | Editor + preview |
| `/dashboard` | Sim | Sim | Dashboard de contatos/leads |

### APIs

| Endpoint | Guard | Descrição |
|----------|-------|-----------|
| `POST /api/gerar-lp` | `requireLpSession` | Geração de LP via IA |
| `POST /api/melhorar-texto` | Nenhum* | Reescrita de texto via IA |
| `POST /api/melhorar-imagem` | Nenhum* | Processamento de imagem |
| `POST /api/imagem` | Nenhum* | Upload/busca de imagem |

> \* **Lacuna de segurança:** estas APIs não verificam plano — qualquer usuário autenticado pode consumi-las. Ver [docs/features/authentication.md](docs/features/authentication.md#lacunas-e-recomendações).

## Controle de acesso

Três camadas:

1. **Middleware** — valida autenticação Supabase; rotas públicas passam direto.
2. **`requireLpAccess()`** — Server Components; redireciona sem plano 9.
3. **`requireLpSession()`** — Server Actions e APIs; lança erro JSON.

O plano é resolvido via RPC `get_current_user_details_v4` no Projeto A, com cache por request (`React.cache()`). Se a RPC falhar, `plan` retorna `null` e o usuário é bloqueado — sem distinção de erro de provisionamento.

## Deploy e domínios

Hospedagem na **Vercel**, DNS na **Cloudflare**, registro no **Registro.br**. Dois contextos de host:

| Host | Função |
|------|--------|
| `marketing.causi.com.br` | App SaaS (login, dashboard, editor) |
| `{office}.causi.adv.br` | Landing pages públicas dos escritórios |

O apex/`www` de `causi.adv.br` redireciona (308) para o marketing na borda Cloudflare — não são tenants. LPs usam wildcard (`*.causi.adv.br`) com certificado via delegação `_acme-challenge` para a Vercel (sem migrar nameservers para `vercel-dns`).

```
Registro.br → Cloudflare (DNS + Redirect Rules) → Vercel (Next.js + TLS)
```

| URL | Papel |
|-----|-------|
| `https://marketing.causi.com.br` | App principal |
| `https://causi.adv.br` / `www` | Redirect → marketing |
| `https://{office}.causi.adv.br/{slug}` | LP publicada |

Passos (visão geral):

1. **Registro.br** — delegar nameservers de `causi.com.br` e `causi.adv.br` para a Cloudflare.
2. **Cloudflare** — CNAMEs apontando aos hostnames do painel Vercel; Redirect Rules apex/`www` → marketing; DNS only até domínio Valid.
3. **Vercel** — adicionar `marketing.causi.com.br`, `causi.adv.br`, `www` e `*.causi.adv.br`.

Guia completo (DNS, SSL wildcard, checklist, troubleshooting): [docs/guides/deploy-registrobr-cloudflare-vercel.md](docs/guides/deploy-registrobr-cloudflare-vercel.md).

## Status do MVP

### Implementado

- [x] Login e-mail/senha + guard de plano
- [x] Galeria de LPs
- [x] Wizard de criação multi-step (3 passos)
- [x] Geração de copy via GPT-4o + imagens Unsplash
- [x] Editor com preview ao vivo (modo Simples e Avançado)
- [x] Salvamento de LP (`saveLpAction`)
- [x] Dashboard de contatos com filtros, paginação e export CSV
- [x] Configurações globais (fontes, tracking tags)

### Pendente (bloqueia o produto)

- [ ] Publicação: botão + campos `published` / `client_slug` em `lps`
- [ ] Subdomínio: `[client_slug].localhost` via middleware por host
- [ ] `POST /api/lead` — captura real de leads no popup
- [ ] DDL oficial de `lps` em `gerador.causi.sql`
- [ ] Proteger APIs de IA/imagem com `requireLpSession`

### Pendente (média prioridade)

- [ ] Seleção de template antes do editor (`lib/templates.ts`)
- [ ] Validar `subscription.status` no guard de acesso
- [ ] Dashboard unificado (LPs / Contatos / Marketing)
- [ ] Exibir `answers` e `email` no dashboard de contatos
- [x] Controle de acesso sem redirect externo (`AccessDenied` + toast)

## Documentação

Índice mestre: [docs/README.md](docs/README.md).

| Documento | Conteúdo |
|-----------|----------|
| [docs/architecture.md](docs/architecture.md) | Stack, mapa de pastas, fluxos, variáveis de ambiente |
| [docs/database.md](docs/database.md) | Schema dual-database, RPC, gaps conhecidos |
| [docs/api.md](docs/api.md) | Endpoints e Server Actions |
| [docs/features/authentication.md](docs/features/authentication.md) | Fluxo de auth, guards, matriz de acesso |
| [docs/features/landing-pages.md](docs/features/landing-pages.md) | Templates, editor, publicação, schema JSON |
| [docs/features/leads.md](docs/features/leads.md) | Captura de leads, dashboard, export |
| [docs/guides/deploy-registrobr-cloudflare-vercel.md](docs/guides/deploy-registrobr-cloudflare-vercel.md) | Deploy DNS/SSL: Registro.br + Cloudflare + Vercel |

## Convenções

- **UI em português**, código em inglês (funções, tipos, identificadores).
- `service_role` nunca exposto ao browser — apenas em funções server-side.
- Toda query no Projeto B deve filtrar por `causi_user_id`.
- Um único renderer (`LandingPreview`) para editor, preview e site publicado.
- Copy gerada respeita o Provimento OAB 205/2021 (sobriedade jurídica).
