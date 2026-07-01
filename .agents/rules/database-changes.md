---
trigger: glob
name: Database Change Rules
description: Safety rules for database changes — migrations, schema, queries.
globs: ["supabase/**", "src/**/*.actions.ts", "src/**/actions/**"]
applyTo: "supabase/**,src/**/*.actions.ts,src/**/actions/**"
---

# Database Change Rules

## Zero Autonomy for DB Commands

The AI MUST NOT autonomously execute any database command:
`supabase db push`, `supabase db pull`, `supabase db diff`, `supabase migration new`, `supabase link`, or any other Supabase CLI command.

**Required flow:**
1. AI **suggests** the command and explains its impact
2. Developer **reviews and executes** manually
3. AI may verify results if asked

> DB commands are irreversible in production and can cause data loss or break RLS policies.

## Schema Changes — Declarative Workflow

1. Edit `.sql` files in `supabase/schemas/<schema>/<type>/`
2. Generate migration via `supabase db diff -f <nome_descritivo>` — diffs schema files against a local shadow DB (requires Docker). **Do NOT use `--linked`** — that would diff against the remote instead of the declared schema files.
3. Review the generated migration. For entities not captured by diff (DML, alter policy, view ownership), create a manual migration with `supabase migration new <nome>`.
4. Apply with `supabase db push` (use `--dry-run` first to preview)
5. Never edit migrations directly — they are generated from schema files
6. Never use SQL Editor to alter schema in production

## Enum Rules

PostgreSQL enums only grow — never remove values. Deprecate in application logic or via SQL comments.

## Full Reference

All conventions (naming, clients, table structure, CLI workflow) are in:
- `docs/ai-context/conventions.md` — coding conventions
- `docs/database/overview.md` — CLI workflow, declarative schemas, environments
