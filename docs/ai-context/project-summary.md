---
title: Resumo do Projeto (AI Context)
description: Resumo denso de 1 página para dar contexto rápido a agentes de IA
---

# Causi — Resumo do Projeto

**O que é:** SaaS vertical para advogados. CRM Kanban + Inbox WhatsApp + Agente IA + Follow-up automático.

**Stack:**

| Camada | Tecnologia |
|--------|-----------|
| **Frontend** | Next.js 16 (App Router, React Server Components), React 19, Tailwind CSS 4, Shadcn UI |
| **Backend / BFF** | Next.js Route Handlers, Server Actions, Supabase SDK |
| **Banco de Dados** | Supabase Postgres (schemas: `public`, `billing`, `classroom`) |
| **Autenticação** | Supabase Auth (email/senha, convite) |
| **Realtime** | Supabase Realtime (Postgres Changes) |
| **Serverless** | Supabase Edge Functions (Deno) |
| **Storage** | Supabase Storage |
| **Integrações** | Evolution API, UAZAPI, WAHA, WhatsApp Cloud API |
| **Qualidade de Código** | Biome (lint + format), Husky (pre-commit + pre-push), Zod, TypeScript 5 |
| **Hospedagem** | Vercel (frontend) + Supabase Cloud |
| **Gerenciador de Pacotes** | pnpm |

**Multi-tenant:** Isolamento por `account_id` em todas as tabelas. RLS obrigatório. `account_id` deve ser incluído em todas as queries (mesmo com RLS).

**Banco:** 3 schemas PostgreSQL:
- `public` (24 tabelas) — accounts, users, roles, deals, persons, conversations, messages, channels, agents, tasks, pipelines, tags, organizations, etc.
- `billing` (7 tabelas) — plans, plan_periods, addons, addon_prices, subscriptions, subscription_addons, payments
- `classroom` (7 tabelas) — courses, modules, lessons, attachments, certificate_templates, user_certificates, user_progress

**Auth:** Supabase Auth (email/senha). Quatro formas de acesso: 
1. **Gratuito** — self-service em `/cadastrar`, sem código; cursos básicos do classroom, sem CRM;
2. **Educacional** — LP externa grava código `EDU_CLASSROOM_2026` nos metadados do usuário; RLS libera plano educacional com cursos premium, sem CRM;
3. **CRM** — Super Admin provisiona conta + assinatura após contrato manual, sem self-service (planejado para versão futura);
4. **Convite** — owner/admin convida membros adicionais via `account_invitations`. Expiração de plano = downgrade automático para plano gratuito. 

**Roles:** 5 roles: `super_admin` (999), `support_admin` (150), `owner` (100), `admin` (50), `user` (20). Permissões granulares em jsonb: `{"recurso": ["create","read","update","delete"]}`.

**Conta principal vs adicional:** `users.account_id` = conta principal. `users_accounts` = contas adicionais (compartilhadas). Owner = role com slug `owner` (via `role_id`).

**Planos ativos:** Essencial (R$127, 1K contatos, 1 user, sem IA), Profissional (R$347, 2.5K, 3 users, com IA), Avançado (R$597, 5K, 5 users, com IA). Planos suportam trial (criado pelo Super Admin via `/admin-contas`), 1 canal WhatsApp base. Addons expandem limites. Ao expirar, conta é rebaixada para plano gratuito.

**Integrações WhatsApp:** Evolution API, UazAPI, WAHA, WhatsApp Cloud API. Webhooks recebidos via Edge Functions. Mensagens normalizadas para modelo interno.

**Fluxo de lead:** Mensagem WhatsApp → Edge Function → `find_or_create_contact_flow_v2` (person + deal + conversation) → `messages_queue` → IA qualifica → Realtime atualiza Kanban/Inbox → Follow-up se sem resposta → Advogado assume (handoff).

**Acesso a dados:** Exclusivamente Supabase SDK (`@supabase/ssr`). Sem ORMs. `createBrowserClient` para Client Components, `createServerClient` para Server/Actions. `SERVICE_ROLE_KEY` apenas em Edge Functions para bypass RLS em webhooks (super admins possuem políticas RLS `Full access` para acesso cross-account sem necessidade de bypass).

**Edge Functions:** `admin-subscriptions-handler` (billing), `channel-sync-webhook` (sincronizar canais), `evolution/uazapi/waha-webhook-handler` (mensagens), `subscriptions-lifecycle-cron-v2` (expiração de trials e assinaturas).

**Rotas:** `/` = Dashboard (privado). `/conversas`, `/oportunidades/[pipelineId]`, `/pessoas`, `/agentes`, `/tarefas`, `/canais`. Admin em `/admin-contas` (super_admin, grupo `(admin)/` separado). Auth em `/cadastrar`, `/login`, `/redefinir` (grupo `(auth)/`).

**Documentação:** Todas as docs em PT-BR, nomes de arquivos/pastas em inglês. Schema SQL em `supabase/schemas/<schema>/`. Docs em `docs/`.

---

## Arquivos Importantes

| O que | Onde |
|-------|------|
| Docs completos | `docs/` |
| Schema SQL | `supabase/schemas/{public,billing,classroom}/tables/` |
| Funções SQL | `supabase/schemas/{public,billing,classroom}/functions/` |
| RLS | `supabase/schemas/{public,billing,classroom}/rls/` |
| Edge Functions | `supabase/functions/` |
| Supabase Client | `lib/supabase/client.ts` (browser), `lib/supabase/server.ts` (server) |
| Tipos gerados | `src/lib/database.types.ts` |
