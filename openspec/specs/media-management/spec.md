## Requirements

### Requirement: Media uploads SHALL enforce authenticated server-side validation
The system SHALL process business-critical media uploads through a server-side boundary that validates the authenticated user session, resolves the active account from the current session snapshot, validates the incoming file, and only then writes to the `media` bucket.

#### Scenario: Authenticated upload succeeds through a Server Action
- **WHEN** an authenticated user submits a valid media file through an approved upload flow
- **THEN** the server retrieves the current session via the project session layer
- **AND** validates the file before uploading to the `media` bucket
- **AND** returns a successful result only after the storage write completes

#### Scenario: Upload is rejected when there is no valid session
- **WHEN** an upload flow reaches the server without a valid authenticated session
- **THEN** the system rejects the operation before attempting any write to the `media` bucket

#### Scenario: Upload is rejected for invalid file input
- **WHEN** the uploaded file violates the allowed validation rules for size, type, or required presence
- **THEN** the system rejects the operation before attempting any write to the `media` bucket

---

### Requirement: Media object paths SHALL use the active account namespace
The system SHALL generate canonical object paths for new files in the `media` bucket using the active account from the current session. New paths MUST include the `accounts/{accountId}/...` prefix and MUST place the entity-specific segment after the account namespace.

#### Scenario: User avatar path uses the active account and user identifiers
- **WHEN** the system uploads a profile image for the authenticated user
- **THEN** the stored object path starts with `accounts/{activeAccountId}/users/{userId}/`

#### Scenario: Person media path uses the active account and person identifiers
- **WHEN** the system uploads media associated with a CRM person record
- **THEN** the stored object path starts with `accounts/{activeAccountId}/persons/{personId}/`

#### Scenario: Conversation media path uses the active account and conversation identifiers
- **WHEN** the system uploads media associated with a conversation
- **THEN** the stored object path starts with `accounts/{activeAccountId}/conversations/{conversationId}/`

---

### Requirement: Media responses SHALL return the canonical path and a derivable public URL
The system SHALL treat the relative storage path as the canonical media reference. Upload responses MAY include a `publicUrl`, but that URL MUST be derived from the stored path for the `media` bucket rather than treated as the only persisted reference.

#### Scenario: Successful upload returns canonical storage metadata
- **WHEN** an upload completes successfully
- **THEN** the result includes the relative storage `path`
- **AND** any `publicUrl` returned by the flow is derived from that same path

#### Scenario: Rendering a stored media reference derives the public URL from the stored path
- **WHEN** the application needs to render a previously stored media object from the `media` bucket
- **THEN** it derives the public URL from the stored relative path

---

### Requirement: Client-side media uploads SHALL use the browser Supabase client without becoming the authorization source
The system MAY support direct browser uploads for UX-sensitive flows, but such flows SHALL use the official browser Supabase client boundary and SHALL NOT make the frontend the source of truth for authorization, account scoping, or final persistence of the business reference.

#### Scenario: Direct browser upload uses the official browser client
- **WHEN** a flow performs an upload from a Client Component
- **THEN** it uses the browser Supabase client boundary defined by the project

#### Scenario: Browser upload still requires server-side confirmation for business persistence
- **WHEN** a file upload originates in the browser and must be attached to business data
- **THEN** the server revalidates the session and active account before persisting the media reference as completed business state

---

### Requirement: Media replacement and removal SHALL coordinate business references and cleanup behavior
The system SHALL define explicit server-side behavior for replacing or removing media references. When physical deletion is permitted, the flow SHALL remove the obsolete object from the `media` bucket. When physical deletion is not permitted for the acting context, the flow SHALL still update or remove the business reference safely and record a deterministic cleanup outcome.

#### Scenario: Media replacement removes the obsolete reference from business state
- **WHEN** a user replaces an existing media asset with a new one
- **THEN** the system updates the business record to point to the new canonical path
- **AND** handles the previous object according to the configured cleanup behavior

#### Scenario: Media removal is explicit even when bucket deletion is restricted
- **WHEN** a non-privileged context removes a media reference but cannot physically delete the underlying object
- **THEN** the system updates the business state without claiming that physical deletion succeeded
- **AND** produces a deterministic result for follow-up cleanup handling
