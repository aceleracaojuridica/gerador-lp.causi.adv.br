---
title: Implementação — Sistema de Autenticação
description: Documentação técnica completa da implementação de autenticação do Causi — camadas, arquivos, fluxos end-to-end e FAQ
---

# Implementação — Sistema de Autenticação

Documentação técnica completa do sistema de autenticação do Causi.

---

## Índice

1. [Fundamentos: O que é Autenticação?](#1-fundamentos-o-que-é-autenticação)
2. [Como o Supabase Auth funciona](#2-como-o-supabase-auth-funciona)
3. [Cookies vs Tokens: Por que importa no Next.js](#3-cookies-vs-tokens-por-que-importa-no-nextjs)
4. [Server-Side vs Client-Side no App Router](#4-server-side-vs-client-side-no-app-router)
5. [Estrutura de arquivos e responsabilidades](#5-estrutura-de-arquivos-e-responsabilidades)
6. [Camada 1 — Variáveis de Ambiente (`src/lib/env.ts`)](#6-camada-1--variáveis-de-ambiente-srclibenvts)
7. [Camada 2 — Clientes Supabase](#7-camada-2--clientes-supabase)
8. [Camada 3 — Middleware de Proteção de Rotas](#8-camada-3--middleware-de-proteção-de-rotas)
9. [Camada 4 — Helpers de Auth (`src/lib/auth/`)](#9-camada-4--helpers-de-auth-srclibauth)
10. [Camada 5 — Constantes de Configuração](#10-camada-5--constantes-de-configuração)
11. [Camada 6 — Custom Hook de Reenvio](#11-camada-6--custom-hook-de-reenvio)
12. [Camada 7 — Componentes de Auth](#12-camada-7--componentes-de-auth)
13. [Camada 8 — Formulários de Auth](#13-camada-8--formulários-de-auth)
14. [Camada 9 — Páginas de Auth (App Router)](#14-camada-9--páginas-de-auth-app-router)
15. [Camada 10 — Route Handlers de Callback](#15-camada-10--route-handlers-de-callback)
16. [Camada 11 — Provisioning de Conta (`/confirmar`)](#16-camada-11--provisioning-de-conta-confirmar)
17. [Fluxos completos end-to-end](#17-fluxos-completos-end-to-end)
18. [Segurança: O que protege o quê](#18-segurança-o-que-protege-o-quê)
19. [Perguntas frequentes (FAQ)](#19-perguntas-frequentes-faq)

---

## 1. Fundamentos: O que é Autenticação?

**Autenticação** é o processo de verificar *quem* é o usuário. Diferente de **autorização** (o que o usuário *pode fazer*), autenticação responde: "você é quem diz ser?"

No contexto web, isso envolve três etapas:

```
1. Usuário apresenta credenciais (e-mail + senha)
2. Servidor verifica as credenciais
3. Servidor emite um "comprovante" de identidade (token/sessão)
```

O "comprovante" é então enviado em cada requisição subsequente para que o servidor reconheça o usuário sem pedir a senha novamente.

### JWT — JSON Web Token

O Supabase usa **JWTs** como comprovante de identidade. Um JWT é uma string Base64 com 3 partes separadas por ponto:

```
eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1c2VyLXV1aWQiLCJlbWFpbCI6InVzdWFyaW9AZXhhbXBsZS5jb20iLCJleHAiOjE3MDAwMDAwMDB9.ASSINATURA
  ^— HEADER (algoritmo)      ^— PAYLOAD (dados do usuário)                                              ^— ASSINATURA
```

O **payload** contém as "claims" (afirmações):
```json
{
  "sub": "uuid-do-usuario",        // ID único (subject)
  "email": "usuario@example.com",
  "role": "authenticated",
  "exp": 1700000000,               // Expira em (timestamp Unix)
  "iat": 1699996400,               // Emitido em (issued at)
  "user_metadata": { "full_name": "João Silva" },
  "app_metadata": { "provider": "email" }
}
```

O JWT é **assinado** com uma chave secreta que só o Supabase conhece (`JWT_SECRET`). Qualquer alteração no payload invalida a assinatura, tornando impossível a falsificação.

---

## 2. Como o Supabase Auth funciona

O Supabase Auth é um serviço gerenciado que lida com:

- ✅ Criação e verificação de contas (e-mail + senha)
- ✅ Confirmação de e-mail
- ✅ Recuperação de senha
- ✅ Emissão e renovação de JWTs
- ✅ OAuth (Google, GitHub, etc.) — não implementado no Causi MVP
- ✅ Magic Links

### Tokens emitidos pelo Supabase

Após uma autenticação bem-sucedida, o Supabase emite dois tokens:

| Token | Duração | Propósito |
|-------|---------|-----------|
| `access_token` (JWT) | ~1 hora | Identifica o usuário em cada requisição |
| `refresh_token` | 60 dias (configurável) | Obtém novos `access_token` quando o atual expira |

### Como os tokens chegam ao browser

O `@supabase/ssr` salva os tokens em **cookies HTTP** (não em `localStorage`). Isso é fundamental para que o servidor Next.js consiga ler a sessão sem JavaScript.

```
Login bem-sucedido
      ↓
Supabase retorna { access_token, refresh_token }
      ↓
@supabase/ssr salva em cookies: sb-{project}-auth-token
      ↓
Browser envia esses cookies em TODA requisição subsequente
      ↓
Servidor lê os cookies → sabe quem é o usuário
```

### Cookie "chunking": `sb-<project>-auth-token.0`, `.1`, ...

Em alguns casos, você vai ver o Supabase criar mais de um cookie para a sessão:

- `sb-<project>-auth-token.0`
- `sb-<project>-auth-token.1`
- (e assim por diante)

Isso é esperado. O conteúdo do cookie de sessão pode ficar grande (JWT + metadados + refresh token), e browsers impõem um limite de tamanho por cookie. Para não estourar esse limite, o `@supabase/ssr` divide o valor em "chunks" e grava cada parte com um sufixo numérico (`.0`, `.1`, ...). Na leitura, o `@supabase/ssr` reagrupa as partes na ordem e reconstrói o valor original.

Referências:
- Supabase Auth SSR (Next.js): https://supabase.com/docs/guides/auth/server-side/nextjs
- Implementação do `@supabase/ssr` (cookie storage/chunking): https://github.com/supabase/ssr

### Renovação automática de token

Quando o `access_token` expira (após ~1h), o `@supabase/ssr` usa o `refresh_token` para obter um novo par de tokens. Isso acontece transparentemente:

1. Middleware detecta token expirado
2. Chama a API do Supabase com o `refresh_token`
3. Recebe novos `access_token` + `refresh_token`
4. Atualiza os cookies na resposta HTTP

O usuário nunca percebe isso — a sessão continua ativa.

---

## 3. Cookies vs Tokens: Por que importa no Next.js

### Por que não usar localStorage?

`localStorage` é uma opção comum em SPAs (Single Page Applications), mas o Causi usa o **Next.js App Router**, que renderiza páginas no servidor. O servidor não tem acesso ao `localStorage` do browser — ele só existe no cliente.

```
[Servidor Next.js]              [Browser]
       ↑                            ↑
  Não tem                     Tem acesso a
  acesso a                    localStorage
  localStorage
```

**Cookies HTTP**, por outro lado, são enviados pelo browser em TODA requisição HTTP — incluindo as que vão ao servidor Next.js. Isso permite que o servidor leia a sessão do usuário.

### Cookies httpOnly vs cookies comuns

O `@supabase/ssr` configura os cookies de sessão como `httpOnly`:

```
Set-Cookie: sb-auth-token=...; Path=/; HttpOnly; Secure; SameSite=Lax
```

- **`HttpOnly`**: O cookie não é acessível via JavaScript (`document.cookie`).
  Isso previne ataques **XSS** (Cross-Site Scripting) — um script malicioso
  injetado na página não consegue roubar o token.
- **`Secure`**: O cookie só é enviado em conexões HTTPS.
- **`SameSite=Lax`**: Previne ataques **CSRF** em contextos cross-site.

---

## 4. Server-Side vs Client-Side no App Router

O Next.js App Router tem dois tipos de componentes com comportamentos radicalmente diferentes:

### React Server Components (RSC)

```tsx
// app/dashboard/page.tsx — Nenhum "use client" = Server Component por padrão

export default async function DashboardPage() {
  // Executa APENAS no servidor — nunca no browser
  const supabase = await createClient()           // servidor
  const { data: { user } } = await supabase.auth.getUser()

  // O HTML é gerado no servidor e enviado pronto ao browser
  return <div>Olá, {user?.email}</div>
}
```

**Características dos RSC:**
- Executam no servidor (Node.js)
- Têm acesso a: filesystem, variáveis de ambiente privadas, banco de dados diretamente
- NÃO têm acesso a: `window`, `document`, `localStorage`, APIs de browser
- NÃO usam hooks React (`useState`, `useEffect`, etc.)
- Não são re-renderizados no browser — o HTML é enviado pronto

### Client Components

```tsx
"use client"  // ← Esta diretiva transforma em Client Component

import { useState } from "react"

export function LoginForm() {
  // useState funciona aqui porque é Client Component
  const [email, setEmail] = useState("")

  // Este código executa NO BROWSER (também é pré-renderizado no servidor, mas hidratado no cliente)
  return <input value={email} onChange={(e) => setEmail(e.target.value)} />
}
```

**Características dos Client Components:**
- Têm acesso completo às APIs do browser
- Usam hooks React (`useState`, `useEffect`, `useCallback`, etc.)
- São "hidratados" no browser (React assume o controle do HTML pré-renderizado)
- NÃO devem acessar variáveis de ambiente privadas (ficam expostas no bundle)

### Regra de ouro: qual cliente Supabase usar onde?

```
Server Component, Server Action (sem context)
  └── createClient() de @/lib/supabase/server

Middleware, Route Handler (com context)
  └── createClient({ request, response }) de @/lib/supabase/server

Client Component (use client)
  └── createClient() de @/lib/supabase/client
```

---

## 5. Estrutura de arquivos e responsabilidades

```bash
src/
├── proxy.ts                              # Proteção de rotas (executa antes de tudo)
│
├── lib/
│   ├── env.ts                            # Variáveis de ambiente validadas
│   ├── supabase/
│   │   ├── client.ts                     # Cliente para Client Components
│   │   ├── server.ts                     # Cliente para Server Components/Actions
│   │   └── proxy.ts                      # Cliente para o middleware
│   ├── auth/
│   │   ├── auth.ts                       # Helpers: buildAuthCallbackUrl, getSafeRedirectPath, getAuthErrorMessage
│   │   ├── actions.ts                    # Server Action: logoutAction
│   │   └── auth-toast.ts                 # Toast com link para provedor de e-mail
│   └── constants/
│       ├── auth-email.ts                 # Provedores de e-mail e fallback
│       ├── location.ts                   # Estados brasileiros e códigos de país
│       └── onboarding.ts                 # Constantes de provisioning (plano free, pipeline)
│
├── hooks/
│   └── use-auth-email-resend.ts          # Hook de cooldown para reenvio de e-mail
│
├── components/
│   ├── auth/
│   │   ├── auth-page-shell.tsx           # Wrapper visual das páginas de auth
│   │   ├── auth-form-shell.tsx           # Container dos formulários de auth
│   │   └── auth-advisor.tsx              # Feedback de estado pós-ação
│   └── atoms/
│       └── avatar-dropdown.tsx           # Dropdown do usuário autenticado
│
├── forms/
│   ├── SignInForm/                       # Formulário de login
│   ├── SignUpForm/                       # Formulário de cadastro
│   ├── ForgotPasswordForm/               # Formulário de recuperação de senha
│   └── UpdatePasswordForm/               # Formulário de nova senha
│
└── app/
    ├── (auth)/                            # Route Group público (sem autenticação)
    │   ├── layout.tsx                     # Layout das páginas de auth
    │   ├── login/page.tsx                 # /login
    │   ├── cadastrar/page.tsx             # /cadastrar (signup com feature flag)
    │   ├── confirmar/                     # /confirmar (provisioning pós-signup)
    │   │   ├── page.tsx                   # Server Component — roteia por status
    │   │   ├── page.client.tsx            # Client Component — provisioning + redirect
    │   │   ├── confirm-email.client.tsx   # Client Component — tela de confirmação de e-mail
    │   │   └── actions.ts                 # Server Action: provisionFreeAccountAction
    │   └── redefinir/page.tsx             # /redefinir
    │
    └── auth/                              # Rotas internas de callback
        ├── callback/route.ts              # /auth/callback (GET: code/token_hash, POST: hash tokens)
        └── hash-callback/page.tsx         # /auth/hash-callback (recovery por hash fragment)
```

---

## 6. Camada 1 — Variáveis de Ambiente (`src/lib/env.ts`)

**Arquivo:** `src/lib/env.ts`

### Por que existem duas chaves do Supabase?

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://xyzxyz.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=eyJhbGc...   # Pública — vai para o browser
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...              # PRIVADA — NUNCA no browser
NEXT_PUBLIC_APP_URL=https://app.causi.com.br
```

| Variável | Visibilidade | Uso |
|----------|-------------|-----|
| `NEXT_PUBLIC_SUPABASE_URL` | Browser + Servidor | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Browser + Servidor | Chave pública (respeita RLS) |
| `SUPABASE_SERVICE_ROLE_KEY` | **Apenas Servidor** | Bypassa RLS — nunca utilizar |
| `NEXT_PUBLIC_APP_URL` | Browser + Servidor | URL da app (para redirects) |

### Prefixo `NEXT_PUBLIC_`

Variáveis com `NEXT_PUBLIC_` são **injetadas no bundle JavaScript** enviado ao browser. Qualquer pessoa pode inspecionar o bundle e ver essas variáveis — por isso só devem conter dados não-sensíveis.

A `anon key` (chamada `PUBLISHABLE_KEY` no Causi) é segura no browser porque o Supabase a combina com as **políticas de Row Level Security (RLS)** para limitar o que cada usuário pode acessar. Mesmo que alguém roube a chave pública, não consegue acessar dados de outro usuário graças ao RLS.

A `SERVICE_ROLE_KEY` bypassa completamente o RLS — quem a tem pode ler e modificar qualquer dado de qualquer usuário. Por isso, **NUNCA** deve chegar ao browser.

### Validação com Zod

O `env.ts` usa um **Zod schema** para validar e transformar as variáveis de ambiente em tempo de inicialização. Se alguma variável obrigatória estiver ausente, a aplicação falha imediatamente — não silenciosamente em runtime.

Implementação: [`src/lib/env.ts`](../../src/lib/env.ts)

**Por que Zod?** O schema valida formato da URL (protocolo + hostname), garante que pelo menos uma chave pública Supabase está presente, e resolve o fallback automaticamente via `.transform()`. Se houver erro, a mensagem é descritiva e indica exatamente qual variável está faltando.

**Dois nomes de chave pública:** O projeto aceita tanto `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` quanto `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` como fallback. Isso permite flexibilidade na configuração sem quebrar deploys existentes.

---

## 7. Camada 2 — Clientes Supabase

### 7.1 Cliente para o Browser (`src/lib/supabase/client.ts`)

```typescript
import { createBrowserClient } from "@supabase/ssr";
import { env } from "../env";

export function createClient() {
  return createBrowserClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}
```

**Como funciona internamente:**

O `createBrowserClient` cria uma instância do Supabase SDK configurada para rodar no browser. Internamente, ele:

1. Usa `document.cookie` para ler e escrever cookies (em vez de `localStorage`)
2. Configura um listener de eventos de autenticação (`onAuthStateChange`)
3. Gerencia a renovação automática do `access_token` quando ele expira

**Quando usar:**
```tsx
"use client"
// ✅ Correto: Client Component
import { createClient } from "@/lib/supabase/client"

function MyClientComponent() {
  const supabase = createClient()
  // ...
}
```

```tsx
// ❌ ERRADO: Server Component sem "use client"
import { createClient } from "@/lib/supabase/client"
// Erro: createBrowserClient não funciona no servidor
```

### 7.2 Cliente para o Servidor (`src/lib/supabase/server.ts`)

A função `createClient` do servidor é **unificada** — aceita um `context` opcional que determina como os cookies são lidos e escritos.

Implementação: [`src/lib/supabase/server.ts`](../../src/lib/supabase/server.ts)

**Por que um único `createClient` com overload?**

Em vez de manter funções separadas para servidor e middleware, o design unificado usa um `context` opcional:

| Chamada | Contexto | Uso |
|---------|---------|-----|
| `createClient()` | Nenhum | Server Components, Server Actions |
| `createClient({ request, response })` | `MiddlewareContext` | Middleware (proxy.ts) |
| `createClient({ request, response })` | `RouteHandlerContext` | Route Handlers (callback) |

A função `isMiddlewareContext()` diferencia os contextos: se `response` tem a propriedade `current` (um objeto wrapper), é middleware; caso contrário, é Route Handler.

**Por que há um `try/catch` no `setAll` sem context?**

Em **Server Components puros** (RSC), o Next.js não permite escrever cookies porque a resposta HTTP já pode ter começado a ser enviada. O `try/catch` silencia esse erro — o middleware se encarrega de renovar os tokens nesses casos.

Em **Server Actions** e **Route Handlers**, `setAll` funciona normalmente.

### 7.3 Uso no Middleware (`src/lib/supabase/proxy.ts`)

O middleware não tem um cliente separado. Ele usa `createClient` do `server.ts` passando o contexto `{ request, response }` do tipo `MiddlewareContext`:

```typescript
// src/lib/supabase/proxy.ts
import { createClient } from "./server";

export async function updateSession(request: NextRequest) {
  const response = { current: NextResponse.next({ request }) };

  const supabase = await createClient({ request, response });

  // getClaims() decodifica o JWT localmente (sem rede)
  const { data: claimsData, error } = await supabase.auth.getClaims();
  const isAuthenticated = Boolean(claimsData?.claims?.sub) && !error;

  // ... lógica de roteamento (detalhada na Seção 8)

  return response.current;
}
```

**Por que `response` é `{ current: NextResponse }`?**

Quando o Supabase renova tokens, ele chama `setAll` com novos cookies. O `isMiddlewareContext()` detecta o wrapper `{ current }` e recria a response via `NextResponse.next({ request })` com os cookies atualizados. O padrão de referência mutavél (`response.current = ...`) garante que a response final sempre inclua os tokens renovados.

---

## 8. Camada 3 — Middleware de Proteção de Rotas

**Arquivo:** `src/proxy.ts`

O middleware é o **guardião de todas as rotas**. Ele executa em todo request HTTP antes de qualquer código React ou de servidor.

```
Browser           Edge Runtime (proxy.ts)        Servidor Next.js
   │                        │                               │
   │──── GET /dashboard ───▶│                               │
   │                        │ createClient({ request, response }) │
   │                        │ supabase.auth.getClaims()     │
   │                        │                               │
   │                        │ user? ──── NÃO ─────────────▶│ redirect /login
   │                        │      └─── SIM ─────────────▶│ renderiza /dashboard
   │◀────────────────────────│                               │
```

### `getClaims()` vs `getUser()` no Middleware

> **Atenção:** O middleware do Causi usa `getClaims()` (decodificação local do JWT) em vez de `getUser()` (validação via rede). Essa é uma decisão **deliberada de performance** — o middleware roda em **todo request** e `getUser()` adicionaria latência de rede a cada um. Como o JWT é assinado e verificável localmente, `getClaims()` é aceitável para decidir redirecionamentos no middleware. A validação completa com `getUser()` é feita nos Server Components e Server Actions que precisam de dados frescos.

Para referência, as diferenças entre os métodos:

```typescript
// ✅ getClaims() — rápido, decodifica localmente, usado no middleware
const { data: claimsData, error } = await supabase.auth.getClaims()
const isAuthenticated = Boolean(claimsData?.claims?.sub) && !error

// ✅ getUser() — valida com o servidor Supabase, usado em Server Components/Actions
const { data: { user } } = await supabase.auth.getUser()
```

### Lógica de roteamento

O middleware usa um `Set` de rotas de auth e avalia dois cenários principais:

```typescript
const AUTH_ROUTES = new Set(["/login", "/cadastrar", "/confirmar", "/redefinir"])

function isPublicRoute(pathname: string) {
  return AUTH_ROUTES.has(pathname) || pathname.startsWith("/auth/callback")
}
```

1. **Usuário não autenticado em rota privada** → redirect para `/login?next=<rota-original>` (destino preservado via `getSafeRedirectPath`)
2. **Usuário autenticado em rota de auth** → redirect para `/dashboard` (ou param `next`), com duas exceções:
   - `/confirmar` — provisioning requer sessão ativa
   - `/redefinir?mode=update` — redefinição de senha requer token de recovery

Implementação: [`src/lib/supabase/proxy.ts`](../../src/lib/supabase/proxy.ts)

**Por que preservar `next`?**

Quando o usuário tenta acessar `/dashboard/conversas` sem estar logado, ele é redirecionado para `/login?next=/dashboard/conversas`. Após o login bem-sucedido, o parâmetro `next` é lido e o usuário é redirecionado para o destino original.

**Por que a exceção para `/redefinir?mode=update`?**

No fluxo de recuperação de senha, o usuário já está autenticado (o token de recovery criou uma sessão) mas precisa acessar o formulário de nova senha. Sem essa exceção, seria redirecionado para o dashboard antes de poder trocar a senha.

**Por que a exceção para `/confirmar`?**

A página `/confirmar` é a etapa de provisioning — cria `public.users`, `public.accounts` e `public.pipelines` via RPC. O usuário precisa estar autenticado (sessão ativa) para que o Server Action possa chamar `getUser()` e executar a RPC. Sem essa exceção, o middleware redirecionaria o usuário para o dashboard antes do provisioning acontecer.

### O `config.matcher`

```typescript
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
```

Este regex exclui do middleware:
- `_next/static/` — assets estáticos compilados pelo Next.js
- `_next/image/` — API de otimização de imagem
- `favicon.ico`
- Arquivos com extensão de imagem (`.svg`, `.png`, etc.)

Sem essa exclusão, o middleware rodaria para cada asset estático, aumentando a latência sem necessidade.

---

## 9. Camada 4 — Helpers de Auth (`src/lib/auth/`)

### 9.1 `auth.ts` — Helpers compartilhados

**Arquivo:** `src/lib/auth/auth.ts`

Contém funções utilitárias usadas tanto no servidor quanto no cliente (sem dependências de servidor).

#### `buildAuthCallbackUrl(nextPath)`

```typescript
export function buildAuthCallbackUrl(nextPath: string) {
  const callbackUrl = new URL("/auth/callback", env.NEXT_PUBLIC_APP_URL);
  callbackUrl.searchParams.set("next", getSafeRedirectPath(nextPath));
  return callbackUrl.toString();
}
```

Constrói a URL de callback SSR para fluxos de e-mail do Supabase Auth. Usa `NEXT_PUBLIC_APP_URL` como origin confiável (não `window.location.origin`, que pode ser manipulado).

#### `getSafeRedirectPath(value?, fallbackPath?)`

```typescript
export function getSafeRedirectPath(
  value?: string | null,
  fallbackPath = "/dashboard",
) {
  const candidate = typeof value === "string" ? value.trim() : "";
  if (!candidate) return fallbackPath;

  let decoded: string;
  try { decoded = decodeURIComponent(candidate); } catch { return fallbackPath; }

  if (
    !decoded.startsWith("/") ||
    decoded.startsWith("//") ||
    decoded.includes("\\") ||
    /[\r\n]/.test(decoded) ||
    /^\/[a-z][a-z0-9+\-.]*:/i.test(decoded)  // Bloqueia protocolos embutidos
  ) {
    return fallbackPath;
  }

  return decoded;
}
```

Valida e normaliza um caminho de redirect para prevenir **Open Redirect**. Decodifica o candidato com `decodeURIComponent` antes de validar, bloqueando ataques via URL encoding (ex: `/%2F%2Fevil.com`). Rejeita paths que começam com `//`, contêm `\`, quebras de linha, ou protocolos embutidos.

#### `getAuthErrorMessage(error)`

```typescript
export function getAuthErrorMessage(error: { message?: string } | null) {
  const errorMessage = error?.message?.toLowerCase().trim();
  if (!errorMessage) return "Não foi possível concluir a autenticação. Tente novamente.";

  const matchedMessage = AUTH_ERROR_MESSAGES.find(([pattern]) =>
    errorMessage.includes(pattern),
  );
  return matchedMessage?.[1] ?? "Não foi possível concluir a autenticação.";
}
```

Mapeia mensagens de erro do Supabase Auth (em inglês) para mensagens amigáveis em português. O mapeamento usa `Array<[string, string]>` com pattern matching parcial (`includes`), cobrindo erros como `"invalid login credentials"`, `"email not confirmed"`, `"email rate limit exceeded"`, etc.

### 9.2 `actions.ts` — Server Actions

**Arquivo:** `src/lib/auth/actions.ts`

Atualmente contém apenas a ação de logout:

```typescript
"use server"

export async function logoutAction() {
  const supabase = await createClient()
  const { error } = await supabase.auth.signOut()

  if (error) return { error: "Não foi possível desconectar" }
  return { success: true }
}
```

> **Nota arquitetural:** Diferente do `signIn` (que poderia ser uma Server Action), o `signUp` é chamado diretamente via SDK Supabase no Client Component (`SignUpForm`). Isso permite acesso imediato ao `data.session` para decidir o próximo passo (redirect vs confirmação de e-mail), e possibilita UX reativa com feedback visual instantâneo (indicadores de força de senha, validações em tempo real).

As Server Actions de provisioning estão em `src/app/(auth)/confirmar/actions.ts` (ver [Camada 11](#16-camada-11--provisioning-de-conta-confirmar)).

### 9.3 `auth-toast.ts` — Toast com link para provedor de e-mail

Implementação: [`src/lib/auth/auth-toast.ts`](../../src/lib/auth/auth-toast.ts)

Exibe um toast de sucesso com um botão de ação que abre o provedor de e-mail do usuário (Gmail, Outlook, Yahoo, iCloud). O provedor é detectado automaticamente pelo domínio do e-mail. Se não for reconhecido, exibe o fallback genérico "Abrir e-mail".

---

## 10. Camada 5 — Constantes de Configuração

### `src/lib/constants/auth-email.ts`

Define os provedores de e-mail reconhecidos (Gmail, Outlook, Yahoo, iCloud) e o fallback genérico, cada um com label, URL e padrão de detecção por domínio (`domainIncludes` ou `domainRegex`).

Implementação: [`src/lib/constants/auth-email.ts`](../../src/lib/constants/auth-email.ts)

Estas constantes alimentam o `showAuthEmailToast` (Seção 9.3) e o `AuthAdvisorResendButton` (Seção 12.3) para detectar o provedor de e-mail do usuário e oferecer um link direto.

### `src/lib/constants/location.ts`

Contém listas de localização (estados brasileiros, códigos de país) usadas nos formulários de cadastro e perfil.

Implementação: [`src/lib/constants/location.ts`](../../src/lib/constants/location.ts)

> **Nota:** As rotas de auth (`/login`, `/cadastrar`, `/confirmar`, `/redefinir`) são definidas como um `Set` local dentro de `proxy.ts` (Seção 8), não em um arquivo de constantes separado.

### `src/lib/constants/onboarding.ts`

Contém constantes de provisioning usadas pelo Server Action `provisionFreeAccountAction`: o plano free padrão, o nome do pipeline inicial e os estágios do Kanban criados automaticamente durante o signup.

Implementação: [`src/lib/constants/onboarding.ts`](../../src/lib/constants/onboarding.ts)

---

## 11. Camada 6 — Custom Hook de Reenvio

**Arquivo:** `src/hooks/use-auth-email-resend.ts`

Este hook encapsula o reenvio de e-mails de auth (signup ou recovery) com cooldown temporizado.

### Interface do hook

```typescript
"use client";

type AuthEmailResendKind = "signup" | "recovery";

interface UseAuthEmailResendOptions {
  kind: AuthEmailResendKind;
  email?: string;
  nextPath: string;
  fallbackNextPath?: string;     // default: "/dashboard"
  cooldownSeconds?: number;      // default: 60
  missingEmailMessage: string;   // mensagem se email estiver ausente
  successMessage: string;        // título do toast de sucesso
}

export function useAuthEmailResend(options: UseAuthEmailResendOptions) {
  // ...
  return {
    resend,                      // função async para disparar reenvio
    canResend,                   // boolean: pode reenviar agora?
    isSending,                   // boolean: requisição em andamento
    cooldownRemainingSeconds,    // número: segundos restantes do cooldown
    safeNextPath,                // string: nextPath validado
  };
}
```

### Como funciona internamente

O hook usa um padrão de **timestamp absoluto** em vez de contagem regressiva decrescente:

```typescript
const [cooldownUntil, setCooldownUntil] = useState<number | null>(null);
const [now, setNow] = useState(() => Date.now());

// Timer atualiza "now" a cada 500ms enquanto há cooldown ativo
useEffect(() => {
  if (!cooldownUntil) return;
  const timer = window.setInterval(() => setNow(Date.now()), 500);
  return () => window.clearInterval(timer);
}, [cooldownUntil]);

const cooldownRemainingSeconds = cooldownUntil
  ? Math.max(0, Math.ceil((cooldownUntil - now) / 1000))
  : 0;
```

**Vantagem sobre `setInterval` com decremento:** O timestamp absoluto não acumula drift — mesmo que o timer seja impreciso, o cálculo `cooldownUntil - now` sempre reflete o tempo real restante.

### Lógica de reenvio

A função `resend` diferencia entre signup e recovery:

```typescript
const { error } =
  kind === "signup"
    ? await supabase.auth.resend({ type: "signup", email, options: { emailRedirectTo } })
    : await supabase.auth.resetPasswordForEmail(email, { redirectTo });
```

Após sucesso, inicia o cooldown e exibe um toast com link para o provedor de e-mail (via `showAuthEmailToast`).

### Uso no componente

O hook é consumido internamente pelo sub-componente `AuthAdvisorResendButton` (Seção 12.3). Não é usado diretamente em páginas.

---

## 12. Camada 7 — Componentes de Auth

### 12.1 `AuthPageShell` — `src/components/auth/auth-page-shell.tsx`

Servidor Component que fornece a estrutura visual das páginas de auth.

Implementação: [`src/components/auth/auth-page-shell.tsx`](../../src/components/auth/auth-page-shell.tsx)

A estrutura usa `h-dvh` (viewport dinâmico) para ocupar a tela inteira, com um header fixo contendo o logotipo e uma área principal centralizada. O padrão de "shell" é um caso de **composição sobre herança** — cada página compõe o shell via `children`.

### 12.2 `AuthFormShell` — `src/components/auth/auth-form-shell.tsx`

Aceita as props `title`, `description`, `children` e três props opcionais de footer (`footerLabel`, `footerHref`, `footerText`). O footer só renderiza quando todos os três valores estão presentes.

Implementação: [`src/components/auth/auth-form-shell.tsx`](../../src/components/auth/auth-form-shell.tsx)

**Padrão de composição com `children` e slots nomeados:**

`children` (conteúdo principal) + `footerLabel`/`footerHref`/`footerText` (navegação auxiliar) formam "slots" que permitem customizar diferentes partes do componente. O footer só renderiza quando todos os três valores estão presentes.

### 12.3 `AuthAdvisor` — `src/components/auth/auth-advisor.tsx`

Client Component que exibe feedback visual para diferentes estados do fluxo de autenticação. Usa um mapa de configurações para renderizar ícone, texto e ações conforme o tipo:

```tsx
"use client";

import { LinkOff, Mail, Report, Widgets } from "@material-symbols-svg/react";

export type AuthAdvisorType =
  | "confirm-email"         // Aguardando confirmação de e-mail
  | "link-sent"             // Link de redefinição enviado
  | "expired-link"          // Link expirado
  | "provisioning-error"    // Erro no provisioning de conta
  | "configuring-account"   // Provisioning em andamento
  | "configured-account"    // Provisioning concluído, redirecionando

export interface AuthAdvisorProps {
  type: AuthAdvisorType;
  email?: string;
  loginUrl?: string;
  onResend?: () => Promise<void> | void;
  onRetry?: () => void;           // Callback para retry de provisioning
  showResend?: boolean;
  isNewLink?: boolean;
  resendDisabled?: boolean;
  resendLabel?: string;
  resend?: AuthAdvisorResendConfig; // Config delegada ao AuthAdvisorResendButton
}
```

Exemplos de renderização por tipo:

| Tipo | Ícone | Título | Ações |
|------|-------|--------|-------|
| `confirm-email` | `Mail` | Confirmar E-mail | Botão reenviar + Voltar ao Login |
| `link-sent` | `Mail` | Link Enviado | Botão reenviar + Voltar ao login |
| `expired-link` | `LinkOff` | Link Expirado | Ir para o login |
| `provisioning-error` | `Report` | Erro na Configuração | Botão "Tentar novamente" (via `onRetry`) + Voltar ao Login |
| `configuring-account` | `Widgets` | Configurando Conta | Spinner |
| `configured-account` | `Widgets` | Configuração Concluída | Spinner |

**Sub-componente `AuthAdvisorResendButton`:**

Quando a prop `resend` (tipo `AuthAdvisorResendConfig`) é fornecida, o `AuthAdvisor` delega o botão de reenvio para o `AuthAdvisorResendButton`, que usa o hook `useAuthEmailResend` (Seção 11) para gerenciar cooldown e exibir contagem regressiva.

Implementação: [`src/components/auth/auth-advisor.tsx`](../../src/components/auth/auth-advisor.tsx)

### 12.4 `AvatarDropdown` — `src/components/atoms/avatar-dropdown.tsx`

Implementação: [`src/components/atoms/avatar-dropdown.tsx`](../../src/components/atoms/avatar-dropdown.tsx)

O componente não recebe props — utiliza hooks (`useTheme`, `useTransition`, `useRouter`) para gerenciar tema e logout. O logout usa `useTransition` para manter a UI responsiva durante a Server Action `logoutAction`.

---

## 13. Camada 8 — Formulários de Auth

Todos os formulários de auth seguem o mesmo padrão de 4 arquivos:

```
FormName/
├── schema.ts           # Regras de validação Zod
├── form-name.types.ts  # Tipos TypeScript inferidos do schema
├── form-name.tsx       # Componente do formulário (Client Component)
└── index.ts            # Barrel export
```

### Por que Zod?

Zod permite definir regras de validação e **inferir os tipos TypeScript automaticamente**:

```typescript
// schema.ts
const signInSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(1, "Senha obrigatória"),
})

// types.ts — Zero código manual de tipo!
type SignInFormValues = z.infer<typeof signInSchema>
// Equivalente a: { email: string; password: string }
```

### Por que `react-hook-form`?

`react-hook-form` é a biblioteca padrão de formulários React. Ela:
- Gerencia estado dos campos sem re-renders excessivos (usa refs, não state para inputs)
- Integra nativamente com Zod via `zodResolver`
- Provê acesso ao estado de validação de cada campo (`errors`, `isDirty`, `isValid`)

### 13.1 SignInForm

Implementação: [`src/forms/SignInForm/signin-form.tsx`](../../src/forms/SignInForm/signin-form.tsx)

**Verificação de provisioning pós-login:** Após `signInWithPassword`, o formulário consulta `public.users` para verificar se `account_id` existe. Se o usuário não tem provisioning (ex: interrompeu o fluxo de cadastro), é redirecionado para `/confirmar` onde o `ConfirmarClient` executa a RPC.

### 13.2 SignUpForm

O `SignUpForm` é um Client Component que chama o SDK Supabase diretamente (em vez de Server Actions), porque precisa inspecionar `data.session` imediatamente para decidir o fluxo:

Implementação: [`src/forms/SignUpForm/signup-form.tsx`](../../src/forms/SignUpForm/signup-form.tsx)

**Dois caminhos pós-`signUp`:**

| Cenário | `data.session` | Fluxo |
|---------|----------------|-------|
| Confirmação de e-mail **desabilitada** | Existe | Redirect para `/confirmar` → provisioning → redirect |
| Confirmação de e-mail **habilitada** (padrão) | `null` | Redirect para `/confirmar?status=confirm-email` → e-mail → callback → provisioning |

**Nota:** Ambos os caminhos redirecionam para `/confirmar`. O provisioning é sempre executado pelo `ConfirmarClient`, nunca inline no formulário.

O schema usa `.refine()` para validações cross-field:

```typescript
const signUpSchema = z.object({ ... })
  .refine(
    (data) => data.password === data.confirmPassword,
    {
      message: "As senhas não coincidem",
      path: ["password_confirm"],  // ← Qual campo exibe o erro
    }
  )
```

### 13.3 ForgotPasswordForm e UpdatePasswordForm

Seguem o mesmo padrão do `SignUpForm`, com `sentToEmail` para controlar o estado pós-envio.

---

## 14. Camada 9 — Páginas de Auth (App Router)

### Route Groups `(auth)`

```
app/
└── (auth)/              ← Parênteses = Route Group (invisível na URL)
    ├── layout.tsx        ← Layout compartilhado pelo grupo
    ├── login/page.tsx    → URL: /login (não /(auth)/login)
    ├── cadastrar/page.tsx → URL: /cadastrar (feature flag via query param)
    ├── confirmar/        → URL: /confirmar (provisioning pós-signup)
    │   ├── page.tsx       ← Server Component que roteia por status
    │   ├── page.client.tsx ← Client Component de provisioning
    │   ├── confirm-email.client.tsx ← Client Component de confirmação de e-mail
    │   └── actions.ts     ← Server Action: provisionFreeAccountAction
    └── redefinir/page.tsx → URL: /redefinir
```

Route Groups são uma funcionalidade do Next.js App Router para organizar rotas sem afetar a URL. O `(auth)` agrupa as páginas públicas e aplica o `layout.tsx` apenas para elas.

### Layout compartilhado

```tsx
// app/(auth)/layout.tsx — Server Component
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <AuthPageShell>{children}</AuthPageShell>
}
```

Cada `page.tsx` do grupo recebe o `AuthPageShell` automaticamente como wrapper, sem precisar importá-lo explicitamente.

### `/cadastrar` — Feature flag de cadastro livre

O cadastro livre é controlado pelo query param `?free_signup=true`. Sem ele, a página exibe "Acesso Limitado".

Implementação: [`src/app/(auth)/cadastrar/page.tsx`](../../src/app/(auth)/cadastrar/page.tsx)

O `nextPath` é extraído de `?next=` e validado com `getSafeRedirectPath()`.

### Composição Server + Client

```tsx
// page.tsx — Server Component
import { SignInForm } from "@/forms/SignInForm"  // Client Component

export default function LoginPage() {
  return (
    <AuthFormShell title="Bem-vindo de volta">
      <SignInForm />  {/* ← Client Component dentro de Server Component */}
    </AuthFormShell>
  )
}
```

Server Components podem renderizar Client Components como children. O servidor gera o HTML inicial; no browser, o React "hidrata" o `SignInForm` — conecta event listeners e ativa o estado React.

---

## 15. Camada 10 — Route Handlers de Callback

### 15.1 `/auth/callback` GET — `src/app/auth/callback/route.ts`

Este Route Handler processa dois tipos de tokens:

1. **`code`** — PKCE authorization code (confirmação de e-mail, OAuth)
2. **`token_hash`** + **`type`** — OTP inline (verificação por link)

Implementação: [`src/app/auth/callback/route.ts`](../../src/app/auth/callback/route.ts)

**Verificação de provisioning:** Após autenticação bem-sucedida, o callback verifica se o usuário tem `public.users` com `account_id`. Se não, redireciona para `/confirmar?next=<destino>` para executar a RPC de provisioning. Se `nextPath` já aponta para `/confirmar`, a verificação é pulada pois o provisioning será executado pelo `ConfirmarClient`.

> **Cookies:** Quando o redirect muda, os cookies de sessão (gravados por `exchangeCodeForSession`) são copiados para a nova response via `response.cookies.getAll()`.

### 15.2 `/auth/callback` POST — Consumo de hash tokens

O método POST permite consumir tokens recebidos via hash fragment (que não chegam ao servidor). O `hash-callback` Client Component chama este endpoint:

Recebe `access_token`, `refresh_token` e `next` via JSON. Valida os tokens, chama `supabase.auth.setSession()` para gravar os cookies na response, e retorna `{ redirectTo }` para o client redirecionar.

Implementação: [`src/app/auth/callback/route.ts`](../../src/app/auth/callback/route.ts) (método `POST`)

### 15.3 `/auth/hash-callback` — `src/app/auth/hash-callback/page.tsx`

Client Component que processa tokens no hash fragment da URL (recovery, magic link):

Implementação: [`src/app/auth/hash-callback/page.tsx`](../../src/app/auth/hash-callback/page.tsx)

**Por que `fetch` + POST em vez de usar o SDK?** O hash fragment só existe no browser. Os tokens precisam ser enviados ao servidor para serem armazenados em cookies `httpOnly` (que o JavaScript não pode acessar diretamente). O POST handler chama `setSession()` no servidor, que grava os cookies na response.

---

## 16. Camada 11 — Provisioning de Conta (`/confirmar`)

Após a autenticação (signup ou login), o sistema verifica se o usuário tem dados provisionados em `public.users`. Se não, redireciona para `/confirmar` onde o provisioning é executado automaticamente.

### 16.1 Server Component — `confirmar/page.tsx`

O Server Component roteia entre dois Client Components com base no query param `status`:

Implementação: [`src/app/(auth)/confirmar/page.tsx`](../../src/app/(auth)/confirmar/page.tsx)

| `status` param | Componente | Comportamento |
|----------------|-----------|---------------|
| `confirm-email` | `ConfirmEmailClient` | Exibe tela de "aguardando confirmação de e-mail" com botão de reenvio |
| _(ausente)_ | `ConfirmarClient` | Executa provisioning via RPC e redireciona ao destino |

### 16.2 Client Component de Provisioning — `confirmar/page.client.tsx`

Usa `useReducer` para gerenciar os estados de provisioning, `useCallback` com ref para auto-iniciar (uma vez no mount), e garante tempo mínimo de loading visível (1.5s) antes do redirect.

Implementação: [`src/app/(auth)/confirmar/page.client.tsx`](../../src/app/(auth)/confirmar/page.client.tsx)

**Mapeamento fase → AuthAdvisor:**

| Fase | AuthAdvisorType | Visual |
|------|----------------|--------|
| `idle` / `provisioning` | `configuring-account` | Spinner + "Configurando Conta" |
| `done` | `configured-account` | Spinner + "Configuração Concluída" |
| `error` | `provisioning-error` | Botão "Tentar novamente" (via `onRetry`) |

**Por que `ref` callback em vez de `useEffect`?** O ref callback garante que `runProvision` é chamado apenas uma vez quando o DOM é montado, sem dependências que possam causar re-execuções. O `useCallback` memoiza a referência e o guard `state.phase === "idle"` previne execuções duplicadas.

### 16.3 Client Component de Confirmação de E-mail — `confirmar/confirm-email.client.tsx`

Exibe a tela de "aguardando confirmação de e-mail" com o e-mail lido do `sessionStorage`.

Implementação: [`src/app/(auth)/confirmar/confirm-email.client.tsx`](../../src/app/(auth)/confirmar/confirm-email.client.tsx)

O e-mail é armazenado em `sessionStorage` pelo `SignUpForm` (chave `causi:signup-email`) durante o cadastro. Isso evita expor o e-mail na URL.

### 16.4 Server Action — `confirmar/actions.ts`

Verifica identidade via `getUser()`, checa idempotência, extrai metadados do signup e chama a RPC `complete_user_registration_v2`.

Implementação: [`src/app/(auth)/confirmar/actions.ts`](../../src/app/(auth)/confirmar/actions.ts)

**Idempotência:** A action verifica `publicUser?.account_id` antes de chamar a RPC. Se o usuário já está provisionado (ex: retry após erro transitório), retorna `{ ok: true }` sem efeito colateral.

**RPC `complete_user_registration_v2`:** Cria em uma transação atômica:
- `public.users` — Registro do usuário com `account_id`
- `public.accounts` — Conta/escritório do usuário
- `public.pipelines` — Pipeline Kanban com estágios padrão

---

## 17. Fluxos completos end-to-end

### Fluxo 1: Cadastro com confirmação de e-mail (padrão)

```
1. Usuário acessa /cadastrar?free_signup=true
2. Preenche nome, escritório, e-mail, senha
3. SignUpForm → supabase.auth.signUp() com emailRedirectTo apontando para /auth/callback
4. Supabase cria auth.users e envia e-mail de confirmação
5. SignUpForm armazena e-mail em sessionStorage (chave "causi:signup-email")
6. SignUpForm → router.replace("/confirmar?status=confirm-email&next=/dashboard")
7. /confirmar (Server Component) → renderiza ConfirmEmailClient
8. ConfirmEmailClient → AuthAdvisor type="confirm-email" com botão de reenvio

--- Usuário abre o e-mail e clica no link ---

9. /auth/callback GET recebe ?code=...&next=/confirmar?next=/dashboard
10. exchangeCodeForSession() cria sessão nos cookies
11. Callback verifica public.users → account_id ausente
12. Redirect para /confirmar?next=/dashboard (com cookies copiados)
13. Middleware permite /confirmar (exceção para autenticados)
14. /confirmar (Server Component) → renderiza ConfirmarClient
15. ConfirmarClient auto-executa provisionFreeAccountAction
16. RPC cria public.users, accounts, pipelines
17. Exibe "Configuração Concluída" → redirect para /dashboard
```

### Fluxo 2: Login com provisioning pendente

```
1. Usuário acessa /login
2. Preenche e-mail e senha
3. SignInForm → supabase.auth.signInWithPassword()
4. SignInForm consulta public.users → account_id ausente
5. Redirect para /confirmar?next=/dashboard
6. ConfirmarClient auto-executa provisionFreeAccountAction
7. RPC cria public.users, accounts, pipelines
8. Redirect para /dashboard
```

### Fluxo 3: Login normal (provisioning completo)

```
1. Usuário acessa /login
2. Preenche e-mail e senha
3. SignInForm → supabase.auth.signInWithPassword()
4. SignInForm consulta public.users → account_id existe
5. Redirect para /dashboard (ou nextPath original)
```

### Fluxo 4: Recuperação de senha

```
1. Usuário acessa /redefinir
2. Preenche e-mail → supabase.auth.resetPasswordForEmail()
3. Supabase envia e-mail com link de recovery
4. Usuário clica no link → /auth/hash-callback#access_token=...&refresh_token=...
5. hash-callback extrai tokens do fragment
6. POST /auth/callback → setSession() grava cookies
7. Redirect para /redefinir?mode=update
8. Middleware permite /redefinir?mode=update (exceção para recovery)
9. Usuário define nova senha → supabase.auth.updateUser({ password })
10. Redirect para /dashboard
```

---

## 18. Segurança: O que protege o quê

### Camadas de proteção

| Camada | Mecanismo | O que protege |
|--------|----------|--------------|
| Cookies `httpOnly` | `@supabase/ssr` | Tokens de sessão contra XSS |
| Cookies `Secure` | HTTPS | Tokens contra interceptação em trânsito |
| `SameSite=Lax` | Browser | Requests cross-site contra CSRF |
| `getSafeRedirectPath()` | Validação server-side | Open Redirect (paths relativos, sem `//`, sem protocolos) |
| `buildAuthCallbackUrl()` | Origin confiável | Callback URLs usando `NEXT_PUBLIC_APP_URL` (não `window.location`) |
| `getClaims()` no middleware | Decodificação local do JWT | Decisões de roteamento rápidas, sem latência de rede |
| `getUser()` no callback | Validação via rede Supabase | Confirmação segura de identidade pós-auth |
| RLS (Row Level Security) | Postgres | Isolamento de dados por `account_id` |
| `SERVICE_ROLE_KEY` apenas no servidor | Variáveis sem `NEXT_PUBLIC_` | Bypass de RLS restrito ao backend |
| Provisioning idempotente | `publicUser?.account_id` check | Previne duplicação de accounts |

### Validações de redirect

A função `getSafeRedirectPath()` bloqueia:
- Paths que não começam com `/`
- Double-slash (`//evil.com`)
- Backslash (`\`)
- Quebras de linha (`\r`, `\n`)
- Protocolos embutidos (`/javascript:`, `/data:`)
- URL encoding malicioso (decodifica antes de validar)

### Feature flag de cadastro

O cadastro livre está protegido pelo query param `?free_signup=true`. Sem ele, a página `/cadastrar` exibe "Acesso Limitado". Isso permite lançamento gradual sem expor o signup publicamente.

---

## 19. Perguntas frequentes (FAQ)

### Por que aparecem dois cookies `sb-<project>-auth-token.0` e `sb-<project>-auth-token.1`?

Porque o cookie de sessão pode ultrapassar o limite de tamanho de um único cookie. O `@supabase/ssr` usa "cookie chunking": divide o valor em partes (`.0`, `.1`, ...) e depois combina tudo automaticamente na leitura.

### Por que `getClaims()` no middleware em vez de `getUser()`?

O middleware executa em **todo request HTTP**. `getUser()` faz uma chamada de rede ao Supabase, adicionando latência a cada request. `getClaims()` decodifica o JWT localmente — é instantâneo. Como o JWT é assinado e verificável, é seguro para decisões de roteamento. A validação completa (`getUser()`) é feita nos Server Components e Server Actions que precisam de dados frescos.

### Por que o provisioning não é feito no callback?

O callback é um Route Handler — se a RPC falhar, o usuário vê um redirect em loop ou uma página em branco. Delegando para o `ConfirmarClient`, o erro é tratável com UI (botão "Tentar novamente") e o usuário pode fazer retry sem recarregar a página.

### Por que `sessionStorage` para o e-mail em vez da URL?

Expor o e-mail na URL é um risco de privacidade — ele aparece em logs de servidor, histórico do browser, e pode ser compartilhado acidentalmente. O `sessionStorage` é efêmero (dura apenas a aba) e não é enviado ao servidor.

### Por que dois caminhos no SignUpForm (com e sem sessão)?

Quando a confirmação de e-mail está **desabilitada** no Supabase, `signUp()` retorna uma sessão imediatamente. O usuário é redirecionado para `/confirmar` para provisioning direto. Quando está **habilitada** (padrão), `signUp()` retorna `session: null` e o usuário precisa confirmar o e-mail antes de prosseguir.

### O que acontece se o usuário fechar o browser durante o provisioning?

No próximo login, o `SignInForm` detecta `account_id` ausente e redireciona para `/confirmar`. O `ConfirmarClient` re-executa o provisioning. A RPC `complete_user_registration_v2` é idempotente — se `public.users` já existir, a action retorna `{ ok: true }` sem duplicar dados.

---

## Documentos Relacionados

| Documento | Descrição |
|-----------|-----------|
| [architecture/auth.md](../architecture/auth.md) | Visão geral — auth flow, roles, RLS, multi-account |
| [decisions/adr.md](../decisions/adr.md) | Decisões arquiteturais (Supabase SDK, dois clients) |
| [database/functions.md](../database/functions.md) | Funções de banco para autenticação e provisioning |
| [database/overview.md](../database/overview.md) | Banco de dados do Causi |