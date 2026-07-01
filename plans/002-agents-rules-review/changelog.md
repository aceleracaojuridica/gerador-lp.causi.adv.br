# Agents & Rules Review — Summary

**Date:** 2026-03-26
**Objective:** Audit and optimize AI agent configuration files to reduce token cost and fix stale references.

## Research

Best practices consulted (HumanLayer, AIHero, Philipp Schmid):
- Keep AGENTS.md under 300 lines (ideally <60)
- Use progressive disclosure — reference `docs/` instead of embedding content
- Don't include code style rules (use linters)
- Every line costs tokens on every session — only include universally applicable guidance

## Changes Made

| File | Action | Lines: Before → After |
|------|--------|----------------------|
| `AGENTS.md` | Rewritten (WHAT-WHY-HOW structure) | 115 → 55 |
| `.agents/rules/database-changes.md` | Simplified (kept safety rules, removed SDK examples) | 182 → 55 |
| `.agents/rules/nextjs-structure.md` | Simplified (kept route protection + JSDoc, removed duplicated conventions) | 130 → 38 |
| `.agents/rules/shadcn.md` | Kept as-is (already concise) | 42 → 42 |
| `.agents/rules/skills-usage.md` | Removed (skills self-document via `SKILL.md`) | 283 → 0 |
| `.claude/rules/test.md` | Removed (duplicate of database-changes.md) | 180 → 0 |
| **Total** | | **932 → ~190 (−80%)** |

## Detailed Decisions

### AGENTS.md — Rewritten
- Adopted WHAT-WHY-HOW structure with progressive disclosure
- Context table points to `docs/ai-context/` as entry point
- Separated safe commands from DB commands (with autonomy warning)
- 6 key rules covering pnpm, Biome, RLS, CLI, conventions, commits
- No inline code examples, no skill references, no code style rules

### database-changes.md — Simplified
- Kept: Zero Autonomy rule, CLI-only schema changes, what goes where, Supabase client rules, table conventions, enum rules
- Removed: 60+ lines of SDK usage examples (select/insert/update/delete/rpc/filters), stale doc paths, skill references
- Fixed globs: `["lib/supabase/**", "app/api/**", "server/**"]` → `["supabase/**", "src/**/*.actions.ts", "src/**/actions/**"]`
- Fixed commands: `npx supabase` → `pnpm db:*`

### nextjs-structure.md — Simplified
- Kept: App Router protection rules, JSDoc requirement, source of truth hierarchy
- Removed: Naming conventions (duplicated from `docs/ai-context/conventions.md`), component folder structure, stale doc paths, `skill: nextjs-structure` directive
- Fixed globs: `["app/**", "components/**"]` → `["src/app/**", "src/components/**", "src/forms/**"]`

### skills-usage.md — Removed
- 283 lines loaded on every `src/**` file change — largest token cost in the project
- Each skill in `.agents/skills/` already has its own `SKILL.md` with full usage instructions
- Content was educational/advisory, not enforceable rules

### .claude/rules/test.md — Removed
- Exact duplicate of `.agents/rules/database-changes.md` with no unique content

## Additional Fixes

- Fixed `.agent/` → `.agents/` references in:
  - `docs/ai-context/project-summary.md` (line 50)
  - `docs/ai-context/conventions.md` (lines 154-155)
