## Requirements

### Requirement: User can view accessible accounts in the SystemBar
The system SHALL display a list of accounts accessible to the current user in the `SystemBar` component. For regular users, the full list SHALL be loaded from `getUserAccountsAction()` in a single call. For Super Admin (`accessLevel === 999`), the list SHALL be paginated (20 accounts per page) with infinite scroll and server-side search by account name.

#### Scenario: Regular user opens SystemBar account list
- **WHEN** a user with `hasSharedAccounts = true` and `accessLevel < 999` opens the SystemBar account switcher
- **THEN** all accessible accounts are fetched via `getUserAccountsAction()` in one request
- **AND** the current active account is visually highlighted

#### Scenario: Super Admin opens SystemBar account list
- **WHEN** a Super Admin (`accessLevel === 999`) opens the SystemBar account switcher
- **THEN** the first 20 accounts are loaded
- **AND** scrolling to the bottom of the list loads the next page (infinite scroll)
- **AND** a search input filters results by account name on the server

#### Scenario: Super Admin searches for an account by name
- **WHEN** a Super Admin types in the search field of the SystemBar account switcher
- **THEN** `getUserAccountsAction()` is called with the search term as a filter
- **AND** results are updated to show only matching accounts
- **AND** the result list is reset to page 1 for each new search

---

### Requirement: getUserAccountsAction validates inputs and enforces access control
The system SHALL validate all inputs to `getUserAccountsAction()` using Zod before executing any query. The action SHALL never return accounts outside the current user's access scope.

#### Scenario: Zod rejects invalid pagination input
- **WHEN** `getUserAccountsAction()` is called with a non-positive-integer page number
- **THEN** the action returns a validation error without executing any database query

#### Scenario: Regular user cannot paginate beyond their account list
- **WHEN** a regular user calls `getUserAccountsAction()` with a page parameter
- **THEN** only accounts from `users_accounts` for that user are returned
- **AND** RLS ensures no cross-tenant data leaks

---

### Requirement: User can switch the active account context
The system SHALL provide a `switchAccountAction()` Server Action that re-calls `get_current_user_details_v4` with the requested `account_id`. On success, it SHALL return a new `Session` DTO. On failure (null result from RPC), it SHALL return a `'Forbidden'` error. The client SHALL call `setSession()` with the new session and then `router.refresh()`.

#### Scenario: Successful account switch
- **WHEN** a user selects a different account in the SystemBar
- **THEN** `switchAccountAction({ accountId })` is called
- **AND** `get_current_user_details_v4(p_account_id: accountId)` executes via RPC
- **AND** the action returns a mapped `Session` DTO (not raw RPC data)
- **AND** the client calls `setSession(newSession)` followed by `router.refresh()`
- **AND** the UI shows the new account name in the SystemBar without a full page reload

#### Scenario: Account switch to inaccessible account (IDOR attempt)
- **WHEN** a user calls `switchAccountAction({ accountId: someOtherAccountId })` for an account they do not have access to
- **THEN** the RPC + RLS returns null for that `account_id`
- **AND** `switchAccountAction` returns an error response with reason `'Forbidden'`
- **AND** no session data is changed

#### Scenario: Account switch refreshes server-side state
- **WHEN** a successful account switch completes
- **THEN** the client calls `router.refresh()` after updating the session context
- **AND** Server Components in the current route re-render with the new account context

---

### Requirement: switchAccountAction validates inputs with Zod
The system SHALL validate the `accountId` parameter in `switchAccountAction()` with Zod before calling the RPC. The schema SHALL reject null, undefined, non-integer, and negative values.

#### Scenario: Zod rejects negative account ID
- **WHEN** `switchAccountAction({ accountId: -1 })` is called
- **THEN** the action returns a validation error without calling the RPC

#### Scenario: Zod rejects non-integer account ID
- **WHEN** `switchAccountAction({ accountId: 3.14 })` is called
- **THEN** the action returns a validation error

---

### Requirement: switchAccountAction returns a mapped DTO, not raw RPC data
The system SHALL map the raw RPC result to the `Session` DTO type defined in `src/lib/session/types.ts` before returning it to the client. The raw RPC row SHALL never be serialized directly to the client response.

#### Scenario: Server Action returns a safe DTO
- **WHEN** `switchAccountAction()` succeeds
- **THEN** the returned object matches the `Session` type from `types.ts`
- **AND** no internal DB field names (e.g., `main_role_id`, `main_account_id`) are exposed directly
