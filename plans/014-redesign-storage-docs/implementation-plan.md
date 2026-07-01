# Plan: Redesign Storage Documentation

## Context

Updating `docs/database/storage.md` to propose a new scalable storage architecture for Causi. No code changes — documentation only.

**User decisions:**
- account_id as path prefix (e.g., `media/{account_id}/users/...`)
- Both buckets in scope (media + classroom)
- No migration doc — future state only; migration as separate task
- Minimal metadata: account_id + entity_type + entity_id (owner_id is auto-set by Supabase)

## Key Architecture Decisions

### Path Structure

**Bucket `media`** (new):
- User avatar: `{account_id}/users/{user_id}/avatar_{timestamp}.{ext}`
- Person photo: `{account_id}/persons/{person_id}/{timestamp}_{sanitized}.{ext}`
- Conversation media: `{account_id}/conversations/{conversation_id}/{timestamp}_{sanitized}.{ext}`

**Bucket `classroom`** (no account prefix — global content, super_admin managed):
- Course thumbnail: `courses/{course_id}/thumbnail_{timestamp}.{ext}`
- Lesson attachment: `lessons/{lesson_id}/{slug}-{timestamp}.{ext}`
- Certificate template: `certificate_templates/{template_id}/{timestamp}.{ext}`
- User certificate: `user_certificates/{user_id}/{course_id}/certificate-{timestamp}.pdf`

### Metadata Standard

`media` objects:
```json
{ "account_id": "123", "entity_type": "user|person|conversation", "entity_id": "456" }
```

`classroom` objects:
```json
{ "entity_type": "course|lesson|certificate_template|user_certificate", "entity_id": "456" }
```

`owner_id` is auto-set by Supabase (sub from JWT).

### RLS Design

`media`:
- INSERT: path[1] must match an account_id the user belongs to (via helper function)
- SELECT: same as INSERT (replaces current super_admin-only SELECT)
- UPDATE: super_admin only
- DELETE: owner_id = auth.uid() OR super_admin

Helper function needed: `user_has_account_access(account_id bigint)` checking `users.account_id` and `users_accounts`

`classroom`: unchanged (super_admin manages; has_module_access for SELECT)

## Naming Convention (revised)

All file names: `{uuid}-{timestamp}.{ext}` where uuid = `crypto.randomUUID()`.
- UUID ensures global uniqueness and unpredictability (security for public buckets)
- Timestamp helps with visual ordering/debugging
- No semantic name needed — bucket + path + metadata provide all context
- `original_name` metadata preserves the original filename for UI/UX display

## Metadata Standard (revised)

Bucket `media`:
```json
{ "account_id": 123, "entity_type": "user|person|conversation", "entity_id": 456, "original_name": "foto.jpg" }
```
- `account_id`: number (bigint ID stored as JSON number; safe for practical ID values)
- `entity_id`: number (bigint) or string (uuid), depending on the entity
- `entity_type`: string enum
- `original_name`: sanitized original filename

Bucket `classroom`:
```json
{ "entity_type": "course|lesson|certificate_template|user_certificate", "entity_id": 456, "original_name": "thumbnail.png" }
```
- No `account_id` (classroom is global content, managed by super_admin)
- `owner_id` is auto-set by Supabase (`auth.uid()::text`) — no need to repeat in metadata

RLS in SQL uses `(user_metadata->>'account_id')::bigint` to cast back from JSON.

## RLS Design (revised — uses existing helpers)

Existing helpers from `functions.md` to reuse:
- `is_user_in_account_or_shared(account_id bigint, user_id uuid)` — covers direct + shared accounts
- `is_super_admin(user_id uuid)` — for admin-only operations

**Bucket `media`** — new policies:

| Operação | Regra |
|----------|-------|
| INSERT | `is_user_in_account_or_shared((storage.foldername(name))[1]::bigint, auth.uid())` |
| SELECT | Same as INSERT (replaces current super_admin-only SELECT) |
| UPDATE | `is_super_admin(auth.uid())` |
| DELETE | `owner_id = auth.uid()::text` OR `is_super_admin(auth.uid())` |

No new helper functions needed — all covered by existing ones.

**Bucket `classroom`** — unchanged.

## Steps

1. Read current `docs/database/storage.md` fully
2. Rewrite the doc with:
   - Updated bucket table
   - New folder structure tables for both buckets
   - New naming convention section (`{uuid}-{timestamp}.{ext}`)
   - Metadata standard section with typed fields + `original_name`
   - New RLS design section (SQL policy sketches referencing existing helpers)
   - Note on `owner_id` auto-set (no custom field needed)
   - Future state callout (migration as separate task)
   - Update integration with Next.js section (path builder patterns)
3. Save updated doc

## Files

- `docs/database/storage.md` — full rewrite
- `docs/implementations/storage.md` — read for cross-reference (no changes)
