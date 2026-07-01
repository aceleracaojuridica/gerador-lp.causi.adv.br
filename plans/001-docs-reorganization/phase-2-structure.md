# Phase 2 — Approved File Structure

**Date:** 2026-03-26
**Status:** Approved

---

## File Tree

```
docs/
├── README.md                                    # Master index — what to read for each task
│
├── architecture/
│   ├── overview.md                              # Stack, key decisions, system diagram, Realtime patterns
│   ├── auth.md                                  # Auth flow, roles, RLS strategy, invite flow, context switching
│   └── integrations.md                          # WhatsApp providers (Evolution, UAZAPI, WAHA, Meta), webhook flow
│
├── design/
│   └── overview.md                              # Design system (OKLCH, typography, shadows), error handling, UX patterns, toast conventions
│
├── database/
│   ├── overview.md                              # All schemas summary, naming conventions, CLI workflow, troubleshooting
│   ├── schema-public.md                         # Public schema tables: Core, CRM, Communication layers
│   ├── schema-billing.md                        # Billing schema tables: plans, subscriptions, payments
│   ├── schema-classroom.md                      # Classroom schema tables: courses, lessons, certificates
│   ├── functions.md                             # All RPC functions: name, params, purpose (stub → link to supabase/schemas/)
│   ├── triggers.md                              # All triggers: table, event, what it does (stub → link to supabase/schemas/)
│   ├── rls.md                                   # RLS policies explained per table (stub → link to supabase/schemas/)
│   ├── views.md                                 # Database views: summaries, details, classroom views
│   ├── constraints.md                           # Unique constraints and structural limits
│   └── storage.md                               # Supabase Storage: buckets, folder structure, RLS, Next.js integration
│
├── edge-functions/
│   ├── overview.md                              # Edge functions index + Supabase CLI commands
│   ├── admin-subscriptions-handler.md           # Subscription lifecycle management (admin)
│   ├── channel-sync-webhook.md                  # Channel deletion/inactivation sync
│   ├── evolution-webhook-handler-v2.md             # Evolution API webhook processing
│   ├── subscriptions-lifecycle-cron-v2.md       # Cron: trial expiry, plan transitions
│   ├── uazapi-webhook-handler.md                # UAZAPI webhook processing
│   └── waha-webhook-handler.md                  # WAHA webhook processing
│
├── features/
│   ├── conversations.md                         # Inbox/messaging: 3-column layout, realtime, pause/handoff
│   ├── kanban.md                                # Pipeline kanban: deals, stages, drag-and-drop, filters
│   ├── contacts.md                              # Persons + organizations: identifiers, multi-phone/email
│   ├── tasks.md                                 # Task management: statuses, deadlines, deal association
│   ├── channels.md                              # WhatsApp channels: connection, providers, pipeline binding
│   ├── subscriptions.md                         # Billing UI: plans, addons, limits, upgrade flow
│   ├── classroom.md                             # LMS module: courses, lessons, certificates, access control
│   └── admin-panel.md                           # Super admin: account management, subscription CRUD, admin bar
│
├── api/
│   └── routes.md                                # Next.js API routes index: path, method, purpose
│
├── components/
│   └── overview.md                              # Component conventions, naming rules, folder structure, NUQS patterns
│
├── references/
│   ├── plans-and-features.md                    # All plans, prices, base_limits, features (from real DB data)
│   ├── roles-and-permissions.md                 # All roles, access_levels, permission JSONBs (from real DB data)
│   └── statuses-and-enums.md                    # Status values for channels, deals, conversations, subscriptions, etc.
│
├── guides/
│   ├── nextjs.md                                # Next.js App Router development guide (migrated from guides/)
│   ├── shadcn.md                                # Shadcn/UI design tokens and theming guide (migrated from guides/)
│   └── typescript-e-zod.md                      # TypeScript + Zod validation patterns (migrated from guides/)
│
├── decisions/
│   ├── adr.md                                   # Architecture Decision Record (rewritten, stack decisions only)
│   └── prd.md                                   # Product Requirements Document (rewritten, production state)
│
└── ai-context/
    ├── project-summary.md                       # Dense 1-page summary — first file for AI agents
    ├── feature-map.md                            # Features → tables → functions → edge-functions mapping
    └── conventions.md                            # Coding rules, naming, file structure, patterns
```

---

## Source Mapping

| New File | Primary Source(s) | Notes |
|----------|-------------------|-------|
| `README.md` | New | Master index linking to all docs |
| `architecture/overview.md` | `adr.md` (sections 2-5, 9, 11-12) | Stack, SDK, CLI, Realtime, folder structure |
| `architecture/auth.md` | `002-RBAC.md` (sections 1-6, 10), `adr.md` §6 | Auth flow, roles, RLS strategy, invite flow |
| `architecture/integrations.md` | `adr.md` §7, `005-edge-functions.md` | WhatsApp providers, webhook flow |
| `design/overview.md` | `design_analysis.md`, `007-frontend-limit-validations.md`, `008-tratamento-de-erros.md` | Design system + UX patterns merged |
| `database/overview.md` | `001-database.md`, `helpers.md`, `009-connection-troubleshooting.md` | Schema summary, CLI, troubleshooting merged |
| `database/schema-public.md` | `database/001-public_schema.md` + `temp/public.sql` | Full rewrite from SQL source |
| `database/schema-billing.md` | `database/002-billing_schema.md` + `temp/billing.sql` | Full rewrite from SQL source |
| `database/schema-classroom.md` | `database/003-classroom_schema.md` + `temp/classroom.sql` | Full rewrite from SQL source |
| `database/functions.md` | `database/006-functions.md` | Stub — link to `supabase/schemas/*/functions/` |
| `database/triggers.md` | `database/005-triggers.md` | Stub — link to `supabase/schemas/*/triggers/` |
| `database/rls.md` | `database/004-rls.md` | Stub — link to `supabase/schemas/*/rls/` |
| `database/views.md` | `database/008-views.md` | Migrate with path updates |
| `database/constraints.md` | `database/007-constraints.md` | Migrate with path updates |
| `database/storage.md` | `006-sistema-de-storage.md` | Migrate with path updates |
| `edge-functions/overview.md` | `005-edge-functions.md` | Index + CLI commands |
| `edge-functions/*.md` (6 files) | `edge-functions/*.md` | Migrate as-is, verify links |
| `features/conversations.md` | `prd.md` §Caixa de Conversas, `004-pages-and-navigation.md` §/conversas | New: extract from scattered sources |
| `features/kanban.md` | `prd.md` §Pipeline Kanban, `004-pages-and-navigation.md` §/oportunidades | New: extract from scattered sources |
| `features/contacts.md` | `prd.md` §Gestão de Contatos, `004-pages-and-navigation.md` §/pessoas | New: extract from scattered sources |
| `features/tasks.md` | `prd.md` §Gestão de Tarefas, `004-pages-and-navigation.md` §/tarefas | New: extract from scattered sources |
| `features/channels.md` | `prd.md` §Canais, `004-pages-and-navigation.md` §/canais | New: extract from scattered sources |
| `features/subscriptions.md` | `003-billing.md` §3-5, `002-RBAC.md` §8, `004-pages-and-navigation.md` §/assinatura | New: billing UI flow, limits |
| `features/classroom.md` | `v2/courses-platform.md`, `004-pages-and-navigation.md` §/cursos | Rewrite with real schema data |
| `features/admin-panel.md` | `prd.md` §Super Admin, `004-pages-and-navigation.md` §/admin-contas, `002-RBAC.md` §2.2.1 | New: admin panel feature |
| `api/routes.md` | `004-pages-and-navigation.md` route table | Extract route index |
| `components/overview.md` | `009-components-composition.md` | Migrate component conventions |
| `references/plans-and-features.md` | `temp/plans_rows.json`, `temp/plan_periods_rows.json`, `temp/addons_rows.json`, `temp/addon_prices_rows.json` | New: real DB data |
| `references/roles-and-permissions.md` | `temp/roles_rows.json` | New: real DB data |
| `references/statuses-and-enums.md` | `temp/current-data-references.md` | New: real status/enum values |
| `guides/*.md` (3 files) | `guides/*.md` | Migrate as-is |
| `decisions/adr.md` | `adr.md` | Rewrite: keep decisions, remove duplicated data |
| `decisions/prd.md` | `prd.md` | Rewrite: update to production state |
| `ai-context/project-summary.md` | New | Dense AI-first summary |
| `ai-context/feature-map.md` | New, derived from all feature + database docs | Feature → table → function mapping |
| `ai-context/conventions.md` | `009-components-composition.md`, `adr.md` §11, `.agent/rules/` | Coding rules compilation |

---

## Chunk Assignments (Phase 3)

- **Chunk A (database/):** 10 files — `overview.md`, `schema-public.md`, `schema-billing.md`, `schema-classroom.md`, `functions.md`, `triggers.md`, `rls.md`, `views.md`, `constraints.md`, `storage.md`
- **Chunk B (features/):** 8 files — `conversations.md`, `kanban.md`, `contacts.md`, `tasks.md`, `channels.md`, `subscriptions.md`, `classroom.md`, `admin-panel.md`
- **Chunk C (architecture/, design/, edge-functions/, components/, api/):** 12 files — `architecture/overview.md`, `architecture/auth.md`, `architecture/integrations.md`, `design/overview.md`, `edge-functions/overview.md`, 6 edge-function docs, `components/overview.md`, `api/routes.md`
- **Chunk D (references/, ai-context/, guides/, decisions/, root README):** 12 files — 3 references, 3 ai-context, 3 guides, 2 decisions, 1 README

**Total: 42 files** across 4 chunks.
