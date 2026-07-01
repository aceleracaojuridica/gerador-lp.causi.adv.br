# Plan: Fix Account Switching

## Root Cause Analysis

Three distinct bugs:

1. **Server context doesn't update after switch**: `getSession()` calls `get_current_user_details_v4` without `p_account_id` (always returns main account). After `router.refresh()`, RSCs (including the debug page) always get main account data. Fix: persist selected `accountId` in an HTTP-only cookie so `getSession()` can pass it to the RPC.

2. **`getUserAccountsAction` missing main account**: regular users only query `users_accounts` (additional accounts only). The main account lives in `users.account_id`. The schema doc confirms: "para saber quais contas um usuário acessa, consulte **ambos**: `users.account_id` E `users_accounts WHERE user_id = ?`".

3. **Dropdown UX**: active account not shown with explicit checkmark, no client-side search for non-super-admin, `shouldFilter={false}` always breaks cmdk's built-in filtering.

## Relevant Files

- `src/lib/session/actions.ts` — add cookie set in `switchAccountAction`; fix `getUserAccountsAction` regular-user query
- `src/lib/session/get-session.ts` — read cookie in `getSession()`, pass `p_account_id` to RPC; fallback if null
- `src/components/system-bar.tsx` — dropdown UX fixes (checkmark, search for regular users, shouldFilter)

## Steps

### Phase 1 — Cookie-based context persistence (depends on nothing; unblocks Phase 3 indirectly)

**Step 1.1** — `src/lib/session/actions.ts` → `switchAccountAction`:
- Import `cookies` from `next/headers`
- After successful RPC + `mapRpcToSession`, call `(await cookies()).set('causi_act', String(accountId), { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 30 })`

**Step 1.2** — `src/lib/session/get-session.ts` → `getSession()`:
- Import `cookies` from `next/headers`
- Before RPC call, read `(await cookies()).get('causi_act')?.value` and parse to int with `Number()`; validate `Number.isInteger(n) && n > 0`
- If valid, call `rpc('get_current_user_details_v4', { p_account_id: n })`
- If that RPC returns null (access revoked), clear cookie via `(await cookies()).delete('causi_act')` and retry without param
- Note: `getSession()` is wrapped in React `cache()` per-request — this is fine, cookie read happens once per request

### Phase 2 — Fix getUserAccountsAction to include main account (independent of Phase 1)

**Step 2.1** — `src/lib/session/actions.ts` → `getUserAccountsAction` regular-user branch:
- Add a second query: `supabase.from('users').select('account_id, accounts!account_id(id, name)').eq('id', session.user.id).single()`
- This gets the main account
- Build `AccountItem` from it and prepend to the `users_accounts` result
- Deduplicate by `id` (defensive, schema shouldn't produce dups)

### Phase 3 — Dropdown UX (depends on nothing, but Phase 1+2 must also be done for full correctness)

**Step 3.1** — `src/components/system-bar.tsx`:
- Import `Check` from `lucide-react`
- In each `CommandItem`, add a `Check` icon: `className="ml-auto size-4"` with `opacity-100` or `opacity-0` based on `account.id === activeAccountId`

**Step 3.2** — Show `CommandInput` for non-super-admin too:
- Remove the `{isSuperAdmin && <CommandInput ... />}` guard; always render `CommandInput`
- For super admin: keep existing `value={search} onValueChange={setSearch}` (debounced server fetch)
- For regular users: keep `value={search} onValueChange={setSearch}` but rely on cmdk's filter

**Step 3.3** — Fix `shouldFilter` on `<Command>`:
- Change `shouldFilter={false}` to `shouldFilter={!isSuperAdmin}`
- For super admin: `false` (server handles filtering); for regular users: `true` (cmdk filters locally using item `value`)
- The `value` on each `CommandItem` must include the account name (not just ID) for cmdk to filter by name

**Step 3.4** — Fix `CommandItem value` for regular users:
- Currently `value={String(account.id)}`; cmdk filters by this value, so it can't match on name
- Change to `value={`${account.id}-${account.name}`}` so cmdk can filter by name
- Also update `handleSelect` to continue using the numeric `account.id` (already uses a separate `.id` property)

## Verification

1. Switch account on `/debug` page — JSON must reflect switched account after refresh
2. Open dropdown after switching — all accounts visible, switched one has Check icon
3. Search in dropdown (regular user) — local filter works by account name
4. Search in dropdown (super admin) — server-side search works as before
5. Select currently active account — no switch occurs, popover closes
6. Log out and back in — previous selected account persisted (cookie) OR cleared correctly
7. Future pages (e.g., contacts/people) — server components re-render for the switched account after refresh

## Decisions / Scope

- Cookie name: `causi_act` (short, not guessable as a session token since it's just an account ID)
- Cookie fallback: if cookie value is invalid or RPC returns null → silently fallback to main account + clear cookie
- No UI changes beyond system-bar.tsx and dropdown UX
- No change to Session DTO types (mainAccountId stays hidden from client)
- Logout cookie clearing: OUT OF SCOPE for this plan — the cookie becomes stale after logout (RPC will return null for a logged-out user), so no security issue; can be added later
