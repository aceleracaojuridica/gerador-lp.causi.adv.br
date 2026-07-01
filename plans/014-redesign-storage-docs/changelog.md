# Changelog — 014 Redesign Storage

## Código

### `src/lib/media/types.ts`
- Removido `MediaEntityKind` (não era utilizado)
- Adicionado `MediaEntityType` com todos os 7 tipos de entidade: `user`, `person`, `conversation`, `course`, `lesson`, `certificate_template`, `user_certificate`
- Adicionado `MediaMetadata` com campos: `account_id` (number), `entity_type`, `entity_id` (number | string), `original_name`

### `src/lib/media/paths.ts`
- Removido `randomSuffix()` (usava `Math.random`)
- Adicionado `generateFileId(uuid, now)` usando `crypto.randomUUID()` + `Date.now()`
- Todos os helpers `uuid` e `now` são injetáveis para testes
- **Bucket `media`** — novos parâmetros obrigatórios e nova estrutura de path:
  - `buildUserAvatarPath`: adicionados `accountId` e `userId` → `{accountId}/users/{userId}/{uuid}-{ts}.{ext}`
  - `buildPersonMediaPath`: substituídos `contactIdentifier` + `conversationId` por `accountId` + `personId` → `{accountId}/persons/{personId}/{uuid}-{ts}.{ext}`
  - `buildConversationMediaPath`: substituídos `contactIdentifier` + `conversationId` por `accountId` + `conversationId` (tipado como `number`) → `{accountId}/conversations/{conversationId}/{uuid}-{ts}.{ext}`
- **Bucket `classroom`** — entidade explícita como ID numérico no path:
  - `buildCourseMediaPath`: substituído `filename` sozinho por `courseId` + `filename` → `courses/{courseId}/{uuid}-{ts}.{ext}`
  - `buildLessonAttachmentPath`: substituído `lessonName` por `lessonId` → `lessons/{lessonId}/{uuid}-{ts}.{ext}`
  - `buildCertificateTemplatePath`: adicionado `templateId` → `certificate_templates/{templateId}/{uuid}-{ts}.{ext}`
  - `buildUserCertificatePath`: adicionada subpasta `courseId` → `user_certificates/{userId}/{courseId}/{uuid}-{ts}.pdf`

### `src/lib/media/server.ts`
- Adicionado `metadata?: MediaMetadata` em `UploadMediaObjectOptions`
- `metadata` repassado ao `supabase.storage.upload()` como quinto parâmetro

### `src/app/(app)/(configuracoes)/perfil/actions.ts`
- `buildUserAvatarPath` atualizado para passar `accountId: session.account.id` e `userId: session.user.id`
- `uploadMediaObject` atualizado para incluir `metadata` com `account_id`, `entity_type: "user"`, `entity_id`, `original_name`

---

## Documentação

### `docs/database/storage.md` — reescrita completa
- Adicionada seção **Metadados Padronizados** documentando `MediaMetadata` e o comportamento do `owner_id` automático do Supabase
- Adicionada seção **Convenção de Nomenclatura** explicando o padrão `{uuid}-{timestamp}.{ext}`
- Tabelas de paths reescritas refletindo nova estrutura (`{accountId}/{entity}/{entityId}/`)
- Seção RLS do bucket `media` documenta as **políticas atuais** (INSERT aberto, SELECT/UPDATE/DELETE restritos a `super_admin`) e marca como **implementação futura** as políticas de isolamento por `account_id` via `is_user_in_account_or_shared`
- "Retrieval de URL": documenta que o banco armazena a URL pública completa; path relativo marcado como implementação futura
- Boas Práticas: cleanup documentado como não-bloqueante dado o estado atual das RLS

### `docs/implementations/storage.md` — atualização
- Seção 3: estado real das RLS do bucket `media` (DELETE restrito a `super_admin`)
- Seção 4 (fluxo): "grava URL pública no banco"
- Seção 5: tabelas de path atualizadas; nota sobre `pending-manual-cleanup` ser resultado esperado no estado atual
- Seção 6.2 (exemplo): Server Action de referência usando `buildUserAvatarPath` com `accountId`/`userId` + `MediaMetadata`; comentário de persistência reflete URL pública
- Seção 8: `resolveMediaPublicUrl` documentado como aceitando URL completa (passthrough) ou path relativo; implementação futura de migrar para path relativo
- Seção 9.3: isolamento multi-tenant marcado como **implementação futura**; estado atual documentado
- Seção 10: `pending-manual-cleanup` documentado como resultado válido e **não-bloqueante** para a operação principal
- Seções 11 e 12: atualizadas para URL pública e cleanup não-bloqueante
- Seção 14: migração consolidada em dois eixos — (a) paths antigos → nova estrutura e (b) URL no banco → path relativo; RLS isolada como etapa posterior à migração
