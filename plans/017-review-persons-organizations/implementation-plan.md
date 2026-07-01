# Plan: Fix /pessoas loading state & replicate to /organizacoes

## TL;DR
Corrigir 7 bugs e 3 melhorias em /pessoas, depois replicar em /organizacoes. Nucleo: conectar useTransition ao isLoading da tabela e Badge; sanitizar search e page vindos de searchParams; adicionar account_id ao combobox de organizacoes; trocar a de Link em columns.

---

## 1. Diagnostico

### CORRECOES

C1 - page.client.tsx (ambas) - isLoading={false} hardcoded
- PersonDataTable isLoading={false} - skeleton existe mas nunca exibido.
- Fix: const [isPending, startNavTransition] = useTransition(), envolver router.push em startNavTransition, passar isPending como isLoading.

C2 - page.client.tsx (ambas) - Badge sem skeleton durante navegacao
- Badge mostra valor antigo durante transicao.
- Fix: isPending ? Skeleton : totalCount.

C3 - organizacoes/page.client.tsx - typo nos setters
- setisOrganizationFormLoading e setisOrganizationFormPending usam i minusculo.
- Fix: setIsOrganizationFormLoading / setIsOrganizationFormPending.

C4 - page.tsx (ambas) - page param sem guard contra NaN
- Number("abc") = NaN; Math.max(0, NaN) = NaN; .range(NaN, NaN) falha silenciosamente.
- Fix: Number.isFinite check.

C5 - page.tsx (ambas) - search raw no PostgREST .or()
- Virgulas/parenteses no valor quebram sintaxe do .or() do PostgREST.
- Fix: escapar/remover caracteres especiais antes de interpolar.

C6 - PersonForm/person-form.tsx - combobox de organizacoes sem account_id
- Query client-side sem .eq("account_id", session.account.id). Viola padrao multi-tenant.
- Fix: adicionar filtro usando session do useSessionContext.

C7 - organizacoes/columns.tsx - a href em vez de Link
- Linha 137: <a href="/pessoas?organization_id=..."> causa hard reload.
- Fix: trocar por Link do next/link.

### MELHORIAS

M1 - page.client.tsx (ambas) - Forms importados estaticamente
- PersonForm (750+ linhas) e OrganizationForm no bundle inicial; so usados quando dialog abre.
- Fix: next/dynamic com ssr: false.

M2 - page.tsx (ambas) - Erros Supabase silenciados
- error ? [] : data retorna vazio sem sinalizar falha.
- Fix: if (error) throw error para error boundary do Next.js.

M3 - PersonForm/person-form.tsx - sem unmount guard no carregamento de edicao
- useEffect de edicao nao tem cleanup; callback pode aplicar estado em componente desmontado.
- Fix: let cancelled = false + cleanup () => { cancelled = true }.

M4 - page.tsx (ambas) - queries Supabase sequenciais
- totalUnfiltered awaited antes da query principal: dois round-trips seriais ao banco.
- Fix: Promise.all([countQuery, mainQuery]) para paralelizar.

---

## 2. Plano de Acao

Fase 1 - Loading State (C1, C2, C3)
Passo 1 - pessoas/page.client.tsx: adicionar isPending via useTransition, envolver router.push, isLoading={isPending}, Badge com skeleton condicional.
Passo 2 - organizacoes/page.client.tsx: mesmas mudancas + corrigir typo dos setters.

Fase 2 - Parsing Defensivo (C4, C5) - paralela com Fase 1
Passo 3 - pessoas/page.tsx: guard NaN em page, sanitizar search.
Passo 4 - organizacoes/page.tsx: mesmas correcoes.

Fase 3 - Multi-tenant e Navegacao (C6, C7) - paralela com Fases 1-2
Passo 5 - PersonForm/person-form.tsx: adicionar .eq("account_id") ao combobox.
Passo 6 - organizacoes/columns.tsx: trocar a por Link.

Fase 4 - Melhorias (M1, M2, M3, M4) - apos Fases 1-3
Passo 7 - ambos page.client.tsx: dynamic import dos forms.
Passo 8 - ambos page.tsx: throw error + Promise.all para paralelizar countQuery e mainQuery.
Passo 9 - PersonForm: unmount guard.

---

## Arquivos afetados

- src/app/(app)/(pessoas)/pessoas/page.client.tsx: C1, C2, M1
- src/app/(app)/(pessoas)/pessoas/page.tsx: C4, C5, M2, M4
- src/app/(app)/(pessoas)/organizacoes/page.client.tsx: C1, C2, C3, M1
- src/app/(app)/(pessoas)/organizacoes/page.tsx: C4, C5, M2, M4
- src/app/(app)/(pessoas)/organizacoes/columns.tsx: C7
- src/forms/PersonForm/person-form.tsx: C6, M3

data-table.tsx e actions.ts nao precisam de mudanca.

---

## Decisoes

- isPending separado de isPendingDelete: misturar causaria falsos positivos de loading.
- ssr: false no dynamic import: PersonForm usa useEffect, useFieldArray e file input.
- Optimistic delete rollback NAO e bug: useOptimistic reverte para data quando startTransition completa. Rows reaparecem. Closure do retry captura personsToDelete original corretamente.
- Paralelizar queries (Promise.all): incluido no Passo 8 junto com throw error.
- Escopo excluido: loading.tsx para (pessoas), helper compartilhado de navegacao, refactor de actions.
