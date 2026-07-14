# API

Documentação dos endpoints HTTP, Server Actions, códigos de erro e variáveis de ambiente do Gerador de Landing Pages.

> **CRUD no Projeto B:** para o padrão completo de leitura/escrita no segundo banco (camadas, templates, segurança), veja [server-actions.md](server-actions.md).

## Visão geral

| Tipo | Localização | Auth |
|------|-------------|------|
| Route Handlers | `app/api/` | Parcial (ver tabela abaixo) |
| Server Actions | `app/actions/` | `requireLpSession` |
| Auth callback | `app/auth/callback/` | Público |

## Route Handlers

### `POST /api/gerar-copy`

Gera copy (OpenAI) e imagens de cenário (Unsplash/banco local) **sem salvar** no banco. Usado pelo wizard entre os passos Imagens e Layout.

**Auth:** `requireLpSession` (401/403 se falhar)

**Runtime:** `nodejs`

#### Request body

```typescript
{
  name?: string;
  tema?: string;           // obrigatório
  city?: string;
  about?: string;
  diferenciais?: string[];
}
```

#### Response

**Sucesso (200):**
```json
{
  "copy": { "hero": { ... }, "dor": { ... }, ... },
  "images": { "hero": "https://...", "dor": "...", "sobre": "...", "solucao": "..." }
}
```

**Erros:** 400 (tema vazio), 401/403, 502 (OpenAI), 503 (sem API key)

---

### `POST /api/gerar-lp`

Gera uma landing page completa: monta schema JSON a partir do payload (copy/layout pré-gerados ou inline) e salva no Projeto B.

**Auth:** `requireLpSession` (401/403 se falhar)

**Runtime:** `nodejs`

#### Request body

```typescript
{
  name?: string;           // Nome do escritório (origem do slug — ver lib/slug.ts)
  tema?: string;           // Tema/foco jurídico da LP
  city?: string;
  whatsapp?: string;       // Somente dígitos
  whatsappDisplay?: string;
  email?: string;
  address?: string;
  mapsUrl?: string;
  about?: string;
  diferenciais?: string[];
  videoId?: string;        // YouTube video ID
  logoSrc?: string;        // Data URL
  logoBg?: { type: string; color: string };
  theme?: Theme;           // Paleta de cores
  lawyers?: Lawyer[];
  socials?: Social[];
  extraAddresses?: ExtraAddress[];
  // Pré-gerados pelo wizard (/api/gerar-copy)
  copy?: FocoCopy;
  images?: { hero: string; dor: string; sobre: string; solucao: string };
  // Layout inicial (variantes copiadas do preset no wizard)
  layout?: Layout;
}
```

#### Response

**Sucesso (200):**
```json
{ "ok": true, "slug": "escritorio-silva" }
```

O `slug` é alocado **no início** do handler, antes da geração IA:

1. Deriva do `name` via `slugFromOfficeName()` — kebab-case, sem acentos.
2. Se já existir em `landing_pages` (qualquer usuário), tenta sufixos `-2`, `-3`, …
3. Persiste com esse slug ao final; o front redireciona para `/lp/{slug}`.

Colisão esgotada → **409** `{ "error": "Não foi possível gerar um identificador único..." }`.

**Erros:**

| Status | Corpo | Causa |
|--------|-------|-------|
| 401 | `{ "error": "Não autenticado." }` | Sem sessão |
| 403 | `{ "error": "Sem acesso ao gerador de páginas." }` | Plano ≠ 9 |
| 400 | `{ "error": "..." }` | Payload inválido |
| 409 | `{ "error": "Não foi possível gerar um identificador único..." }` | Colisões de slug esgotadas |
| 503 | `{ "error": "OPENAI_API_KEY não configurada..." }` | Sem API key |
| 500 | `{ "error": "..." }` | Falha ao salvar |

---

### `POST /api/melhorar-texto`

Melhora trechos de texto (Sobre ou diferencial) via GPT-4o.

**Auth:** Nenhum guard explícito (apenas middleware de autenticação)

**Runtime:** `nodejs`

#### Request body

```typescript
{
  text?: string;           // Texto a melhorar (obrigatório)
  kind?: "sobre" | "diferencial";  // Default: "sobre"
  office?: { name?: string; product?: string };
}
```

#### Response

**Sucesso (200):**
```json
{ "texto": "Texto melhorado..." }
```

**Erros:**

| Status | Corpo |
|--------|-------|
| 400 | `{ "error": "Texto vazio." }` ou `{ "error": "Corpo inválido." }` |
| 502 | `{ "error": "..." }` |
| 503 | `{ "error": "OPENAI_API_KEY não configurada..." }` |

---

### `POST /api/melhorar-imagem`

Melhora qualidade de foto de advogado via Sharp (upscale, nitidez). Sem IA generativa.

**Auth:** Nenhum guard explícito

**Runtime:** `nodejs` | **maxDuration:** 60s

#### Request body

```typescript
{
  image?: string;  // Data URL: data:image/(png|jpeg|webp);base64,...
}
```

#### Response

**Sucesso (200):**
```json
{
  "image": "data:image/jpeg;base64,...",
  "before": { "width": 800, "height": 600 },
  "after": { "width": 1600, "height": 1200 }
}
```

**Erros:**

| Status | Corpo |
|--------|-------|
| 400 | `{ "error": "Imagem inválida..." }` |
| 502 | `{ "error": "..." }` |

---

### `GET /api/imagem`

Não implementado como GET. O endpoint aceita apenas POST.

### `POST /api/imagem`

Busca imagem de cenário para uma seção da LP (Unsplash ou banco local).

**Auth:** Nenhum guard explícito

**Dynamic:** `force-dynamic`

#### Request body

```typescript
{
  tema?: string;        // Tema jurídico
  sectionKey?: string;  // "hero" | "dor" | "sobre" | "solucao"
  current?: string;     // URL atual (evita repetir no fallback)
}
```

#### Response

**Sucesso (200):**
```json
{ "url": "https://images.unsplash.com/..." }
```

---

### `GET /auth/callback`

Callback OAuth/PKCE do Supabase Auth.

**Auth:** Público

#### Query params

| Param | Descrição |
|-------|-----------|
| `code` | Código de autorização |
| `next` | Destino após sucesso (default: `/`) |

#### Response

- Sucesso → `302` para `{origin}{next}`
- Falha → `302` para `/login?error=auth`

---

### `POST /api/lead` (proposto — não implementado)

Captura leads do popup nas landing pages publicadas.

#### Request body (proposta)

```typescript
{
  lpId?: string;          // UUID da LP
  clientSlug?: string;    // Subdomínio publicado
  name: string;
  phone: string;
  email?: string;
  answers?: Record<string, string>;  // Respostas do popup
  pageUrl: string;        // URL da página
}
```

#### Response (proposta)

**Sucesso (201):**
```json
{ "ok": true, "id": "uuid-do-lead" }
```

**Comportamento esperado:**
1. Validar campos obrigatórios (`name`, `phone`).
2. Resolver `causi_user_id` a partir de `lpId` ou `clientSlug`.
3. Inserir em `leads_gerador`.
4. Rota pública (sem auth de usuário) — proteger com rate limiting e validação de origem.

---

## Server Actions

Padrão geral: `"use server"` → `requireLpSession()` → função em `lib/*` → `lpAdmin()`. Detalhes, templates e mapa CRUD por tabela em [server-actions.md](server-actions.md).

### `saveLpAction(lp: StoredLp)`

**Arquivo:** `app/actions/lps.ts`

Salva (cria ou sobrescreve) uma LP no Projeto B.

**Auth:** `requireLpSession`

```typescript
type ActionResult = { ok: true } | { ok: false; error: string };
```

| Erro | Mensagem |
|------|----------|
| `UNAUTHENTICATED` | "Não autenticado." |
| `FORBIDDEN` | "Sem acesso ao gerador de páginas." |
| Slug/schema ausente | "LP inválida (faltou slug ou schema)." |

Revalida cache de `/` após sucesso.

---

### `suggestSimilarPaletteAction(baseTheme: Theme, avoidTheme?: Theme)`

**Arquivo:** `app/actions/palettes.ts`

Gera 1 Theme semelhante à paleta base (cores extraídas da logo) via GPT-4o, distinto de `avoidTheme` quando informado. Cada clique na varinha do wizard (`SugerirPaletasButton`) aplica o resultado na hora.

**Auth:** `requireLpSession`

```typescript
type SuggestSimilarPaletteResult =
  | { ok: true; theme: Theme }
  | { ok: false; error: string };
```

| Erro | Mensagem |
|------|----------|
| Sem sessão | "Não autenticado." / "Sem acesso ao gerador." |
| Theme inválido | "Paleta base inválida." |
| Sem `OPENAI_API_KEY` | "OPENAI_API_KEY não configurada…" |
| Resposta inválida | "A IA não retornou uma paleta válida." |

---

### `deleteLpAction(slug: string)`

**Arquivo:** `app/actions/lps.ts`

Remove LP pelo slug.

**Auth:** `requireLpSession`

Mesmo formato `ActionResult` de `saveLpAction`.

---

### `getConfigAction()`

**Arquivo:** `app/actions/config.ts`

Lê configuração global do usuário (`user_settings`).

**Auth:** `requireLpSession` (retorna `DEFAULT_CONFIG` se falhar)

**Retorno:** `GlobalConfig`

```typescript
{
  fonts: { heading: string; body: string };
  tags: { head: string; body: string; footer: string };
  domain: string;
}
```

---

### `saveConfigAction(c: GlobalConfig)`

**Arquivo:** `app/actions/config.ts`

Salva configuração global.

**Auth:** `requireLpSession`

**Retorno:** `{ ok: true } | { ok: false; error: string }`

---

## Códigos de erro internos

Usados por `requireLpSession` e convertidos em mensagens amigáveis:

| Código | HTTP equivalente | Mensagem ao usuário |
|--------|-------------------|---------------------|
| `UNAUTHENTICATED` | 401 | "Não autenticado." |
| `FORBIDDEN` | 403 | "Sem acesso ao gerador de páginas." |

Conversão em `app/actions/lps.ts`:

```typescript
function toMessage(err: unknown, fallback: string): string {
  if (err instanceof Error) {
    if (err.message === "UNAUTHENTICATED") return "Não autenticado.";
    if (err.message === "FORBIDDEN") return "Sem acesso ao gerador de páginas.";
    return err.message;
  }
  return fallback;
}
```

---

## Variáveis de ambiente

| Variável | Usada em | Obrigatória |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Auth, middleware, sessão | Sim |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Auth, middleware, sessão | Sim |
| `LP_SUPABASE_URL` | `lpAdmin()`, lpStore, config | Sim |
| `LP_SUPABASE_SERVICE_ROLE_KEY` | `lpAdmin()` | Sim |
| `OPENAI_API_KEY` | `gerar-copy`, `gerar-lp`, `melhorar-texto` | Sim* |
| `UNSPLASH_ACCESS_KEY` | `gerar-lp`, `imagem` | Não |
| `NEXT_PUBLIC_CAUSI_APP_URL` | Redirect sem plano | Não |

\* Sem `OPENAI_API_KEY`, endpoints de IA retornam 503.

---

## Resumo de proteção

| Endpoint | `requireLpSession` | Recomendação |
|----------|-------------------|--------------|
| `POST /api/gerar-lp` | Sim | OK |
| `POST /api/melhorar-texto` | Não | Adicionar guard |
| `POST /api/melhorar-imagem` | Não | Adicionar guard |
| `POST /api/imagem` | Não | Adicionar guard |
| `POST /api/lead` | N/A (público) | Rate limit + validação |
| `saveLpAction` | Sim | OK |
| `deleteLpAction` | Sim | OK |
| `saveConfigAction` | Sim | OK |

---

## Referências

- [features/authentication.md](features/authentication.md) — fluxo de auth
- [features/landing-pages.md](features/landing-pages.md) — geração e edição
- [features/leads.md](features/leads.md) — captura de leads (proposta)
- [database.md](database.md) — tabelas persistidas
