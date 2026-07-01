# Plan: Fix contacts-supabase-integration bugs (pages)

## TL;DR
5 bugs nas páginas de listagem `/pessoas` e `/organizacoes` (ordenação padrão, clique na row, formatação de data, limpar filtros e construção de URL de busca).  
As correções devem ser aplicadas de forma simétrica nas duas páginas, sem mudanças de banco.

---

## Fase 1 — Ordenação padrão da listagem (sem dependências)

**1.1** `src/app/(app)/(pessoas)/pessoas/page.tsx`  
- Alterar default de `sort` de `"name"` para `"created_at"`  
- Alterar default de `order` para representar `"desc"`  
- Ajustar fallback de validação de campo de ordenação para `"created_at"`

**1.2** `src/app/(app)/(pessoas)/organizacoes/page.tsx`  
- Aplicar a mesma correção de default e fallback da etapa 1.1

---

## Fase 2 — Edição por clique na row (depende da Fase 1)

**2.1** `src/app/(app)/(pessoas)/pessoas/data-table.tsx`  
- Adicionar `onClick={() => onEdit(row.original)}` no `TableRow` de linhas de dados

**2.2** `src/app/(app)/(pessoas)/organizacoes/data-table.tsx`  
- Adicionar o mesmo `onClick` da etapa 2.1

**2.3** `src/app/(app)/(pessoas)/pessoas/columns.tsx`  
- Adicionar `e.stopPropagation()` no `DropdownMenuTrigger` (botão de ações)  
- Adicionar `e.stopPropagation()` no `DropdownMenuContent` para impedir propagação dos cliques do menu para a row

**2.4** `src/app/(app)/(pessoas)/organizacoes/columns.tsx`  
- Aplicar a mesma proteção de propagação da etapa 2.3

---

## Fase 3 — Formatação da coluna "Criado em" (depende da Fase 1, paralelo com Fase 2)

**3.1** `src/app/(app)/(pessoas)/pessoas/columns.tsx`  
- Substituir retorno de `created_at` cru por formatter local `dd/mm/yyyy hh:mm` (24h) para exibição

**3.2** `src/app/(app)/(pessoas)/organizacoes/columns.tsx`  
- Aplicar o mesmo formatter da etapa 3.1

---

## Fase 4 — Limpar filtros sem perder ordenação (depende da Fase 1)

**4.1** `src/app/(app)/(pessoas)/pessoas/page.client.tsx`  
- Ajustar `onClearFilters` para limpar apenas `search`, `organization_id` e `page`  
- Preservar ordenação atual (`sort` e `order`) via `buildUrl`

**4.2** `src/app/(app)/(pessoas)/organizacoes/page.client.tsx`  
- Ajustar `onClearFilters` para limpar apenas `search` e `page`  
- Preservar ordenação atual (`sort` e `order`) via `buildUrl`

---

## Fase 5 — URL da busca consistente com defaults (depende da Fase 1; recomenda executar junto da Fase 4)

**5.1** `src/app/(app)/(pessoas)/pessoas/page.client.tsx`  
- Reescrever `buildUrl` para:
  - Sempre incluir `sort` e `order` no merge interno antes de aplicar overrides  
  - Omitir `sort` e `order` de forma atômica apenas quando ambos representarem o default (`created_at` + `desc`)  
  - Garantir que busca preserve ordenação atual quando ela não for default

**5.2** `src/app/(app)/(pessoas)/organizacoes/page.client.tsx`  
- Aplicar a mesma lógica de `buildUrl` da etapa 5.1

---

## Arquivos modificados

- `src/app/(app)/(pessoas)/pessoas/page.tsx`
- `src/app/(app)/(pessoas)/organizacoes/page.tsx`
- `src/app/(app)/(pessoas)/pessoas/data-table.tsx`
- `src/app/(app)/(pessoas)/organizacoes/data-table.tsx`
- `src/app/(app)/(pessoas)/pessoas/columns.tsx`
- `src/app/(app)/(pessoas)/organizacoes/columns.tsx`
- `src/app/(app)/(pessoas)/pessoas/page.client.tsx`
- `src/app/(app)/(pessoas)/organizacoes/page.client.tsx`

## Verificação

1. Abrir `/pessoas` e `/organizacoes` sem query string e validar ordenação padrão por `created_at desc`
2. Clicar em uma row e validar abertura do form de edição
3. Abrir menu de ações e validar que:
   - `Editar` abre edição corretamente
   - abrir/clicar no menu não dispara clique de row indevido
4. Validar coluna `Criado em` no formato `dd/mm/yyyy hh:mm` (24h)
5. Em empty state, acionar "Limpar filtros" e validar que somente filtros são limpos (sort/order preservados)
6. Executar busca com e sem ordenação customizada e validar URL:
   - default: `/pessoas?search=termo` (sem `sort`/`order`)
   - custom: `/pessoas?sort=name&order=asc&search=termo`
