# Plan: Audit and Rewrite AI Agent Configuration Files

## Context

The Causi project has AI agent configuration spread across `AGENTS.md`, `.agents/rules/` (4 files), and `.claude/rules/` (1 file) — totaling ~930 lines. Best practices research (HumanLayer, AIHero, Philipp Schmid) consensus: AGENTS.md should be <300 lines (ideally <60), use progressive disclosure to `docs/`, and avoid code style rules or SDK examples that inflate token cost.

**Current problems:**
- Files reference stale doc paths (e.g., `docs/000-docs-index.md`, `docs/001a-public_schema.md`)
- Glob triggers reference non-existent source paths (`lib/supabase/**`, `app/api/**`, `server/**`)
- `skills-usage.md` (283 lines) loads on every `src/**` change — massive token waste. Skills already have self-documenting `SKILL.md` files in `.agents/skills/`
- `.claude/rules/test.md` is a full duplicate of `database-changes.md`
- `database-changes.md` embeds 60+ lines of SDK usage examples (select/insert/update/delete/filters) that any LLM already knows
- Multiple files duplicate content from `docs/ai-context/conventions.md`

**Goal:** Reduce from ~930 lines to ~210 lines (−78% token cost) while preserving all critical safety rules and making references accurate.

---

## Phase 1 — Rewrite `AGENTS.md`

**File:** `AGENTS.md` (root)
**Current:** ~115 lines | **Target:** ~55 lines

**Approach:** WHAT-WHY-HOW structure. Progressive disclosure via table of doc paths. No inline code examples. No code style rules (Biome handles that). No skill references (skills self-activate via `SKILL.md`).

**Structure:**
1. One-liner: what Causi is
2. Stack summary (1 line)
3. Multi-tenant note (1 line)
4. "Context — Read Before Coding" table pointing to `docs/ai-context/` and key docs
5. Commands table (dev, build, lint, format, db:types)
6. DB commands table with **NEVER run autonomously** warning
7. Key Rules (6 bullet points: pnpm, Biome, RLS, CLI-only schema, conventions reference, semantic commits)

---

## Phase 2 — Audit `.agents/rules/`

### 2.1 `database-changes.md` — SIMPLIFY

**Current:** ~180 lines | **Target:** ~65 lines

**Keep:**
- Zero Autonomy rule (critical safety)
- Schema changes only via CLI
- What goes in migrations vs code
- Supabase client rules (browser/server/admin)
- Table conventions (UUIDs, timestamps, soft delete, account_id)
- Enum immutability rule

**Remove:**
- SDK usage examples (select/insert/update/upsert/delete/rpc) — LLMs know this
- Filters and operators reference — documentation, not rules
- Stale doc path references (`docs/001a-public_schema.md`, `docs/database/supabase.example.json`)
- Skills section — skills self-activate

**Fix:**
- Globs: `["lib/supabase/**", "app/api/**", "server/**", "supabase/migrations/**"]` → `["supabase/**", "src/**/*.actions.ts", "src/**/actions/**"]`
- Command references: `npx supabase` → `pnpm db:*`
- Doc references: update to current paths under `docs/database/`

### 2.2 `nextjs-structure.md` — SIMPLIFY

**Current:** ~130 lines | **Target:** ~35 lines

**Keep:**
- App Router protection rules (critical safety)
- JSDoc requirement (mandatory for component docs)
- Source of truth hierarchy

**Remove:**
- Naming conventions (duplicated from `docs/ai-context/conventions.md`)
- Component folder structure (duplicated from conventions)
- Stale doc path references (`docs/000-docs-index.md`, `docs/004-pages-and-navigation.md`, `docs/009-components-composition.md`)
- `skill: nextjs-structure` directive
- Documentation folder structure (stale)

**Fix:**
- Globs: `["app/**", "components/**"]` → `["src/app/**", "src/components/**", "src/forms/**"]`
- Reference `docs/ai-context/conventions.md` for naming/structure
- Reference `docs/architecture/auth.md` for auth flow

### 2.3 `shadcn.md` — KEEP as-is

**Current:** ~42 lines. Already concise, accurate, and practical. No stale references. No changes needed.

### 2.4 `skills-usage.md` — REMOVE

**Current:** 283 lines. Educational descriptions of 10 skills with "what/when/how/risks" for each. The glob `src/**` causes this to load on EVERY source file edit.

**Why remove:**
- Each skill in `.agents/skills/` has its own `SKILL.md` with usage instructions — the rule file is redundant
- 283 lines of context on every edit is the single largest token cost in the project
- Content is educational/advisory, not enforceable rules
- The skills priority ordering can be a 3-line note in AGENTS.md if needed

### 2.5 `.claude/rules/test.md` — REMOVE

Exact duplicate of `.agents/rules/database-changes.md`. Zero unique content.

---

## Phase 3 — Bonus Fixes

Fix stale `.agent/` (singular) references in docs that should be `.agents/` (plural):
- `docs/ai-context/project-summary.md` line 50
- `docs/ai-context/conventions.md` lines 154-155

These are minor path corrections that won't change behavior but prevent confusion.

---

## Summary

| File | Action | Before | After | Change |
|------|--------|--------|-------|--------|
| `AGENTS.md` | Rewrite | 115 | ~55 | −52% |
| `.agents/rules/database-changes.md` | Simplify | 180 | ~65 | −64% |
| `.agents/rules/nextjs-structure.md` | Simplify | 130 | ~35 | −73% |
| `.agents/rules/shadcn.md` | Keep | 42 | 42 | 0% |
| `.agents/rules/skills-usage.md` | Remove | 283 | 0 | −100% |
| `.claude/rules/test.md` | Remove | 180 | 0 | −100% |
| **Total** | | **930** | **~197** | **−79%** |

---

## Implementation Order

1. Delete `.claude/rules/test.md`
2. Delete `.agents/rules/skills-usage.md`
3. Rewrite `AGENTS.md`
4. Rewrite `.agents/rules/database-changes.md`
5. Rewrite `.agents/rules/nextjs-structure.md`
6. Fix stale references in `docs/ai-context/project-summary.md` and `docs/ai-context/conventions.md`
7. Save summary in `plans/agents-rules-review/README.md`

## Verification

- After rewriting, run `pnpm lint` to ensure no formatting issues in changed files
- Check that all referenced doc paths exist: `docs/ai-context/project-summary.md`, `docs/ai-context/conventions.md`, `docs/database/overview.md`, `docs/architecture/auth.md`, `docs/design/overview.md`, etc.
- Verify glob patterns match actual source paths by listing `src/app/`, `src/components/`, `supabase/`
