# Phase 1 — Audit Report (Documentation Reorganization)

**Date:** 2026-03-26
**Scope:** All files in `docs/`, `docs/*` subfolders, `README.md`, and cross-references

---

## 1. File-by-File Status

### Root-level docs (`docs/`)

| # | File | Status | Reason |
|---|------|--------|--------|
| 1 | `000-docs-index.md` | **DROP** | Replaced by new `docs/README.md`. References deleted files (`supabase.example.json`, old SQL paths). Lists entities selectively, giving wrong impression of scope. |
| 2 | `001-database.md` | **REWRITE** | References 15+ deleted SQL files at old paths. Seed example uses wrong column names (`price_monthly`, `id` as uuid). Claims Supabase Vault is used (unconfirmed). Mixes unrelated topics (super admin ops, admin panel). Entity "aluno" doesn't exist. |
| 3 | `002-RBAC.md` | **REWRITE** | 830+ lines covering 5+ unrelated topics (roles, RLS, billing, plans, addons, invite flow). Multiple contradictions within same file (sections 2.2.3 vs 13.5 have different permission extracts). Incorrect info: users_accounts usage, invite flow, account switching, auth.users fields, account_id requirement in queries, permission matrix. Contains checklists that don't belong in reference docs. |
| 4 | `003-billing.md` | **REWRITE** | Wrong column names (`base_price_cents` → should be `base_price`; `unit_price_cents` → `unit_price`). Wrong id types (uuid → should be int8/bigint). Wrong INSERT structures. Claims subscriptions record addons directly. Still describes project as MVP. Addon prices don't match database. RLS examples are incorrect. Contains env vars and checklists that don't belong. |
| 5 | `004-pages-and-navigation.md` | **REWRITE** | Content is largely valid but very long (1154 lines). Should be split: route index goes to `api/routes.md`, page specs go to feature docs, component suggestions go to `components/`. Not covered by review-docs — needs validation against current app state. |
| 6 | `005-edge-functions.md` | **KEEP** | Good index of edge functions with CLI commands. Move to `edge-functions/` as-is or merge into overview. Minor: "Executar e Testar Localmente" section is empty. |
| 7 | `006-sistema-de-storage.md` | **KEEP** | Well-structured storage documentation. Bucket descriptions, RLS patterns, Next.js integration. Needs minor path updates for new structure. |
| 8 | `007-frontend-limit-validations.md` | **MERGE INTO** `design/overview.md` | Small file (31 lines) about toast patterns. Too small to be standalone; belongs in design/UX patterns. |
| 9 | `008-tratamento-de-erros.md` | **MERGE INTO** `design/overview.md` | Small file (66 lines) about error handling patterns. Complements 007 — both are UX patterns. |
| 10 | `009-components-composition.md` | **MERGE INTO** `components/overview.md` | Component organization rules, naming conventions, NUQS state management. Good content for components doc. |
| 11 | `adr.md` | **REWRITE** | Solid stack decisions (SDK, CLI, auth) mixed with wrong data. `PLAN_FEATURES` object uses wrong keys (`has_ai`, `has_followup` vs real `agents`, `conversations`). References non-existent `channel_connections` table. Code examples use wrong routes (`/dashboard` instead of `/`). Plans/billing sections duplicate other docs. |
| 12 | `prd.md` | **REWRITE** | Good product vision and user stories, but: references deleted `supabase.example.json`; contradicts itself on signup (says no open signup, then mentions educational signup); says IA is "out of scope" but agents are core; still has MVP-era language; PRD V2 section appended at the end duplicates/contradicts V1 content. |
| 13 | `helpers.md` | **MERGE INTO** `database/overview.md` | 60-line file duplicating CLI commands from `001-database.md`. Contains project ref ID that should be in a setup guide. |
| 14 | `implementation-step_001.md` | **DROP** | Implementation task tracker (todo list). Not reference documentation — project management artifact. |
| 15 | `IMPLEMENTATION_STATUS.md` | **DROP** | Exact duplicate of `implementation-step_001.md`. Same content, same file. |
| 16 | `src-structure.mmd` | **DROP** | Mermaid diagram file. Can be regenerated from folder structure. Not referenced by any doc. |

### Database subfolder (`docs/database/`)

| # | File | Status | Reason |
|---|------|--------|--------|
| 17 | `001-public_schema.md` | **REWRITE** | Good 3-layer structure, but references deleted `./public-schema.supabase.sql`. Contains some corrections from review that were applied (users_accounts clarification), but still needs path updates to `supabase/schemas/public/`. |
| 18 | `002-billing_schema.md` | **REWRITE** | Too brief (58 lines). Missing column details, all relationships, and current data. Doesn't list all tables. Needs to be generated from `billing.sql` source. |
| 19 | `003-classroom_schema.md` | **REWRITE** | Similar to billing — too brief. Missing column details. Needs generation from `classroom.sql` source. |
| 20 | `004-rls.md` | **KEEP** (update paths) | Good summary of RLS patterns and helper functions. References `./RLS` folder → must change to `supabase/schemas/<schema>/rls/`. |
| 21 | `005-triggers.md` | **KEEP** (update paths) | Good trigger summary. References `./Triggers` → must change to `supabase/schemas/<schema>/triggers/`. |
| 22 | `006-functions.md` | **KEEP** (update paths) | Good function summary. References `./Functions/` → must change to `supabase/schemas/<schema>/functions/`. |
| 23 | `007-constraints.md` | **KEEP** (update paths) | Good constraints summary. References old paths → must update. |
| 24 | `008-views.md` | **KEEP** (update paths) | Excellent views documentation with performance justification. References `./Views` → must update to `supabase/schemas/<schema>/views/`. |
| 25 | `009-connection-troubleshooting.md` | **MERGE INTO** `database/overview.md` | CLI troubleshooting (3.4K). Useful but too niche for standalone file. |

### Edge Functions (`docs/edge-functions/`)

| # | File | Status | Reason |
|---|------|--------|--------|
| 26 | `admin-subscriptions-handler.md` | **KEEP** | Well-documented edge function. Lifecycle, input/output, and flow are clear. |
| 27 | `channel-sync-webhook.md` | **KEEP** | Good webhook documentation. |
| 28 | `evolution-webhook-handler-v2.md` | **KEEP** | Good webhook documentation. |
| 29 | `subscriptions-lifecycle-cron-v2.md` | **KEEP** | Good cron job documentation. |
| 30 | `uazapi-webhook-handler.md` | **KEEP** | Good webhook documentation. |
| 31 | `waha-webhook-handler.md` | **KEEP** | Good webhook documentation. |

### Guides (`docs/guides/`)

| # | File | Status | Reason |
|---|------|--------|--------|
| 32 | `nextjs-guia-completo.md` | **KEEP** | External framework reference guide. Still valid. |
| 33 | `shadcn.md` | **KEEP** | Shadcn/UI design tokens and patterns guide. Still valid. |
| 34 | `typescript-e-zod.md` | **KEEP** | TypeScript + Zod validation guide. Still valid. |

### V2 (`docs/v2/`)

| # | File | Status | Reason |
|---|------|--------|--------|
| 35 | `courses-platform.md` | **REWRITE** | References plan types (`courses`, `app`, `app_courses`) that don't exist in the actual schema. The real features system uses `classroom` and `classroom_premium` flags in `billing.plans.features`. Needs realignment with actual database. |
| 36 | `asaas-integration.md` | **DELETED** | Already removed from git. |
| 37 | `whatsapp-business-api.md` | **DELETED** | Already removed from git. |

### Design (`docs/design/`)

| # | File | Status | Reason |
|---|------|--------|--------|
| 38 | `design_analysis.md` | **MERGE INTO** `design/overview.md` | Design system analysis (31 lines). Good content about OKLCH, typography, shadows. Belongs in a broader design doc. |

### Root

| # | File | Status | Reason |
|---|------|--------|--------|
| 39 | `README.md` | **REWRITE** | References old doc paths. Typo "Docuemntações" at L482. Route structure duplicates `004-pages-and-navigation.md`. Skills/rules tables need sync with actual files. Doc index table needs updating for new structure. |

---

## 2. Broken References

### Deleted files still referenced by docs

| Referenced Path | Referenced By | Status |
|-----------------|--------------|--------|
| `docs/database/supabase.example.json` | `000-docs-index.md`, `001-database.md`, `prd.md` | **DELETED** |
| `docs/database/public-schema.supabase.sql` | `001-database.md`, `database/001-public_schema.md` | **DELETED** (moved to `supabase/schemas/`) |
| `docs/database/billing-schema.supabase.sql` | `001-database.md` | **DELETED** |
| `docs/database/classroom-schema.supabase.sql` | `001-database.md`, `v2/courses-platform.md` | **DELETED** |
| `docs/database/Constraints/*.sql` (6 files) | `001-database.md` | **DELETED** (moved to `supabase/schemas/*/constraints/`) |
| `docs/database/Functions/*.sql` (30+ files) | `001-database.md`, `database/006-functions.md` | **DELETED** (moved to `supabase/schemas/*/functions/`) |
| `docs/database/RLS/*.sql` (25+ files) | `001-database.md`, `002-RBAC.md`, `003-billing.md`, `database/004-rls.md` | **DELETED** (moved to `supabase/schemas/*/rls/`) |
| `docs/database/Triggers/*.sql` (20+ files) | `001-database.md`, `database/005-triggers.md` | **DELETED** (moved to `supabase/schemas/*/triggers/`) |
| `docs/database/Views/*.sql` (18+ files) | `001-database.md`, `database/008-views.md` | **DELETED** (moved to `supabase/schemas/*/views/`) |

### Wrong internal links

| Wrong Link | Found In | Correct Path |
|------------|----------|-------------|
| `./001a-public_schema.md` | `002-RBAC.md` L672 | `./database/001-public_schema.md` |
| `./001b-billing_schema.md` | `002-RBAC.md` L673 | `./database/002-billing_schema.md` |
| `/dashboard` (route) | `adr.md` middleware example | `/` (root is the dashboard) |
| `/signin` (route) | `002-RBAC.md` L267, `adr.md` L121 | `/auth/login` |
| `channel_connections` (table) | `adr.md` L301, L319 | Does NOT exist — channels store config directly |

---

## 3. Corrections from `review-docs.md` Mapped to Files

### `000-docs-index.md`
- **[L6/L35]** `supabase.example.json` shouldn't be referenced as important source of truth — only has sample data.
- **[L12/L14/L21]** Don't list specific entities/roles in index — gives incomplete impression.

### `001-database.md`
- **[L16]** Standardize entity names (PT or EN, not mixed).
- **[L18]** Entity "aluno" doesn't exist.
- **[L26]** Supabase Vault claim unconfirmed — Edge Functions use Secrets, not Vault.
- **[L27]** Edge Functions description is incomplete (missing: webhook processing, cronjobs, subscription management, channel sync).
- **[L49]** Clarify CLI suggestion workflow (AI suggests, human executes).
- **[L54]** Don't list SQL file examples in this doc — they belong in dedicated docs.
- **[L103]** Rename `functions/` to `edge-functions/` to avoid confusion with SQL functions.
- **[L114]** Admin panel info doesn't belong in database doc.
- **[L115]** Need to address migrations strategy and dev/prod separation.
- **[L164]** Seed example has wrong columns (`price_monthly`, `id` as uuid, `has_ai`) — doesn't match real `billing.plans` table.
- **[L185]** Super admin operations section is out of place.

### `002-RBAC.md`
- **[L17/L622]** Rewrite mermaid diagrams as text/tables for readability.
- **[L35]** Reorganize to avoid repeating info from other docs.
- **[L46]** Permissions example uses wrong format (`can_delete_deals` vs real `{"deals": ["delete"]}`).
- **[L61/L77]** Super Admin and Suporte Admin are different roles — description conflates them.
- **[L86]** Don't include example RLS that doesn't match real policies.
- **[L219]** `users_accounts` is for ADDITIONAL accounts only — users.account_id is the primary link.
- **[L233]** Owner is identified by `role_id` with slug `owner` on `users` table, NOT by `accounts.created_by_user_id`.
- **[L242]** Invite flow uses `create_account_invitation` function with token generated externally. `validate_account_invitation` checks token validity.
- **[L256]** Invite acceptance creates record in `users` (with account_id), NOT in `users_accounts`.
- **[L267/L268]** No slugs for account switching — uses `account_id` session variable. Routes `/início` and `/login` don't match current docs.
- **[L324]** `name` and `photo` come from `public.users`, NOT `auth.users`.
- **[L357/L358]** Permissions `can_delete_deals`, `can_edit_deals` don't exist — real format is `{"deals": ["create","read","update","delete"]}`.
- **[L400]** `account_id` IS required in all queries for multi-account users — RLS alone is not sufficient.
- **[L449/L453]** RLS examples don't match real policies.
- **[L491]** Permission matrix doesn't match real role permissions from database.
- **[L524]** Plans/billing section should be in billing doc, not RBAC.
- **[L653]** Checklists don't belong in reference documentation.
- **[L666+]** Duplicate/contradictory content about roles/plans/RLS appended after what should be the end.

### `003-billing.md`
- **[L6]** Missing tables: `billing.payments`, `billing.subscription_addons` not fully listed.
- **[L10-L20]** Addons managed via `billing.subscription_addons`, not embedded in `billing.subscriptions`.
- **[L21]** RLS section belongs in RLS doc, not here.
- **[L27-L33]** Should list ALL plans (active + inactive for super admin).
- **[L35-L55]** Structure wrong: id is `int8` not `uuid`; column is `base_price` not `base_price_cents`; features format uses boolean flags per feature name.
- **[L75]** Same id type issue.
- **[L98]** All billing tables use `int8` for id.
- **[L118-L136]** INSERT assumes wrong table structure.
- **[L156-L168]** Column `unit_price_cents` doesn't exist — it's `unit_price`.
- **[L172-L180]** Updates managed via `admin-subscriptions-handler` edge function, not direct SQL.
- **[L182]** Subscriptions managed by admin via `/admin-contas` page + edge function.
- **[L190]** Correct path is `/admin-contas?account={account_id}`.
- **[L238]** RLS already documented in `database/004-rls.md`.
- **[L276/L281]** Backend AND database trigger validate contact limits. Contacts above limit are visible but blocked for editing.
- **[L283-L307]** Redundant duplicate of limit validation function.
- **[L309-L331]** RLS examples are incorrect and already exist elsewhere.
- **[L335-L346]** Env vars belong in project setup, not billing doc.
- **[L350]** Deploy checklists are unnecessary in reference docs.

---

## 4. Gaps — Topics Missing from Documentation

| Gap | Description | Should Go In |
|-----|-------------|-------------|
| **Feature docs** | No dedicated docs for conversations, kanban, contacts, tasks, channels as features. Business rules are scattered across PRD, pages doc, and RBAC. | `features/*.md` |
| **API routes index** | No doc listing Next.js API routes (webhooks, message send, etc.) with purpose and method. | `api/routes.md` |
| **AI context files** | No condensed summary for AI assistants to quickly understand the project. No feature-to-table mapping. No coding conventions file. | `ai-context/` |
| **Plans & features reference** | Real plan data (from `billing.plans`) is scattered and often wrong. No single source showing all plans, features, base_limits with real values. | `references/plans-and-features.md` |
| **Roles & permissions reference** | Real permission data (from `public.roles`) is buried in RBAC doc mixed with incorrect versions. | `references/roles-and-permissions.md` |
| **Statuses & enums reference** | Status values for channels, deals, conversations, etc. are not documented anywhere. | `references/statuses-and-enums.md` |
| **Admin bar / context switching** | Super admin bar and account switching mechanism are mentioned but not documented. | `features/admin-panel.md` or `architecture/auth.md` |
| **Realtime patterns** | Supabase Realtime mentioned in ADR but no implementation guide. | `architecture/overview.md` |
| **Storage RLS details** | Storage doc mentions RLS but doesn't detail the actual policies from `supabase/schemas/storage/rls/`. | `database/storage.md` |
| **Views documentation** | Views have excellent docs in `008-views.md` but no file in the proposed structure. | `database/views.md` |
| **Constraints documentation** | Has its own file in old structure. | `database/constraints.md` |
| **Connection troubleshooting** | Useful CLI troubleshooting. | Merge into `database/overview.md` |

---

## Summary Statistics

- **Total files audited:** 39 (+ 2 already deleted)
- **DROP:** 4 files (000-docs-index, implementation-step_001, IMPLEMENTATION_STATUS, src-structure.mmd)
- **REWRITE:** 14 files (001-database, 002-RBAC, 003-billing, 004-pages, adr, prd, README, database/001-003, v2/courses-platform)
- **KEEP (with path updates):** 14 files (005-edge-functions, 006-storage, database/004-008, all edge-functions/*, all guides/*)
- **MERGE INTO other files:** 5 files (007-frontend-limits, 008-erros, 009-components, helpers, design_analysis)
- **Broken file references:** 100+ links pointing to deleted SQL files
- **Major gaps identified:** 11 missing documentation topics
