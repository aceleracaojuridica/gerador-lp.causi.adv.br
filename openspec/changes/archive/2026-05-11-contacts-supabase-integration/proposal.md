## Why

As páginas `/pessoas` e `/organizacoes` estão usando dados estáticos mockados. Toda a camada de busca, filtros, paginação e ordenação é feita localmente no cliente, e as actions de CRUD (criar, editar, excluir) simulam o comportamento com delays artificiais. A feature precisa ser conectada ao Supabase com fetch real, server-side filtering/pagination e Server Actions seguras.

## What Changes

- `pessoas/page.tsx` passa a ser `async`, recebe `searchParams` e faz fetch server-side via `persons_summary` view
- `pessoas/page.client.tsx` controla filtros/paginação via `router.push()` (URL-driven); usa `useTransition` + `useOptimistic` para mutations; skeleton loading mantido para tabela e contador do header
- `pessoas/data-table.tsx` migra de client-side filtering/sorting/pagination para `manualPagination`, `manualSorting`, `manualFiltering` do TanStack Table
- Novo arquivo `pessoas/actions.ts` com Server Actions: `createPersonAction`, `updatePersonAction`, `deletePersonsAction`, `getPersonDetailsAction`
- `PersonForm` desacoplado de mock de organizações; recebe `onSubmitAction` como prop; busca detalhes via Server Action ao abrir no modo edição; upload de foto integrado ao submit
- `organizacoes/page.tsx` idem ao de pessoas — async, fetch server-side via `organizations_summary`
- `organizacoes/page.client.tsx` idem — URL-driven, `useTransition` + `useOptimistic`
- `organizacoes/data-table.tsx` idem — manual pagination/sorting/filtering
- Novo arquivo `organizacoes/actions.ts` com Server Actions: `createOrganizationAction`, `updateOrganizationAction`, `deleteOrganizationsAction`
- `OrganizationForm` com `react-input-mask` para CNPJ; recebe `onSubmitAction` como prop
- Filtro de organização na página `/pessoas` via `EntityCombobox` interativo (URL param `organization_id`)
- Link de contagem em `/organizacoes` navega para `/pessoas?organization_id=X` filtrando a lista
- Revalidação de `session.usage.persons_count` via `setSession` após criar/deletar pessoa
- Dois empty states distintos em ambas as páginas: (1) sem itens no banco — sem filtros ativos — com CTA de criação; (2) filtros/busca ativos sem resultados — botão reseta busca e todos os filtros (incluindo organização)
- URL params aparecem apenas quando o usuário aplica filtros/paginação; navegação limpa (sidebar, nav-tabs) não adiciona params; F5 ou URL direta com params aplica os filtros ativos
- **BREAKING**: `PersonFormProps` e `OrganizationFormProps` ganham prop `onSubmitAction` obrigatória substituindo `onSuccess` para mutations reais; `defaultValues` passa a ser `PersonDetails` / `OrganizationDetails` no modo edição

## Capabilities

### New Capabilities

- `persons-list`: Listagem server-side de pessoas com busca full-text, filtro por organização, ordenação e paginação via URL params; contagem total com filtros ativos no header
- `persons-crud`: Criar, editar e excluir pessoas com validação de permissão/limite (`serverIsWithinLimit`), upload de foto integrado ao submit, optimistic UI com rollback e comportamento de erro diferenciado por operação (create mantém form aberto; update faz rollback + toast com ação "Editar novamente"; delete faz rollback silencioso + toast)
- `organizations-list`: Listagem server-side de organizações com busca, ordenação e paginação via URL params; contagem de pessoas vinculadas
- `organizations-crud`: Criar, editar e excluir organizações com validação de permissão, CNPJ mascarado, optimistic UI com mesmo padrão de rollback

### Modified Capabilities

- `session-context`: `usage.persons_count` é atualizado otimisticamente via `setSession` após criar/deletar pessoas (sem mudança de contrato, só adição de uso)

## Impact

**Arquivos modificados:**
- `src/app/(app)/(pessoas)/pessoas/page.tsx`
- `src/app/(app)/(pessoas)/pessoas/page.client.tsx`
- `src/app/(app)/(pessoas)/pessoas/data-table.tsx`
- `src/app/(app)/(pessoas)/pessoas/columns.tsx`
- `src/app/(app)/(pessoas)/organizacoes/page.tsx`
- `src/app/(app)/(pessoas)/organizacoes/page.client.tsx`
- `src/app/(app)/(pessoas)/organizacoes/data-table.tsx`
- `src/app/(app)/(pessoas)/organizacoes/columns.tsx`
- `src/forms/PersonForm/person-form.tsx`
- `src/forms/PersonForm/person-form.types.ts`
- `src/forms/PersonForm/schema.ts`
- `src/forms/OrganizationForm/organization-form.tsx`
- `src/forms/OrganizationForm/organization-form.types.ts`
- `src/forms/OrganizationForm/schema.ts`

**Arquivos novos:**
- `src/app/(app)/(pessoas)/pessoas/actions.ts`
- `src/app/(app)/(pessoas)/organizacoes/actions.ts`

**Dependências:**
- `react-input-mask@next` (já instalado) — máscara CNPJ no OrganizationForm
- Supabase views: `persons_summary`, `organizations_summary` (já existem no banco)
- Supabase RPCs: `create_person`, `update_person` (já existem no banco)
- `src/lib/media` — `buildPersonMediaPath`, `uploadMediaObject`, `cleanupMediaObject`, `resolveMediaPublicUrl`
- `src/lib/session` — `getSession`, `serverHasPermission`, `serverIsWithinLimit`

**Limites e permissões:**
- `serverHasPermission(session, 'persons', 'create'|'update'|'delete')`
- `serverIsWithinLimit(session, 'persons')` usado na criação (o limite de persons é hardcoded no app-level hoje; será ajustado futuramente para vir do banco como os demais recursos)
- UI: `useAccessControl().isWithinLimit('persons')` para desabilitar botão com tooltip explicativo quando o limite for atingido
- Deleção sempre com `.eq('account_id', accountId)` + guard obrigatório: se `ids` estiver vazio, retorna erro sem executar query

**Estratégia de optimistic UI por operação:**
- **Create**: sem otimismo — form permanece aberto durante `isPending`; em erro mantém form aberto com valores intactos + toast de erro
- **Update**: otimista — `useOptimistic` aplica novos valores na tabela, form fecha; em erro `useOptimistic` faz rollback automático + toast com ação "Editar novamente" (reabre form com valores originais)
- **Delete**: otimista — `useOptimistic` remove itens da lista, dialog fecha; em erro rollback automático + toast de erro
