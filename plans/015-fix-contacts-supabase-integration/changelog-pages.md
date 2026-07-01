# Changelog — Fix contacts-supabase-integration (pages)

Correções aplicadas nas páginas `/pessoas` e `/organizacoes` após a implementação inicial.
Todos os bugs foram corrigidos simetricamente nas duas páginas.

---

## Bug 1 — Ordenação padrão incorreta

**Arquivos:** `pessoas/page.tsx`, `organizacoes/page.tsx`

A ordenação padrão era `name ASC`. Corrigida para `created_at DESC`.

- `params.sort ?? "name"` → `params.sort ?? "created_at"`
- Lógica de `sortOrder`: `params.order === "desc" ? false : true` → `params.order === "asc" ? true : false`
- Fallback do `validSortFields.includes(...)`: `"name"` → `"created_at"`

---

## Bug 2 — Row click não abria o form de edição

**Arquivos:** `pessoas/data-table.tsx`, `organizacoes/data-table.tsx`, `pessoas/columns.tsx`, `organizacoes/columns.tsx`

Clicar na row não abria o form de edição. O form só abria via menu de ações > Editar.

- Adicionado `onClick={() => onEdit(row.original)}` no `TableRow` de dados em ambos os `data-table.tsx`
- Adicionado `onClick={(e) => e.stopPropagation()}` no `Button` do `DropdownMenuTrigger` para evitar que abrir o menu propagasse para a row
- Adicionado `onClick={(e) => e.stopPropagation()}` no `DropdownMenuContent` para evitar que qualquer item do menu (incluindo "Excluir") propagasse para a row e abrisse o form de edição junto

---

## Bug 3 — Coluna "Criado em" exibia valor bruto do banco

**Arquivos:** `pessoas/columns.tsx`, `organizacoes/columns.tsx`

A célula retornava o valor ISO cru (`"2026-04-30T17:41:41.453524+00:00"`).

Substituído por formatter local:

```typescript
cell: ({ row }) => {
  const d = new Date(row.original.created_at);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
},
```

Formato resultante: `"30/04/2026 17:41"` (hora local do browser).

---

## Bug 4 — Botão "Limpar Filtros" resetava sort e order

**Arquivos:** `pessoas/page.client.tsx`, `organizacoes/page.client.tsx`

`onClearFilters` estava com `router.push("/pessoas")` hardcoded, descartando sort e order ativos.

Corrigido para usar `buildUrl` preservando a ordenação atual:

```typescript
// pessoas
onClearFilters={() => router.push(buildUrl({ search: null, organization_id: null, page: null }))}

// organizacoes
onClearFilters={() => router.push(buildUrl({ search: null, page: null }))}
```

---

## Bug 5 — Busca adicionava/removia sort e order de forma inconsistente

**Arquivos:** `pessoas/page.client.tsx`, `organizacoes/page.client.tsx`

A função `buildUrl` omitia `sort` quando igual a `"name"` e `order` quando igual a `"asc"` — de forma independente. Isso causava URLs inconsistentes (ex: `sort` dropava mas `order` permanecia) e não respeitava o novo default `created_at DESC`.

Reescrita da função `buildUrl` com nova lógica:
- `sort` e `order` sempre entram no merge com os valores atuais
- São omitidos atomicamente (ambos) apenas quando representam o default (`created_at` + `desc`)
- Overrides aplicados sobre o merge base antes da verificação de defaults

```typescript
function buildUrl(overrides: Record<string, string | null>) {
  const params = new URLSearchParams();
  const merged: Record<string, string | null> = {
    search: currentSearch || null,
    organization_id: ...,
    page: ...,
    sort: currentSort,
    order: currentOrder,
    ...overrides,
  };
  if (merged.sort === "created_at" && merged.order === "desc") {
    merged.sort = null;
    merged.order = null;
  }
  // ...
}
```