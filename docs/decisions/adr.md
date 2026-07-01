---
title: ADR — Architecture Decision Record
description: Decisões de arquitetura aprovadas — stack, SDK, auth, integrações e padrões
---

# ADR — Architecture Decision Record

Registro das decisões de arquitetura do projeto Causi. Este documento registra **o quê** foi decidido e **por quê**. Para detalhes de implementação, consulte a documentação técnica correspondente.

---

## ADR-001: Stack Tecnológica

**Status:** Aprovado
**Data:** 2026-03-03

| Camada | Decisão |
|--------|---------|
| Frontend | Next.js 16+ (App Router, React Server Components) |
| Backend | Next.js Server Actions + Route Handlers + Supabase SDK |
| Banco de dados | Supabase Postgres (schemas: `public`, `billing`, `classroom`) |
| Autenticação | Supabase Auth (email/senha, convite) |
| Realtime | Supabase Realtime (Postgres Changes) |
| Integrações | Evolution API, UazAPI, WAHA, WhatsApp Cloud API |
| Hospedagem | Vercel (frontend) + Supabase Cloud |
| Serverless | Supabase Edge Functions (Deno) |

**Justificativa:** Stack unificada com Supabase reduz complexidade de integração (Auth, RLS, Realtime, Storage na mesma plataforma). Next.js App Router é o padrão moderno para aplicações React com SSR.

> Detalhes: [architecture/overview.md](../architecture/overview.md)

---

## ADR-002: Supabase SDK Exclusivo (sem ORMs)

**Status:** Aprovado

O projeto usa **exclusivamente o Supabase SDK** (`@supabase/supabase-js` + `@supabase/ssr`). Prisma, Drizzle ou outros ORMs **não são permitidos**.

**Justificativa:**
- O SDK respeita RLS nativamente — ORMs bypassam RLS, risco crítico em multi-tenant
- SDK integra Auth, Realtime e Storage na mesma API
- Supabase CLI cobre versionamento de schema (gap que ORMs resolveriam)

> Detalhes: [architecture/overview.md](../architecture/overview.md)

---

## ADR-003: React Query e Zustand Não Adotados

**Status:** Adiado (adicionar quando a dor concreta justificar)

- **React Query:** App Router + Server Components resolvem data fetching nativamente. Revalidação via `revalidatePath`/`revalidateTag`.
- **Zustand:** Dados de sessão (user, account, plan) não mudam durante a sessão. React Context nativo é suficiente.

> Detalhes: [architecture/overview.md](../architecture/overview.md)

---

## ADR-004: Formas de Acesso e Provisionamento

**Status:** Aprovado

A plataforma possui **quatro formas de acesso**, cada uma com mecanismo distinto controlado por RLS:

1. **Plano Gratuito (self-service)**: Qualquer pessoa pode se cadastrar em `/cadastrar` sem código ou convite. A RLS permite criar assinatura com `plan_id = 1` (gratuito) automaticamente. Dá acesso a cursos básicos do `classroom`, sem CRM.
2. **Plano Educacional (LP externa)**: Uma Landing Page externa (fora deste repositório) registra o código `EDU_CLASSROOM_2026` nos metadados (`raw_user_meta_data`) do usuário no Supabase Auth. Com esse código, a RLS permite criar assinatura com `plan_id = 8` (educacional), que libera cursos premium do `classroom`. Sem o código, a inserção é bloqueada pela RLS.
3. **CRM (provisionamento pelo Super Admin)**: O acesso ao produto CRM é 100% administrativo. O Super Admin cria o usuário em `auth.users` via Supabase Auth (suas políticas RLS `Full access` dispensam `service_role`), chama a RPC `admin_complete_user_registration` para criar `public.users` + `accounts` + pipeline inicial, e ativa a assinatura via Edge Function `admin-subscriptions-handler`. Tudo após negociação/pagamento manual fora da plataforma. Não existe self-service de trial para CRM (planejado para versão futura).
4. **Convite (membros adicionais)**: O owner/admin de uma conta CRM convida novos membros via `account_invitations` quando o plano permite múltiplos usuários. O convite gera um token enviado por e-mail para `/convite?token=...`.
5. **Expiração**: Quando uma assinatura expira, a conta é rebaixada automaticamente para o plano gratuito.

**Justificativa:** O modelo B2B (CRM) requer provisionamento administrativo para controle de onboarding e alinhamento com o processo comercial manual atual. O plano gratuito e educacional têm acesso controlado por RLS — sem intervenção administrativa, mas com restrições determinísticas no banco.

> Detalhes: [architecture/auth.md](../architecture/auth.md)

---

## ADR-005: Isolamento Multi-Tenant por `account_id`

**Status:** Aprovado

Todas as tabelas operacionais possuem `account_id` (direto ou via entidade pai). RLS usa `account_id` como base de isolamento. `account_id` **deve ser incluído** em todas as queries, mesmo com RLS ativo.

**Justificativa:** Cada conta representa um escritório de advocacia com dados confidenciais de clientes. O isolamento por `account_id` garante que dados de um escritório nunca sejam acessíveis por outro. Usuários multi-account (via `users_accounts`) podem acessar mais de uma conta, tornando o filtro explícito de `account_id` obrigatório além do RLS.

> Detalhes: [architecture/auth.md](../architecture/auth.md)

---

## ADR-006: Edge Functions para Webhooks e Billing

**Status:** Aprovado

Webhooks de provedores de WhatsApp são processados por Edge Functions do Supabase (não por API Routes do Next.js). Gestão de assinaturas também via Edge Function.

**Justificativa:**
- Edge Functions usam `SERVICE_ROLE_KEY` para bypass de RLS (necessário para webhooks)
- Execução serverless na edge (baixa latência)
- Isolamento de lógica sensível fora do frontend

> Detalhes: [architecture/integrations.md](../architecture/integrations.md), [edge-functions/overview.md](../edge-functions/overview.md)

---

## ADR-007: Supabase CLI para Schema Management (Declarative Database Schemas)

**Status:** Aprovado

O projeto utiliza **schemas SQL declarativos** em `supabase/schemas/` como fonte de verdade. Alterações devem ser feitas nos arquivos `.sql` declarativos, e o CLI gera migrations automaticamente via `supabase db diff -f <nome>`. Migrations nunca devem ser editadas diretamente. SQL Editor apenas para consultas.

**Justificativa:** Versionamento, auditabilidade e reprodutibilidade de schema. Schemas declarativos garantem que a fonte de verdade seja legível e o CLI cuida da geração de migrations.

> Detalhes: [database/overview.md](../database/overview.md)

---

## ADR-008: Features e Limites no Banco (Database-as-Source-of-Truth)

**Status:** Aprovado

Planos, features e limites são definidos em `billing.plans` (jsonb). O frontend renderiza o estado do backend — nunca calcula limites localmente. Features fora do plano aparecem na UI **desabilitadas com CTA de upgrade**, nunca ocultas.

**Justificativa:** Centraliza regras de negócio no banco. Evita inconsistências entre frontend e backend. Permite o super admin ajustar planos sem deploy.

> Detalhes: [features/subscriptions.md](../features/subscriptions.md), [references/plans-and-features.md](../references/plans-and-features.md)

---

## ADR-009: Realtime via Supabase Postgres Changes

**Status:** Aprovado

Notificações em tempo real (novas mensagens, atualizações de deals) via Supabase Realtime com filtro por `account_id`. Kanban usa optimistic updates via `useOptimistic`.

**Justificativa:** Integração nativa com Supabase, sem necessidade de infraestrutura adicional de pub/sub.

> Detalhes: [architecture/overview.md](../architecture/overview.md)
