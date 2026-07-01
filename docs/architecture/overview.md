---
title: Arquitetura — Visao Geral
description: Stack tecnológica, decisões de acesso a dados, Realtime, estrutura de pastas e padrões Next.js
---

# Arquitetura — Visão Geral

O Causi é um SaaS vertical para advogados, multi-tenant com isolamento por `account_id`, construído com Next.js 16+ e Supabase.

---

## Stack Tecnológica

| Camada | Tecnologia |
|--------|-----------|
| **Frontend** | Next.js 16 (App Router, React Server Components), React 19, Tailwind CSS 4, Shadcn UI |
| **Backend / BFF** | Next.js Route Handlers, Server Actions, Supabase SDK |
| **Banco de Dados** | Supabase Postgres (schemas: `public`, `billing`, `classroom`) |
| **Autenticação** | Supabase Auth (email/senha, convite) |
| **Realtime** | Supabase Realtime (Postgres Changes) |
| **Serverless** | Supabase Edge Functions (Deno) |
| **Storage** | Supabase Storage |
| **Integrações** | Evolution API, UAZAPI, WAHA, WhatsApp Cloud API |
| **Qualidade de Código** | Biome (lint + format), Husky (pre-commit + pre-push), Zod, TypeScript 5 |
| **Hospedagem** | Vercel (frontend) + Supabase Cloud |
| **Gerenciador de Pacotes** | pnpm |

---

## Decisão: Supabase SDK (exclusivo)

O projeto usa **exclusivamente o Supabase SDK** (`@supabase/supabase-js` + `@supabase/ssr`). Prisma, Drizzle ou outros ORMs **não são permitidos**.

**Justificativa:**
- O SDK respeita RLS nativamente — ORMs bypassam RLS, risco crítico em multi-tenant
- SDK integra Auth, Realtime e Storage na mesma API
- Migrations via Supabase CLI cobrem o gap de versionamento

### Dois Clients Obrigatórios

| Contexto | Client | Chave |
|----------|--------|-------|
| Client Components | `createBrowserClient` via `@supabase/ssr` | `anon` (pública) |
| Server Components / Actions | `createServerClient` via `@supabase/ssr` | `anon` + cookies |
| Tarefas Super Admin | `createBrowserClient` via `@supabase/ssr` | `anon` (pública) |

> **Nota**: `SERVICE_ROLE_KEY` é utilizado principalmente por Edge Functions para processar webhooks de integrações externas. Super Admins possuem políticas RLS `Full access` que permitem acesso cross-account sem necessidade de bypass RLS.

Arquivos:
- `lib/supabase/client.ts` — Client Components
- `lib/supabase/server.ts` — Server Components / Server Actions
- `proxy.ts` — Mantém sessão viva e protege rotas

> A `ANON_KEY` é segura para expor com RLS habilitado. A `SERVICE_ROLE_KEY` **nunca** deve ser exposta no client — ela bypassa RLS.

---

## Decisão: React Query e Zustand

**Status:** Não adotados. Adicionar apenas quando a dor concreta justificar.

- **React Query**: Com App Router e Server Components, data fetching é resolvido nativamente. Revalidação via `revalidatePath` / `revalidateTag`.
- **Zustand**: Dados de sessão (user, account, plan) não mudam durante a sessão. React Context nativo é suficiente.

### Contexto de Sessão

O `SessionProvider` injeta dados do usuário, conta e role no contexto React:

```tsx
// lib/context/session-context.tsx
'use client'
import { createContext, useContext } from 'react'

const SessionContext = createContext(null)

export function SessionProvider({ user, account, children }) {
  return (
    <SessionContext.Provider value={{ user, account }}>
      {children}
    </SessionContext.Provider>
  )
}

export function useSession() {
  return useContext(SessionContext)
}
```

---

## Realtime e Sincronização

Supabase Realtime via **Postgres Changes** para novas mensagens e atualizações de deals.

**Mensagens de uma conversa** — filtrar por `conversation_id`:
```tsx
supabase
  .channel(`messages:${conversationId}`)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'messages',
    filter: `conversation_id=eq.${conversationId}`
  }, handler)
  .subscribe()
```

**Lista de conversas** — filtrar por `account_id` na tabela `conversations` (trigger atualiza `last_message_at` a cada nova mensagem):
```tsx
supabase
  .channel(`conversations:${accountId}`)
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'conversations',
    filter: `account_id=eq.${accountId}`
  }, handler)
  .subscribe()
```

> **Nota**: A tabela `messages` não possui coluna `account_id` — o isolamento é feito via `conversation_id` (FK para `conversations.account_id`).

**Kanban**: Optimistic updates via `useOptimistic`. Se falhar, reverte ao estado do servidor. Posição usa campo `order` fracionário.

**Conversas**: Realtime para novas mensagens — auto-scroll e atualização da lista.

---

## Rotas da Aplicação (App Router)

A raiz `/` redireciona para o Dashboard. Rotas de autenticação são as únicas públicas (`/login`, `/cadastrar`, `/confirmar`, `/redefinir`). O route group `(auth)` agrupa essas rotas sem adicionar prefixo na URL.

```bash
app/
├─ (auth)/                                # Rotas públicas (sem sessão)
│  ├─ confirmar/                           # /confirmar (provisioning pós-signup)
│  │  ├─ page.tsx
│  │  ├─ page.client.tsx
│  │  ├─ confirm-email.client.tsx
│  │  └─ actions.ts
│  ├─ cadastrar/page.tsx                   # /cadastrar
│  ├─ login/page.tsx                       # /login
│  ├─ redefinir/page.tsx                   # /redefinir
│  └─ layout.tsx
│
├─ (app)/                                 # Rotas privadas (sessão obrigatória)
│  ├─ (configuracoes)/
│  │  ├─ assinatura/page.tsx               # /assinatura
│  │  ├─ escritorio/page.tsx               # /escritorio
│  │  ├─ perfil/page.tsx                   # /perfil
│  │  ├─ seguranca/page.tsx                # /seguranca
│  │  ├─ usuarios/page.tsx                 # /usuarios
│  │  └─ layout.tsx
│  ├─ (oportunidades)/
│  │  ├─ oportunidades/
│  │  │  ├─ page.tsx                       # /oportunidades
│  │  │  └─ [pipelineId]/page.tsx          # /oportunidades/[pipelineId]
│  │  ├─ etiquetas/page.tsx                # /etiquetas
│  │  └─ funis/page.tsx                    # /funis
│  ├─ (pessoas)/
│  │  ├─ organizacoes/page.tsx             # /organizacoes
│  │  └─ pessoas/page.tsx                  # /pessoas
│  ├─ agentes/
│  │  ├─ page.tsx                          # /agentes
│  │  └─ [agentId]/page.tsx                # /agentes/[agentId]
│  ├─ canais/page.tsx                      # /canais
│  ├─ conversas/
│  │  ├─ page.tsx                          # /conversas
│  │  └─ [conversationId]/page.tsx         # /conversas/[conversationId]
│  ├─ dashboard/page.tsx                   # /dashboard
│  ├─ onboarding/page.tsx                  # /onboarding
│  ├─ tarefas/page.tsx                     # /tarefas
│  └─ layout.tsx                           # Valida sessão, SessionProvider, sidebar
│
├─ (classroom)/                           # Rotas de educação (LMS)
│  ├─ page.tsx (opcional)                 # /classroom ou apenas dentro de (app)
│  ├─ cursos/
│  │  ├─ page.tsx                          # /cursos
│  │  └─ [courseId]/aulas/[lessonId]/page.tsx # /cursos/[courseId]/aulas/[lessonId]
│  └─ layout.tsx                           # Layout específico para educação
│
├─ (admin)/                               # Rotas de super admin
│  ├─ admin-contas/
│  │  ├─ page.tsx                          # /admin-contas
│  │  └─ [accountId]/page.tsx              # /admin-contas/[accountId]
│  ├─ admin-cursos/
│  │  ├─ page.tsx                          # /admin-cursos
│  │  └─ [courseId]/modulos/[moduleId]/aulas/page.tsx
│  └─ layout.tsx
│
├─ auth/                                  # Route handlers internos (não route group)
│  ├─ callback/route.ts                    # /auth/callback
│  └─ hash-callback/page.tsx               # /auth/hash-callback
│
├─ globals.css                            # Design tokens e variáveis CSS globais
├─ layout.tsx                             # Layout raiz da aplicação
├─ not-found.tsx                          # Página 404
└─ page.tsx                               # Página raiz (/)
```

---

## Estrutura de Pastas (`src/`)

### Resumo

| Pasta / Arquivo | Descrição |
|----------------|----------|
| `proxy.ts` | Middleware — proteção de rotas, renovacao de sessão |
| `provider.tsx` | Context Providers da aplicação (SessionProvider, etc.) |
| `app/` | Rotas, layouts, globals.css |
| `components/` | Componentes React reutilizáveis organizados por domínio |
| `forms/` | Formulários estruturados (padrão PascalCase com schema + tipos) |
| `hooks/` | Hooks React customizados |
| `lib/` | Clientes Supabase, helpers, constantes, validação de env |

### Árvore detalhada

```bash
src/
├── app/
│   ├── (admin)/                 # Rotas de super admin
│   ├── (app)/                   # Rotas privadas
│   ├── (auth)/                  # Rotas públicas de auth
│   ├── (classroom)/             # Rotas de educação (LMS)
│   ├── auth/                    # Route handlers de callback
│   ├── globals.css              # Design tokens e variáveis CSS globais
│   ├── layout.tsx               # Layout raiz da aplicação
│   ├── not-found.tsx            # Página 404
│   └── page.tsx                 # Página raiz (/)
├── components/
│   ├── ui/                      # Componentes primitivos shadcn (NÃO EDITAR VIA CLI)
│   ├── atoms/                   # Componentes genéricos reutilizáveis (sem domínio)
│   ├── auth/                    # Componentes das páginas de auth
│   ├── accounts/                # Componentes de conta / escritório
│   ├── agents/                  # Componentes de agentes de IA
│   ├── channels/                # Componentes de canais
│   ├── chat/                    # Mensagens, áudio, câmera
│   ├── classroom/               # Componentes de cursos
│   ├── conversations/           # Lista e interface de conversas
│   ├── deals/                   # Componentes de deals / oportunidades
│   ├── editor/                  # Editor de texto rico
│   ├── icons/                   # Ícones customizados SVG
│   └── tasks/                   # Componentes de tarefas
├── forms/                       # Formulários estruturados (PascalCase)
│   ├── SignInForm/
│   ├── CreateAccountForm/
│   ├── ProfileForm/
│   └── ... (+ 20 other forms)
├── hooks/
│   ├── use-auth-email-resend.ts # Cooldown de reenvio de e-mail de auth
│   └── use-breakpoints.ts       # Breakpoints responsivos
└── lib/
    ├── auth/                    # Helpers, Server Actions e toast de auth
    ├── constants/               # Constantes da aplicação
    ├── supabase/                # Clientes Supabase (browser, server, proxy)
    ├── env.ts                  # Validação de variáveis de ambiente (Zod)
    ├── search-params.ts        # Parsing de query params
    └── utils.ts                # Utilitários gerais (cn, etc.)├── provider.tsx                 # Context Providers
└── proxy.ts                     # Middleware — proteção de rotas, renovacao de sessão```

---

## Padrões de Uso no Next.js

### Server Component — busca dados direto

```tsx
import { createClient } from '@/lib/supabase/server'

export default async function KanbanPage() {
  const supabase = await createClient()
  const { data: deals } = await supabase
    .from('deals')
    .select('*')
    .order('created_at', { ascending: false })

  return <KanbanBoard deals={deals} />
}
```

### Server Action — mutation sem API route

```tsx
'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function moveDeal(id: string, stageId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('deals')
    .update({ pipeline_stage_id: stageId })
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/oportunidades')
}
```

### Proteção de Rotas

Use `proxy.ts` ou `layout.tsx` do grupo `(app)` para validar sessão. Server Components usam `createServerClient`; Client Components usam `useSession()`.

---

## Variáveis de Ambiente

```env
# Supabase (obrigatórias)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=
SUPABASE_SERVICE_ROLE_KEY=       # NUNCA expor no client
```

---

## Documentos Relacionados

| Documento | Descrição |
|-----------|-----------|
| [auth.md](./auth.md) | Autenticação, roles, RLS, convites |
| [integrations.md](./integrations.md) | Provedores de WhatsApp e webhooks |
| [database/overview.md](../database/overview.md) | Schema, CLI, convenções |
| [edge-functions/overview.md](../edge-functions/overview.md) | Edge Functions index |
