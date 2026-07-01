## 1. Types & Shared Contracts

- [x] 1.1 Criar tipo `PersonRow` (para listagem via `persons_summary`) e `PersonDetails` (para edição com phones, emails, socials, organization) em `pessoas/columns.tsx` ou arquivo de tipos dedicado
- [x] 1.2 Criar tipo `OrganizationRow` (para listagem via `organizations_summary`) e `OrganizationDetails` (para edição) em `organizacoes/columns.tsx` ou arquivo de tipos dedicado
- [x] 1.3 Atualizar `PersonFormProps` em `src/forms/PersonForm/person-form.types.ts`: adicionar `onSubmitAction`, atualizar `defaultValues` para aceitar `PersonDetails` parcial
- [x] 1.4 Atualizar `OrganizationFormProps` em `src/forms/OrganizationForm/organization-form.types.ts`: adicionar `onSubmitAction`, atualizar `defaultValues` para aceitar `OrganizationDetails` parcial
- [x] 1.5 Criar tipo de retorno compartilhado `ActionResult<T>` (ou reutilizar padrão já existente no projeto) para uniformizar respostas das Server Actions

## 2. Server Actions — Pessoas

- [x] 2.1 Criar `src/app/(app)/(pessoas)/pessoas/actions.ts` com `"use server"`
- [x] 2.2 Implementar `getPersonDetailsAction(id)`: select de `persons` com joins em `person_phones`, `person_emails`, `person_socials`, `organizations`; filtrar por `id` e `account_id` da sessão; retornar `PersonDetails | null`
- [x] 2.3 Implementar `createPersonAction(formData)`: validar sessão + permissão `persons.create` + `serverIsWithinLimit(session, 'persons')`; fazer upload de foto se presente (`buildPersonMediaPath`, `uploadMediaObject`, `resolveMediaPublicUrl`); chamar RPC `create_person` com `p_photo` já resolvida; `revalidatePath('/pessoas')`
- [x] 2.4 Implementar `updatePersonAction(formData)`: validar sessão + permissão `persons.update`; fazer upload de nova foto se presente + `cleanupMediaObject` da foto antiga (best-effort); chamar RPC `update_person`; `revalidatePath('/pessoas')`
- [x] 2.5 Implementar `deletePersonsAction(ids[])`: validar sessão + permissão `persons.delete`; guard contra array vazio; `supabase.from('persons').delete().in('id', ids).eq('account_id', accountId)`; `revalidatePath('/pessoas')`

## 3. Server Actions — Organizações

- [x] 3.1 Criar `src/app/(app)/(pessoas)/organizacoes/actions.ts` com `"use server"`
- [x] 3.2 Implementar `getOrganizationDetailsAction(id)`: select de `organizations` filtrando por `id` e `account_id`; retornar `OrganizationDetails | null`
- [x] 3.3 Implementar `createOrganizationAction(formData)`: validar sessão + permissão `organizations.create`; insert em `organizations` com `account_id` da sessão; `revalidatePath('/organizacoes')`
- [x] 3.4 Implementar `updateOrganizationAction(formData)`: validar sessão + permissão `organizations.update`; update em `organizations` filtrando por `id` e `account_id`; `revalidatePath('/organizacoes')`
- [x] 3.5 Implementar `deleteOrganizationsAction(ids[])`: validar sessão + permissão `organizations.delete`; guard contra array vazio; `supabase.from('organizations').delete().in('id', ids).eq('account_id', accountId)`; `revalidatePath('/organizacoes')`

## 4. PersonForm

- [x] 4.1 Remover mock de organizações do `person-form.tsx`; buscar organizações via `EntityCombobox` com `onSearchChange` que faz fetch async no banco (browser client, filtrado por `account_id`)
- [x] 4.2 Adicionar campo `photo` como `File | null` no schema Zod; substituir lógica de preview local para usar `URL.createObjectURL` temporariamente
- [x] 4.3 Conectar submit ao `onSubmitAction` recebido via prop: serializar `FormData` com `photoFile`, phones, emails, socials e demais campos
- [x] 4.4 Usar `useTransition` para envolver a chamada à `onSubmitAction`; desabilitar botão de submit e mostrar spinner durante `isPending`
- [x] 4.5 No modo `edit`: chamar `getPersonDetailsAction` ao montar o form (ou ao receber `personId`); exibir skeleton/loading state enquanto carrega; popular form via `form.reset(data)` após retorno
- [x] 4.6 Tratar erro no submit: manter form aberto com valores intactos e exibir toast de erro

## 5. OrganizationForm

- [x] 5.1 Adicionar campo CNPJ com máscara `00.000.000/0001-00` usando `react-input-mask` no `organization-form.tsx`
- [x] 5.2 Conectar submit ao `onSubmitAction` recebido via prop: serializar `FormData`
- [x] 5.3 Usar `useTransition` para envolver a chamada à `onSubmitAction`; desabilitar botão de submit e mostrar spinner durante `isPending`
- [x] 5.4 No modo `edit`: chamar `getOrganizationDetailsAction` ao montar; popular form via `form.reset(data)`
- [x] 5.5 Tratar erro no submit: manter form aberto com valores intactos e exibir toast de erro

## 6. Página Pessoas — Server Component

- [x] 6.1 Reescrever `page.tsx` como `async`; receber `searchParams: Promise<Record<string, string>>`; parsear `page`, `search`, `sort`, `order`, `organization_id`
- [x] 6.2 Fazer fetch via `persons_summary`: `.eq('account_id', session.account.id)`, `.or(search ilike)`, `.eq('organization_id')` (condicional), `.order(sort, ascending)`, `.range(from, to)`, `{ count: 'exact' }`
- [x] 6.3 Fazer fetch separado sem filtros para `totalUnfiltered` (count apenas com `account_id`)
- [x] 6.4 Passar `data`, `totalCount`, `totalUnfiltered`, `currentPage`, `pageSize`, `filters` como props para `PersonPageClient`

## 7. Página Pessoas — Client Component

- [x] 7.1 Atualizar `PersonPageClient` props: receber `data`, `totalCount`, `totalUnfiltered`, `currentPage`, `pageSize`, `initialFilters` (search, organizationId, sort, order)
- [x] 7.2 Remover fake loading delay (`setTimeout`); exibir skeleton real via `isPending` do `useTransition` de navegação
- [x] 7.3 Implementar handlers de filtros/busca/ordenação/paginação com `router.push()` construindo a query string com `URLSearchParams`; resetar `page` para 1 ao mudar filtros
- [x] 7.4 Adicionar `EntityCombobox` de organizações na área de filtros do header; inicializar com `initialFilters.organizationId`
- [x] 7.5 Implementar `useOptimistic` para lista de pessoas: optimistic update no edit, optimistic remove no delete
- [x] 7.6 Implementar handler de create com `useTransition`: chamar `createPersonAction`, atualizar `setSession` com `persons_count + 1`, fechar form em sucesso, manter aberto em erro
- [x] 7.7 Implementar handler de update com `useTransition` + `useOptimistic`: aplicar diff otimisticamente, fechar form, tratar rollback com toast + ação "Editar novamente"
- [x] 7.8 Implementar handler de delete com `useTransition` + `useOptimistic`: remover otimisticamente, fechar dialog, tratar rollback com toast; decrementar `persons_count` em sucesso
- [x] 7.9 Salvar `originalValues` da pessoa selecionada antes de fechar o form de edição (para uso no retry via toast)
- [x] 7.10 Passar `onSubmitAction` adequado (`createPersonAction` ou `updatePersonAction`) ao `PersonForm` conforme modo

## 8. PersonDataTable

- [x] 8.1 Remover `getFilteredRowModel`, `getPaginationRowModel`, `getSortedRowModel` do `useReactTable`
- [x] 8.2 Adicionar `manualPagination: true`, `manualSorting: true`, `manualFiltering: true`; `pageCount: Math.ceil(totalCount / pageSize)`
- [x] 8.3 Receber `totalCount`, `currentPage`, `pageSize`, `onPageChange`, `onSortChange` como props; remover props de `searchValue`, `onClearSearch` (filtros agora controlados pelo Client Component pai)
- [x] 8.4 Controlar sort state via `onSortingChange` que chama `onSortChange(columnId, direction)` no pai
- [x] 8.5 Implementar dois empty states distintos: usar `totalUnfiltered === 0` para "sem dados" vs. `data.length === 0 && totalUnfiltered > 0` para "sem resultados"; botão de reset no segundo estado chama handler que limpa search + organization_id + page

## 9. Página Organizações — Server Component

- [x] 9.1 Reescrever `page.tsx` como `async`; parsear `page`, `search`, `sort`, `order` dos searchParams
- [x] 9.2 Fazer fetch via `organizations_summary`: `.eq('account_id', session.account.id)`, `.or(search ilike name, cnpj)`, `.order(sort, ascending)`, `.range(from, to)`, `{ count: 'exact' }`
- [x] 9.3 Fazer fetch separado sem filtros para `totalUnfiltered`
- [x] 9.4 Passar `data`, `totalCount`, `totalUnfiltered`, `currentPage`, `pageSize`, `filters` para `OrganizationPageClient`

## 10. Página Organizações — Client Component

- [x] 10.1 Atualizar `OrganizationPageClient` props: receber `data`, `totalCount`, `totalUnfiltered`, `currentPage`, `pageSize`, `initialFilters`
- [x] 10.2 Remover fake loading delay; usar `isPending` do `useTransition`
- [x] 10.3 Implementar handlers de busca/ordenação/paginação com `router.push()`
- [x] 10.4 Implementar `useOptimistic` para lista de organizações
- [x] 10.5 Implementar handler de create com `useTransition`
- [x] 10.6 Implementar handler de update com `useTransition` + `useOptimistic` + toast com retry
- [x] 10.7 Implementar handler de delete com `useTransition` + `useOptimistic`
- [x] 10.8 Conectar coluna "Pessoas" da tabela: tornar célula clicável navegando para `/pessoas?organization_id=<id>`
- [x] 10.9 Passar `onSubmitAction` adequado ao `OrganizationForm`

## 11. OrganizationDataTable

- [x] 11.1 Remover `getFilteredRowModel`, `getPaginationRowModel`, `getSortedRowModel`
- [x] 11.2 Adicionar `manualPagination`, `manualSorting`, `manualFiltering`; receber `totalCount`, `currentPage`, `pageSize`, `onPageChange`, `onSortChange`
- [x] 11.3 Implementar dois empty states distintos (mesma lógica de `PersonDataTable`)
