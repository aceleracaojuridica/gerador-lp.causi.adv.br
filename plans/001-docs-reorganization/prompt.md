# Task: Review and Reorganize Project Documentation

## Context
I have an existing documentation structure for a Next.js + Supabase SaaS CRM project (lawyers, WhatsApp chat, kanban, tasks, billing, classroom module). Docs were written incrementally and have serious inconsistencies.

### Current problems to solve
1. Docs describe wrong/outdated system workflows and database entities
2. Many files repeat info from others, sometimes contradicting each other or causing inconsistency and hard maintence
3. Some files are no longer needed
4. Docs reference database schema files that NO LONGER EXIST at their old paths
5. Some docs describe the project as MVP, but the project is already in production with paying customers, so they need to be updated to reflect the current state.
6. I have a @temp/review-docs.md   with corrections — these must be applied
7. The `review-docs.md` doesn't cover the entire current docs, the files not covered here may still have wrong/outdated information
8. The project has a general @README.md   file in the root folder, but it's not reviewed.
9. PRD and ADR docs aren't reviewed yet, so probably have wrong/outdated information.

### Additional context
- Current project is developed in Bubble.io (no code platform) and doesn't have documentation, but the new documentation should be written as if the project was developed in Next.js + Supabase and don't mention Bubble.io, since that's the intended future state and the current docs are already written with that in mind.
- After the docs are reorganized and rewritten, they will be used as the source of truth for the new development in Next.js + Supabase, and be used as context for AI agents that will assist in development, so they need to be accurate, consistent, and well structured.

### Database schema files provided
I am providing you with the following files that describe the current database structure:
- @temp/public.sql  : all tables in the public schema
- @temp/billing.sql  : all tables in the billing schema
- @temp/classroom.sql  : all tables in the classroom schema

Use these as the source of truth for all table names, columns, and relationships.

For the `supabase/schemas/` folder: read the **files and folder structure only** (names, paths) so you know what files exist and can link to them correctly. Do NOT read the contents of any file inside it — the provided `.sql` files are sufficient for content.
The folder structure is:

```
supabase/
└── schemas/
    ├── billing/
    │   ├── constraints/
    │   ├── functions/
    │   ├── indexes/
    │   ├── rls/
    │   ├── tables/
    │   ├── triggers/
    │   └── views/
    ├── classroom/
    │   ├── constraints/
    │   ├── functions/
    │   ├── indexes/
    │   ├── rls/
    │   ├── tables/
    │   ├── triggers/
    │   └── views/
    ├── public/
    │   ├── constraints/
    │   ├── functions/
    │   ├── indexes/
    │   ├── rls/
    │   ├── tables/
    │   ├── triggers/
    │   └── views/
    └── storage/
        └── rls/
```

### Database current values and enums
I am providing you with the following files that contain the current database values used and enums:
- @temp/current-data-references.md  : values for some status and enums
- @temp/plans_rows.json   / @temp/plan_periods_rows.json   / @temp/addons_rows.json   / @temp/addon_prices_rows.json  : values for plans, addons, prices, base limits, features
- @temp/roles_rows.json  : values for roles and permissions

---

## Session persistence rules

### After Phase 1 completes
Before waiting for my approval, write the full audit report to `/plans/phase-1-audit.md`.
Use exactly the four sections described in the Phase 1 output. This file is the required input for all future sessions.

### After Phase 2 completes
Before waiting for my approval, write the full proposed file tree (with one-line descriptions) to `/plans/phase-2-structure.md`.

### Phase 3 must be executed in chunks — one chunk per session
Do NOT try to write all files in a single session.

At the start of every Phase 3 session, before doing anything else:
1. Read `/plans/phase-1-audit.md`
2. Read `/plans/phase-2-structure.md`
3. Read `/plans/phase-3-progress.md` (create it if it doesn't exist yet)

After writing each file, immediately append a line to `/plans/phase-3-progress.md`:
- `- [x] docs/path/to/file.md — written` if the file was fully written
- `- [ ] docs/path/to/file.md — stub, needs: <what is missing>` if only a scaffold was produced

#### Chunk assignments

**Chunk A — `database/` folder**
Files: `database/overview.md`, `database/schema-public.md`, `database/schema-billing.md`, `database/schema-classroom.md`, `database/functions.md`, `database/triggers.md`, `database/rls.md`, `database/storage.md`
Re-read for this chunk only: `temp/public.sql`, `temp/billing.sql`, `temp/classroom.sql`
Do NOT re-read other `/docs` files unless the audit explicitly flags one as a schema source.

**Chunk B — `features/` folder**
Files: all files inside `features/`
Re-read for this chunk only: the `/docs` files the audit marked as source for each feature.
Do NOT re-read the SQL files — link to `docs/database/schema-*.md` instead.

**Chunk C — `architecture/`, `design/`, `edge-functions/`, `components/`, `api/`**
Re-read for this chunk only: the specific `/docs` files the audit flagged as source for each file.

**Chunk D — `references/`, `ai-context/`, root `README.md`, PRD/ADR files**
Re-read for this chunk only: `temp/plans_rows.json`, `temp/plan_periods_rows.json`, `temp/addons_rows.json`, `temp/addon_prices_rows.json`, `temp/roles_rows.json`, `temp/current-data-references.md`
Also re-read `/plans/phase-1-audit.md` and `/plans/phase-2-structure.md` for the feature-map and conventions files.

#### How to start a Phase 3 chunk session
Begin your prompt with:
> "Execute Phase 3 Chunk [A/B/C/D]. Read `/plans/phase-1-audit.md`, `/plans/phase-2-structure.md`, and `/plans/phase-3-progress.md` first, skip any files already marked `[x]`, then proceed with the assigned files only."

---

## Phase 1 — Audit (do this first, output a report)

1. Read ALL files in `/docs` and `/docs/*` subfolders recursively
2. Read `review-docs.md` completely
3. Use the provided `public.sql`, `billing.sql`, and `classroom.sql` to understand the real current database structure (need to read these files completely)
4. Use the provided `current-data-references.md` and related attached files to understand current available values and enums for data in database.
5. Produce an audit report with:
   - List of every existing doc file with a one-line status:
     - `KEEP` — content is valid, needs only minor corrections
     - `REWRITE` — content exists but is wrong or outdated
     - `MERGE INTO <file>` — duplicate of another file, should be consolidated
     - `DROP` — no longer needed (explain why)
   - List of broken references (links or mentions of schema files at old/wrong paths)
   - List of corrections from `review-docs.md` mapped to which doc file they affect
   - List of gaps: topics that should be documented but currently aren't

Do NOT proceed to Phase 2 until I approve the audit report.

---

## Phase 2 — Propose new structure (only after I approve Phase 1)

Propose the new `/docs` folder structure as a file tree with a one-line description per file. Must follow these rules:

### Target structure shape

```
docs/
├── README.md                        # Master index — what to read for each task
├── architecture/
│   ├── overview.md                  # Stack, key decisions, system diagram
│   ├── auth.md                      # Auth flow, roles, RLS strategy
│   └── integrations.md              # WhatsApp, Stripe, external services
├── design/
│   ├── overview.md                  # Design principles and guidelines
├── database/
│   ├── overview.md                  # All schemas summary: tables, columns, purpose
│   ├── schema-public.md             # Tables inside public schema explained
│   ├── schema-billing.md            # Tables inside billing schema explained
│   ├── schema-classroom.md          # Tables inside classroom schema explained
│   ├── functions.md                 # All RPC functions: name, params, purpose, used by
│   ├── triggers.md                  # All triggers: table, event, what it does
│   ├── rls.md                       # RLS policies explained per table
│   └── storage.md                   # Supase Storage Summary
├── edge-functions/
│   ├── edge-function-1.md           # Supabase Edge Functions
│   ├── edge-function-2.md
├── features/
│   ├── conversations.md
│   ├── kanban.md
│   ├── contacts.md
│   ├── tasks.md
│   ├── subscriptions.md
│   └── classroom.md
├── api/
│   └── routes.md                    # Next.js API routes index + purpose
├── components/
│   └── overview.md                  # Component conventions + key shared components
├── references/
│   ├── plans-and-features.md        # All current plans and features values available
    ├── roles-and-permissions.md     # All current roles and permissions values available
    └── statuses-and-enums.md        # Available values for some columns status and enums
└── ai-context/
    ├── project-summary.md           # Short dense summary — first file to attach to AI
    ├── feature-map.md               # All features mapped to tables + functions
    └── conventions.md               # Coding rules AI must always follow
```

You can adjust this shape based on what the audit reveals, but justify any deviation.

- There some docs describing sidebar, error handling, admin bar, other UI elements or design decisions, that should be moved to the most appropriate place in the new structure, but if they don't fit anywhere, create a new folder for them.
- PRD and ADR docs should be moved to the most appropriate place in the new structure, but if they don't fit anywhere, create a new folder for them.

### Structure rules
- One topic per file — no file should cover two unrelated concerns
- Database docs must link to `supabase/schemas/<schema>/` paths, never old paths
- No duplication — if info belongs in one file, other files must link to it instead of repeating it

Present the full proposed file tree with one-line descriptions, then wait for my approval. Do NOT write any file content yet.

---

## Phase 3 — Write files (only after I approve Phase 2)

Create a new `/docs` folder to insert the new documentation.

For each file in the approved structure:

### If source content exists (migrated, rewritten, or merged from old docs):
- Write the full content using the appropriate template for that file type
- Apply all relevant corrections from `review-docs.md`
- Remove outdated references to old schema paths, replace with correct `supabase/schemas/` links
- Eliminate duplicated content — link to the canonical file instead of repeating
- Flag anything you cannot confirm from the provided sources:
  `<!-- TODO: needs human input -->`

### If no source content exists (new file with no prior doc):
- Write the YAML frontmatter block:
  ```yaml
  ---
  title: <title>
  description: <one line about what this file documents>
  source: <supabase/schemas path if applicable>
  ---
  ```
- Write all section headings from the template for that file type
- Under each heading, write a `<!-- TODO: generate content -->` placeholder
- This signals which files still need a dedicated generation session

### For database files specifically:
- `database/overview.md` and `database/schema-*.md` — generate full content using the provided `public.sql`, `billing.sql`, `classroom.sql` as source. Only re-read these SQL files during **Chunk A**. In all other chunks, reference `docs/database/schema-*.md` (already written) instead.
- `database/functions.md`, `database/triggers.md`, `database/rls.md`, `database/edge-functions.md` — create scaffolded stubs only (headings + `<!-- TODO -->`) since their source files inside `supabase/schemas/` were not provided for reading. Link each section to the relevant path in `supabase/schemas/<schema>/functions/`, `.../triggers/`, `.../rls/` etc. so the next session knows exactly where to read from

### Feature doc template (use for every file in features/)
```markdown
## What it is
## Tables involved
## RPC Functions
## Key flows
## Pages and components
## Business rules
```

### Database schema doc template (use for database/schema-*.md)
```markdown
## Overview
## Tables
## Relationships
## Key constraints and indexes
## Source files
```

### Database overview template (database/overview.md)
```markdown
## Schemas
## Tables index (all schemas)
## Naming conventions
```

- You can adjust these templates based on the specific topic of each file, but keep them consistent across similar files (e.g. all feature docs should follow the same structure).

---

## Global rules (apply to all phases)
- Trust `review-docs.md` over any existing doc when they conflict
- Trust the provided `.sql` files over any doc when describing database structure
- Never invent table names, column names, function names, or behaviors
- Never write actual doc content before I approve Phase 2 and trigger Phase 3
- Every doc file that covers database objects must include a `> Source: supabase/schemas/<schema>/<subfolder>/` reference at the top
- Any doc that previously linked to old/removed schema paths must have those links corrected to the new `supabase/schemas/` structure
- The folders and file names needs to be written in English, but docs are written in PT-BR, keep this behavior.
- Any links needs to be clickable in markdown and point to the correct file in the new structure.
- Files inside the `/temp` folder cannot be linked in the new docs, this folder only has temp sources to gives context for you at this moment.