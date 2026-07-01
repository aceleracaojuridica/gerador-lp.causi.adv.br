# Banco de Dados

Este documento descreve a arquitetura dual-database do Gerador de Landing Pages Causi, as tabelas relevantes, o contrato da RPC de billing e os gaps conhecidos no schema.

## Visão geral

O sistema utiliza **dois projetos Supabase independentes**:

| Projeto | Variáveis de ambiente | Responsabilidade |
|---------|----------------------|------------------|
| **A — Causi** | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Autenticação (`auth.users`), contas, assinaturas e planos (`billing.*`) |
| **B — Gerador LP** | `LP_SUPABASE_URL`, `LP_SUPABASE_SERVICE_ROLE_KEY` | Landing pages, leads, configurações globais do usuário |

O Projeto A é o banco **externo** do ecossistema Causi. O Projeto B é dedicado exclusivamente aos dados do gerador de LPs e é acessado via `service_role` (bypass de RLS) no servidor.

```mermaid
erDiagram
  subgraph projetoA [Projeto A - Causi]
    auth_users ||--o| accounts : created_by
    accounts ||--o{ subscriptions : has
    subscriptions }o--|| plans : plan_id
    plans {
      bigint id PK
      text name
      text slug
      jsonb features
      smallint tier_level
    }
  end

  subgraph projetoB [Projeto B - Gerador LP]
    users ||--o{ lps : causi_user_id
    users ||--o| user_settings : causi_user_id
    lps ||--o{ leads_gerador : lp_id
    users {
      uuid id PK
      text causi_user_id UK
      text email
      text plan
    }
    lps {
      uuid id PK
      text causi_user_id FK
      text slug
      jsonb schema
    }
    leads_gerador {
      uuid id PK
      text causi_user_id
      uuid lp_id FK
      jsonb answers
    }
    user_settings {
      uuid id PK
      text causi_user_id FK
      text custom_domain
      jsonb tracking_tags
    }
  end
```

## Projeto A — Causi (`supabase/causi.sql`)

Schema de referência do banco externo. As tabelas de billing **não são expostas diretamente** via PostgREST ao gerador; o acesso ocorre via RPC.

### `billing.plans`

Catálogo de planos comerciais do Causi.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | `bigint` | PK (identity) |
| `name` | `text` | Nome exibido (ex: "Landing Pages") |
| `slug` | `text` | Identificador único (ex: `landing_pages`) |
| `features` | `jsonb` | Flags de funcionalidades do plano |
| `tier_level` | `smallint` | Nível hierárquico |
| `is_active` | `boolean` | Plano disponível para venda |
| `base_price` | `numeric` | Preço base |
| `base_limits` | `jsonb` | Limites (usuários, canais, etc.) |

**Plano exigido pelo gerador:** `id = 9` (`slug: landing_pages`). Confirmado em `supabase/example.json` e em `lib/session/access.ts` (`LP_PLAN_ID = 9`).

### `billing.subscriptions`

Assinatura ativa de uma conta a um plano.

| Coluna relevante | Descrição |
|------------------|-----------|
| `account_id` | FK → `public.accounts` |
| `plan_id` | FK → `billing.plans` |
| `status` | Estado da assinatura (`active`, `pending`, `cancelled`, etc.) |
| `start_date`, `end_date` | Vigência |
| `trial_start_date`, `trial_end_date` | Período de trial |

### `public.accounts`

Conta/escritório no Causi.

| Coluna relevante | Descrição |
|------------------|-----------|
| `id` | PK |
| `name` | Nome do escritório |
| `slug` | Identificador único |
| `status` | `active` por padrão |
| `created_by_user_id` | FK → `auth.users` |

### `public.users`

Usuários internos do Causi (distinto de `auth.users`).

---

## RPC `get_current_user_details_v4`

Função exposta no PostgREST do Projeto A, consumida por `lib/session/get-session.ts`. **Não está versionada neste repositório** — vive no banco Causi em produção.

### Contrato esperado (campos consumidos)

```typescript
type CurrentUserDetailsRow = {
  account_id: number | string | null;
  account_name: string | null;
  subscription: {
    plan_id: number | null;
    plan_name: string | null;
    plan_slug: string | null;
    plan_tier_level: number | null;
    status: string | null;
  } | null;
  plan_features: Record<string, boolean> | null;
};
```

### Comportamento

1. Junta o usuário autenticado (`auth.uid()`) à conta e assinatura ativa.
2. Retorna `subscription.plan_id` quando há assinatura com plano associado.
3. Retorna `plan_features` a partir de `billing.plans.features`.
4. Se não houver assinatura ativa, `subscription` pode vir com campos nulos.

### Uso no gerador

- `getSession()` chama a RPC e monta `session.plan` e `session.features`.
- `hasLpAccess()` compara `session.plan.id === 9`.
- **Não valida** `subscription.status` nem features individuais — apenas o ID do plano.

---

## Projeto B — Gerador LP (`supabase/migrations/`)

Banco compartilhado com o Lovable. Acesso do gerador via `supabaseAdmin()` (service role).

### `public.landing_pages`

Landing pages do CRM/gerador — schema JSON completo (`lib/schema.ts` → `LpSchema`).

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | `uuid` | PK |
| `causi_user_id` | `text` | Dono (`session.user.id` do Causi Auth) |
| `profile_id` | `uuid` | FK opcional → `profiles.id` quando o usuário tem site Lovable |
| `slug` | `text` | Identificador **global único** (`UNIQUE (slug)`) — vira subdomínio `{slug}.causi.adv.br` |
| `name` | `text` | Nome exibido na galeria |
| `tema` | `text` | Foco/área (ex.: direito previdenciário) |
| `schema` | `jsonb` | Conteúdo e layout da LP |
| `created_at` / `updated_at` | `timestamptz` | Auditoria |

> **Identificador de escopo:** CRUD em `lib/lpStore.ts` filtra por `causi_user_id`. O vínculo com o Lovable é opcional: `profile_id` só é preenchido quando `causi_user_id` é UUID e existe linha correspondente em `profiles`.

### `public.user_settings`

Configuração global por usuário (vale para todas as LPs dele).

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `causi_user_id` | `text` | UK — mesmo valor de `session.user.id` (sem tabela `users`) |
| `heading_font` | `text` | Fonte de títulos |
| `body_font` | `text` | Fonte de corpo |
| `tracking_tags` | `jsonb` | Scripts GTM/Pixel: `{ head, body, footer }` |
| `custom_domain` | `text` | Domínio personalizado (publicação futura) |
| `updated_at` | `timestamptz` | Última atualização |

### `public.leads` (Lovable + dashboard do gerador)

Leads capturados em sites publicados, escopo por `subdomain` (via `profiles.subdomain`).

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | `bigint` | PK (identity) |
| `nome` | `text` | Nome do lead |
| `telefone` | `text` | Telefone |
| `page_url` | `text` | URL da captura |
| `subdomain` | `text` | Subdomínio do escritório |
| `created_at` | `timestamptz` | Data/hora |

**Removidas:** `public.users`, `public.lps`, `public.leads_gerador`, coluna `profiles.pages`.

---

## Índices recomendados

```sql
-- Projeto B
CREATE INDEX idx_landing_pages_user ON public.landing_pages (causi_user_id);
CREATE INDEX idx_leads_subdomain_created ON public.leads (subdomain, created_at DESC);
```

---

## Relacionamentos e regras de negócio

| Regra | Implementação |
|-------|---------------|
| Um usuário pode ter N landing pages | Sem limite; cada LP com `slug` global único |
| Slug não se repete | `UNIQUE (slug)` + alocação em `lib/slug.ts` na geração |
| Leads pertencem ao escritório | Dashboard filtra `leads` por `profiles.subdomain` |
| Plano de acesso | Validado no Projeto A (`plan_id = 9`), nunca no Projeto B |
| Dados de LP isolados por usuário | `lpStore` filtra por `causi_user_id` em `landing_pages` |
| Service role no Projeto B | Bypassa RLS; escopo manual no código da aplicação |

---

## Gaps conhecidos

| Gap | Impacto | Ação recomendada |
|-----|---------|------------------|
| RPC não versionada no repo | Dependência implícita do banco Causi | Documentar contrato (este doc) e versionar migration no Causi |
| Dados legados com `causi_user_id` não-UUID (ex.: `superadmin`) | `profile_id` fica NULL; LP ainda funciona por `causi_user_id` | Limpar dados de teste ou remapear usuário real |
| `answers` de leads legados não migrados para `leads` | Campos extras de `leads_gerador` perdidos na migração | Avaliar se ainda são necessários no dashboard |

---

## Referências no código

- `lib/lpStore.ts` — CRUD de `landing_pages`
- `lib/config.ts` — leitura/escrita de `user_settings`
- `app/dashboard/page.tsx` — leitura de `public.leads` por `subdomain`
- `lib/session/get-session.ts` — RPC do Projeto A
- `supabase/causi.sql` — schema de referência Causi
- `supabase/gerador.causi.sql` — schema de referência Gerador LP

## Acesso aos dados (CRUD)

Operações no Projeto B usam `lpAdmin()` (service_role) com escopo `causi_user_id`. Mutações expostas ao browser passam por Server Actions em `app/actions/`. Guia completo: [server-actions.md](server-actions.md).

## Tabelas do Lovable no Projeto B (não tocar)

O Projeto B é compartilhado com o Lovable. Duas tabelas pertencem ao fluxo do Lovable e não estão documentadas em `gerador.causi.sql` porque não são responsabilidade do LP Builder:

| Tabela | Dono | Descrição |
|--------|------|-----------|
| `public.profiles` | Lovable | Registro de subdomínios (`id`, `subdomain`) — gerador não grava em `pages` |
| `public.leads` | Lovable + Gerador | Leads por `subdomain` |
| `public.landing_pages` | Gerador | LPs com `schema` jsonb; `profile_id` opcional |

Ver [integrations.md](integrations.md) para a estratégia de convivência e reuso.
