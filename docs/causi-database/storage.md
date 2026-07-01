---
title: Supabase Storage
description: Arquitetura de armazenamento de arquivos — buckets, estrutura de pastas, metadados, RLS e integração Next.js
source: supabase/schemas/storage/rls/
---

# Supabase Storage

O Causi utiliza o Supabase Storage para persistência de mídias e documentos, organizado em dois buckets que segregam dados por domínio e sensibilidade.

> **Fonte**: Políticas RLS do Storage em [`supabase/schemas/storage/rls/all.sql`](../../supabase/schemas/storage/rls/all.sql).

> **Atenção**: Ambos os buckets são **públicos**. Qualquer pessoa com a URL pública consegue acessar o arquivo diretamente, sem autenticação. As políticas RLS controlam apenas o acesso via API autenticada (listagem, upload, deleção).

---

## Buckets

| Bucket | Finalidade | Visibilidade | Acesso via API |
|--------|-----------|--------------|----------------|
| `media` | Mídias operacionais (perfis, contatos, conversas) | Público (URL direta) | Autenticado; listagem/deleção restritas a `super_admin` |
| `classroom` | Ativos do módulo educacional (cursos, aulas, anexos, certificados) | Público (URL direta) | Autenticado + `has_module_access` |

---

## Metadados Padronizados

Todos os uploads registram metadados em `storage.objects.metadata` (jsonb). Esses campos são lidos pelas políticas RLS e permitem rastreabilidade sem depender de JOINs no banco.

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `account_id` | `number` (bigint como JSON) | Sim (bucket `media`) | ID da conta proprietária do arquivo |
| `entity_type` | `string` | Sim | Tipo da entidade: `user`, `person`, `conversation`, `course`, `lesson`, `certificate_template`, `user_certificate` |
| `entity_id` | `number \| string` | Sim | ID da entidade (bigint ou uuid) |
| `original_name` | `string` | Sim | Nome original do arquivo (sanitizado), para exibição na UI |

> O campo `owner_id` é gerenciado automaticamente pelo Supabase como `auth.uid()::text` e não precisa constar nos metadados customizados.

Os tipos correspondentes estão em `src/lib/media/types.ts`: `MediaEntityType` e `MediaMetadata`.

---

## Convenção de Nomenclatura de Arquivos

Todos os arquivos seguem o padrão `{uuid}-{timestamp}.{ext}`, gerado via `crypto.randomUUID()` + `Date.now()`. O UUID garante unicidade; o timestamp permite ordenação cronológica.

Os helpers em `src/lib/media/paths.ts` são a única fonte de geração de paths — nunca monte paths manualmente.

---

## Bucket: `media`

Mídias operacionais isoladas por conta. O primeiro segmento do path é sempre o `account_id`.

| Pasta | Conteúdo | Tabela Relacionada | Coluna | Convenção de path |
|-------|----------|--------------------|--------|-------------------|
| `{accountId}/users/{userId}/` | Fotos de perfil de usuários | `public.users` | `photo` | `{uuid}-{timestamp}.{ext}` |
| `{accountId}/persons/{personId}/` | Fotos de contatos do CRM | `public.persons` | `photo` | `{uuid}-{timestamp}.{ext}` |
| `{accountId}/conversations/{conversationId}/` | Mídias de conversa (imagem, áudio, vídeo, documento, figurinha) | `public.messages` | `content` (JSONB: `audio`, `video`, `image`, `document`, `sticker`) | `{uuid}-{timestamp}.{ext}` |

**RLS (atual)**:
- **INSERT**: Qualquer usuário autenticado.
- **SELECT**: Restrito a `super_admin`.
- **UPDATE** / **DELETE**: Restrito a `super_admin`.

> ⚠️ **Implementação futura**: Após migração dos arquivos existentes para a nova estrutura de paths, as políticas serão atualizadas para isolamento por `account_id` — INSERT/SELECT via `is_user_in_account_or_shared` no primeiro segmento do path, DELETE pelo owner do arquivo ou `super_admin`.

---

## Bucket: `classroom`

Ativos do módulo educacional. Sem `account_id` no path — o acesso é controlado por permissão de módulo.

| Pasta | Conteúdo | Tabela Relacionada | Coluna | Convenção de path |
|-------|----------|--------------------|--------|-------------------|
| `courses/{courseId}/` | Thumbnails de cursos | `classroom.courses` | `thumbnail_url` | `{uuid}-{timestamp}.{ext}` |
| `lessons/{lessonId}/` | Anexos de aulas | `classroom.attachments` | `file_url` | `{uuid}-{timestamp}.{ext}` |
| `certificate_templates/{templateId}/` | Imagens de fundo dos templates | `classroom.certificate_templates` | `image_url` | `{uuid}-{timestamp}.{ext}` |
| `user_certificates/{userId}/{courseId}/` | Certificados emitidos | `classroom.user_certificates` | `certificate_url` | `{uuid}-{timestamp}.pdf` |

**RLS**:
- **SELECT**: Autenticado com `has_module_access(uid, 'classroom')` ou `has_module_access(uid, 'classroom_premium')`.
- **INSERT** / **UPDATE** / **DELETE**: `super_admin`.

---

## Segurança e Isolamento (RLS)

### Bucket `media` — Políticas atuais

| Operação | Política |
|----------|----------|
| `SELECT` | `is_super_admin(auth.uid())` |
| `INSERT` | Qualquer usuário autenticado |
| `UPDATE` | `is_super_admin(auth.uid())` |
| `DELETE` | `is_super_admin(auth.uid())` |

> **Consequência prática**: Usuários comuns conseguem fazer upload, mas não conseguem deletar nem listar arquivos via API. A deleção de arquivos antigos (ex: substituição de avatar) resulta em `pending-manual-cleanup` — a referência no banco é atualizada, mas o arquivo físico permanece no bucket até intervenção manual ou migração de política.

#### ⚠️ Implementação futura — Isolamento por conta no bucket `media`

Após migração dos arquivos existentes para a nova estrutura de paths (`{accountId}/{entity}/{entityId}/...`), as políticas serão substituídas por:

Funções auxiliares a utilizar (já existentes em `public`):
- `is_user_in_account_or_shared(account_id bigint, user_id uuid)` — cobre conta direta e contas compartilhadas.
- `is_super_admin(user_id uuid)` — verifica role de super admin.

```sql
-- INSERT: isolado por conta
CREATE POLICY "storage-auth-media-insert-account"
ON storage.objects AS PERMISSIVE FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'media'
  AND is_user_in_account_or_shared(
    (storage.foldername(name))[1]::bigint,
    auth.uid()
  )
);

-- SELECT: isolado por conta
CREATE POLICY "storage-auth-media-select-account"
ON storage.objects AS PERMISSIVE FOR SELECT TO authenticated
USING (
  bucket_id = 'media'
  AND is_user_in_account_or_shared(
    (storage.foldername(name))[1]::bigint,
    auth.uid()
  )
);

-- DELETE: owner ou super_admin
CREATE POLICY "storage-auth-media-delete"
ON storage.objects AS PERMISSIVE FOR DELETE TO authenticated
USING (
  bucket_id = 'media'
  AND (owner_id = auth.uid()::text OR is_super_admin(auth.uid()))
);
```

### Bucket `classroom` — Políticas atuais

| Operação | Permissão |
|----------|-----------|
| `SELECT` | Autenticado com `has_module_access(uid, 'classroom')` ou `has_module_access(uid, 'classroom_premium')` |
| `INSERT` / `UPDATE` / `DELETE` | `super_admin` |

---

## Integração com Next.js

Utilizar exclusivamente o **Supabase SDK** com suporte SSR (`@supabase/ssr`).

| Contexto | Método | Finalidade |
|----------|--------|------------|
| Client Component | `createBrowserClient` | Uploads disparados pelo usuário |
| Server Side | `createServerClient` | Upload com metadados, URLs assinadas, deleção via Server Actions |

### Upload (Server Action)

```typescript
import { uploadMediaObject } from '@/lib/media'
import { buildUserAvatarPath } from '@/lib/media'

const path = buildUserAvatarPath({
  accountId: session.account.id,
  userId: session.user.id,
  filename: file.name,
})

await uploadMediaObject({
  file,
  path,
  metadata: {
    account_id: session.account.id,
    entity_type: 'user',
    entity_id: session.user.id,
    original_name: file.name,
  },
})
```

### Retrieval de URL

Atualmente, a **URL pública completa** é armazenada no banco (ex: `https://<project>.supabase.co/storage/v1/object/public/media/...`). Use `resolveMediaPublicUrl` para normalizar o valor, pois ele aceita tanto URL completa quanto path relativo:

```typescript
import { resolveMediaPublicUrl } from '@/lib/media'

// Aceita URL completa (passthrough) ou path relativo (adiciona base URL)
const publicUrl = resolveMediaPublicUrl(user.photo)
```

> ⚠️ **Implementação futura**: Após migração dos registros existentes, o banco passará a armazenar apenas o **path relativo**, e a URL será derivada em tempo de execução. O helper `resolveMediaPublicUrl` já suporta ambos os formatos para facilitar essa transição.

---

## Boas Práticas

1. **Helpers obrigatórios**: Use sempre os helpers de `src/lib/media/paths.ts` — nunca monte paths manualmente.
2. **Metadados completos**: Sempre passe `MediaMetadata` ao chamar `uploadMediaObject` para garantir rastreabilidade e suporte a RLS baseada em metadados.
3. **URL pública no banco**: Persista a URL pública completa retornada pelo upload. _(Implementação futura: migrar para armazenar apenas o path relativo e derivar a URL via `resolveMediaPublicUrl`.)_
4. **MIME Types**: Valide formatos no servidor antes do upload:
   - Imagens: `jpg`, `png`, `webp`
   - Documentos: `pdf`, `doc`, `xls`, `csv`
   - Áudio/Vídeo: `mp3`, `ogg`, `mp4`
5. **Cleanup não-bloqueante**: Ao deletar registros ou substituir arquivos, acione `cleanupMediaObject`. Como a política atual de DELETE restringe a `super_admin`, o retorno esperado é `pending-manual-cleanup` — esse resultado não deve bloquear a operação principal.
