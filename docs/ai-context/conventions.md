---
title: Convenções de Código (AI Context)
description: Regras obrigatórias de nomenclatura, estrutura, padrões e práticas que a IA deve seguir
---

# Convenções de Código

Regras obrigatórias para desenvolvimento no projeto Causi. Estas convenções devem ser seguidas por todos os desenvolvedores e agentes de IA.

---

## Idioma

- **Código** (arquivos, variáveis, funções, componentes): **INGLÊS**
- **Documentação** (docs, comentários JSDoc): **PT-BR**
- **Rotas e URLs**: **PT-BR** (ex: `/oportunidades`, `/pessoas`, `/conversas`)
- **Parâmetros de URLs**: **INGLÊS** (ex: `/oportunidades/[pipelineId]`, `/pessoas?search=John&page=2&sort=created_at&order=asc`)

---

## Nomenclatura de Arquivos

| Tipo | Convenção | Exemplo |
|------|-----------|---------|
| Arquivos simples | `kebab-case.tsx` | `app-sidebar.tsx` |
| Pastas de componentes estruturados | `PascalCase/` | `PipelineEditForm/` |
| Rotas/páginas | `kebab-case/` | `oportunidades/` |
| Parâmetros dinâmicos de rota | `camelCase` | `[pipelineId]`, `[conversationId]`, `[agentId]`, `[accountId]`, `[courseId]`, `[moduleId]`, `[lessonId]` |
| Tipos | `component-name.types.ts` | `deal-card.types.ts` |
| Schemas Zod | `schema.ts` | — |
| Services/Actions | `resource.actions.ts` | `deals.actions.ts` |

> **Parâmetros dinâmicos**: Nome da entidade em inglês + coluna em camelCase (ex: `[pipelineId]`, `[conversationId]`, `[agentId]`). Permite acesso direto via `params.conversationId` sem bracket notation.

---

## Estrutura de Componentes

### Componente simples

Arquivo único `.tsx` em `kebab-case`.

### Componente estruturado (formulários ou complexos)

```
ComponentName/
├── component-name.tsx          # Implementação
├── component-name.types.ts     # Tipos e interfaces
├── schema.ts                   # Schema Zod (obrigatório para formulários)
└── index.ts                    # Re-export
```

### Organização

Componentes organizados por **escopo de página** em `src/app/components/[resource-name]` (nome em inglês).

---

## Padrões Next.js

### Data Fetching

- **Server Components**: `createServerClient` para buscar dados
- **Server Actions**: Para mutations (criar, atualizar, deletar)
- **Client Components**: Apenas quando necessário (state, interatividade, eventos)
- **Revalidação**: `revalidatePath()` ou `revalidateTag()` após mutations

### Supabase

- **Client Components**: `createBrowserClient` via `@supabase/ssr`
- **Server Components/Actions**: `createServerClient` via `@supabase/ssr`
- **Super Admin (full access RLS)**: `createBrowserClient` via `@supabase/ssr` (sem `service_role`)
- **Nunca**: Expor `SERVICE_ROLE_KEY` no client
- **Sempre**: Incluir `account_id` em queries (obrigatório para multi-account)

### Proteção de Rotas

- `proxy.ts` ou `layout.tsx` do grupo `(app)` valida sessão
- Rotas públicas apenas em `(auth)/`
- A raiz `/` é o Dashboard (protegida)

---

## Banco de Dados

### Alterações de Schema

- **Exclusivamente** via Supabase CLI (utilizar `supabase db diff -f <nome_do_arquivo>` após alterar o schema)
- **Nunca** via SQL Editor em produção
- **Nunca** executar comandos de banco autonomamente — sempre pedir revisão manual

### Tipos TypeScript e `database.types.ts`

O arquivo `src/lib/database.types.ts` é regenerado pelo Supabase CLI (`supabase gen types typescript`) e serve **apenas como referência** para consultar nomes de colunas, views e enums do schema.

**Regras:**

- **Nunca** importar tipos gerados em código da aplicação (`Database`, `Tables<>`, `TablesInsert<>`, `TablesUpdate<>`, `Enums<>`, etc.).
- **Nunca** tipar o client Supabase com `createClient<Database>()` — o client do projeto permanece sem generic de schema.
- Motivo: tipos gerados não cobrem 100% do contrato real (views com JSON aninhado, RPCs, joins implícitos); usar `Tables<"deals_summary">` ou equivalente pode compilar e ainda divergir do runtime.
- Para cada fonte de dados, definir tipos explícitos em `types.ts` da rota ou `*.types.ts` do componente/form, alinhados ao **shape que a feature consome** (ex.: linha de `persons_summary`, retorno de `get_deals_by_stage`).
- Ao alinhar campos, comparar com `docs/database/`, a view/RPC no banco e `database.types.ts` **somente como checklist** — não como tipo de domínio.
- Após fetch com o SDK: cast explícito para o tipo de domínio, no padrão de `/pessoas`:

```typescript
const deals: DealRow[] = (data ?? []) as unknown as DealRow[];
```

- Formulários e inputs de UI: tipos via `z.infer<typeof schema>` (ver seção Formulários abaixo), não via tipos gerados do Supabase.

### Convenções de Schema

- IDs: `bigint GENERATED ALWAYS AS IDENTITY` (exceto `users` = uuid)
- Timestamps: `created_at`, `updated_at` com default `now()`
- Foreign keys: `<tabela>_<coluna>_fkey`
- Isolamento: `account_id` em tabelas operacionais
- Sem soft deletes global; `is_active` onde necessário
- Seeds: idempotentes (`INSERT ... ON CONFLICT DO UPDATE`), apenas tabelas de configuração

---

## Props de Componentes

Prefixos padronizados para callbacks:

| Prefixo | Uso |
|---------|-----|
| `onSave` | Após salvamento |
| `onEdit` | Ao solicitar edição |
| `onClose` | Ao fechar modal/drawer |
| `onAbort` | Ao cancelar ação |
| `onDelete` | Ao confirmar exclusão |

Lógica de estado (`useState`, `nuqs`) fica no nível da página/pai.

---

## Estado de URL (NUQS)

Biblioteca `nuqs` para estados persistidos na URL:
- Abertura de modais/drawers (`deal=[ID]`)
- Filtros de listagem
- Seleção de abas/visualizações

```tsx
import { useQueryState } from 'nuqs'

export function MyComponent() {
  const [itemId, setItemId] = useQueryState('item')

  return (
    <button onClick={() => setItemId('123')}>
      Abrir Item 123
    </button>
  )
}
```

---

## Formulários

Todos os formulários seguem o padrão de 3 etapas: schema → tipos → componente.

### Estrutura obrigatória

```
FormName/
├── schema.ts              # Regras de validação Zod
├── form-name.types.ts    # Tipos inferidos do schema
├── form-name.tsx          # Componente Client Component
└── index.ts              # Barrel export
```

### Passo a passo

**1. Schema (`schema.ts`)** — defina as regras com Zod:

```typescript
import { z } from "zod"

export const taskSchema = z.object({
  title: z.string().min(3, "Título muito curto"),
  description: z.string().optional(),
})
```

**2. Tipos (`form-name.types.ts`)** — infira do schema (zero duplicação):

```typescript
import { z } from "zod"
import { taskSchema } from "./schema"

export type TaskFormValues = z.infer<typeof taskSchema>
```

**3. Componente (`form-name.tsx`)** — use `react-hook-form` com `zodResolver`:

```typescript
"use client"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { taskSchema } from "./schema"
import type { TaskFormValues } from "./form-name.types"

export function TaskForm() {
  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
  })
  // ...
}
```

**Por que `react-hook-form` + Zod?** O `react-hook-form` gerencia estado dos campos sem re-renders excessivos. O `zodResolver` integra validação Zod diretamente — erros chegam no formato correto para os componentes `Form` do shadcn. Zod infere os tipos TypeScript automaticamente, eliminando duplicação entre schema e tipos.

> Formulários vivem em `src/forms/`. Use componentes do `src/components/ui/` (Input, Form, Label) na implementação.

---

## JSDoc

Todo arquivo não-trivial deve ter JSDoc. O objetivo é permitir que um dev entenda o arquivo sem precisar ler o código.

```tsx
/**
 * Descrição curta e direta do que o arquivo/componente/função faz.
 *
 * @remarks
 * Contexto não-óbvio quando necessário: restrições de SSR, mapeamentos para o banco,
 * dependências implícitas, comportamentos que não aparecem nos tipos.
 *
 * @param name - Descrição (apenas quando os tipos TypeScript não bastam).
 * @returns O que retorna (para funções utilitárias com retorno não-óbvio).
 */
```

| Elemento | Quando usar |
|---|---|
| Descrição | Sempre. 1-2 linhas. O QUE o arquivo faz. |
| `@remarks` | Só quando há algo genuinamente não-óbvio que não está nos tipos. |
| `@param` / `@returns` | Apenas em funções utilitárias com retorno não-óbvio. |
| Omitir o JSDoc | Schemas Zod, arquivos de tipos puros, wrappers UI simples, ícones. |

A documentação de comportamento vive no JSDoc + TypeScript types, **não** em markdowns separados.

---

## UI e Design

- Usar componentes **Shadcn UI** (variáveis semânticas do design system)
- Evitar classes Tailwind genéricas (`bg-gray-50`) — preferir tokens (`bg-muted/40`)
- Usar função `cn()` para mesclar classes Tailwind de forma segura
- Ao customizar componentes shadcn, preservar estrutura Radix UI — usar variantes via CVA
- Antes de instalar componente shadcn, verificar se já existe em `src/components/ui/`
- Comando de instalação: `pnpm dlx shadcn@latest add [component-name]`

> Guia completo do Shadcn em [guides/shadcn.md](../guides/shadcn.md). Design system em [design/DESIGN.md](../design/DESIGN.md).

---

## Erros e Limites

- Erros de RLS esperados (código `22P02`): suprimir `console.error`, exibir toast
- Limites de plano: toast com mensagem padronizada + CTA de upgrade
- Features fora do plano: visíveis mas bloqueadas (nunca ocultas)

---

## Git e Commits

- Commits semânticos: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`
- Branch a partir de `develop`: `feat/nome`, `fix/nome`, `chore/nome`
- Merge em `develop` via `git merge --no-ff`
- Merge `develop → main` via Pull Request no GitHub
- Gerenciador de pacotes: `pnpm` (obrigatório)
- **`pre-commit`** (Husky): `biome check --write --staged` — lint + format nos arquivos staged
- **`pre-push`** (Husky): `pnpm typecheck && pnpm build` — type-check + build completo

> Detalhes em [guides/git-workflow.md](../guides/git-workflow.md).

---

## Referências

| Documento | Conteúdo |
|-----------|----------|
| [architecture/overview.md](../architecture/overview.md) | Stack, Realtime, estrutura de pastas |
| [database/overview.md](../database/overview.md) | CLI workflow, schemas declarativos, ambientes |
| [design/DESIGN.md](../design/DESIGN.md) | Design system e UX |
| [guides/shadcn.md](../guides/shadcn.md) | Guia completo Shadcn/UI |
| [guides/nextjs.md](../guides/nextjs.md) | Guia completo Next.js App Router |
