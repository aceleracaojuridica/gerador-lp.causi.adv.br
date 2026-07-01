## Context

As páginas `/pessoas` e `/organizacoes` existem com estrutura de componentes estabelecida (page.tsx, page.client.tsx, data-table.tsx, columns.tsx) e formulários em `src/forms/PersonForm` e `src/forms/OrganizationForm`. Toda lógica de dados era client-side com mocks. Este design conecta as páginas ao Supabase mantendo a estrutura de arquivos e o design visual existentes.

O banco já possui as views `persons_summary` e `organizations_summary` e as RPCs `create_person` e `update_person`, prontas para uso.

## Goals / Non-Goals

**Goals:**
- Fetch server-side com filtros, busca, ordenação e paginação aplicados no banco
- Server Actions tipadas e seguras para CRUD completo
- Optimistic UI com rollback automático para update e delete
- Upload de foto de contato integrado ao submit do form
- Filtro de organização interativo em `/pessoas` via URL param
- Paridade de comportamento entre `/pessoas` e `/organizacoes` (mesmos padrões)

**Non-Goals:**
- Realtime (sem `supabase.channel` ou subscription)
- Infinite scroll / virtual list
- Bulk edit (somente bulk delete)
- Exportação de dados
- Detalhes de pessoa em sidebar/drawer (escopo futuro)
- Alteração de schema no banco

## Decisions

### D1 — URL-driven filtering (Server Component re-renders)

Filtros, busca, ordenação e página são state na URL. O Client Component chama `router.push()` para atualizar params; o Server Component re-renderiza com os novos dados.

**Alternativas:**
- Client-driven com Supabase browser client: estado espalhado no client, sem URL compartilhável, duplica a lógica de auth
- Server Actions para fetch: adequado para mutations, não para reads em resposta a filtros interativos

**Rationale:** Alinha com o padrão RSC do projeto, aproveita cache do Next.js por URL, funciona nativamente com `router.refresh()` no account-switching e mantém URLs compartilháveis.

### D2 — Server Actions co-localizadas por página

Cada página tem seu próprio `actions.ts` (`pessoas/actions.ts`, `organizacoes/actions.ts`). Não há um arquivo de actions compartilhado.

**Rationale:** As duas páginas têm lógica de negócio distinta (persons tem upload de foto e limit check; organizations não). Co-localização facilita navegação e evita acoplamento desnecessário. Componentes compartilhados (forms) recebem a action via prop.

### D3 — TanStack Table em modo manual

`PersonDataTable` e `OrganizationDataTable` removem `getFilteredRowModel`, `getPaginationRowModel` e `getSortedRowModel`. Passam a usar `manualPagination: true`, `manualSorting: true`, `manualFiltering: true`. Os dados que chegam via props são exatamente a página atual.

**Rationale:** Com fetch server-side, processar dados localmente seria redundante e inconsistente (paginação local com 50 itens ≠ paginação real com N mil itens no banco).

### D4 — Optimistic UI diferenciado por operação

| Operação | Otimismo | Falha |
|----------|----------|-------|
| **Create** | Nenhum — form permanece aberto com `isPending` | Form mantém valores + toast de erro |
| **Update** | `useOptimistic` aplica diff na lista, form fecha | Rollback automático + toast com ação "Editar novamente" (reabre form com valores originais) |
| **Delete** | `useOptimistic` remove itens da lista, dialog fecha | Rollback automático + toast de erro |

`useOptimistic` reverte para o estado vindo das props (último render do Server Component) automaticamente ao fim da transition sem `revalidatePath` bem-sucedido. `useTransition` expõe `isPending` para desabilitar controles durante operações assíncronas.

**Rationale:** Create não tem `id` ainda (não é possível faking de row), então não há ganho em otimismo. Update e delete são reversíveis visualmente e têm baixo custo de UX se rollbackearem.

### D5 — Upload de foto integrado ao submit (Server Action)

O fluxo de upload ocorre dentro da Server Action:
1. `formData.get('photoFile')` → validação de tipo e tamanho
2. `buildPersonMediaPath({ accountId, personId: temp_uuid, filename })` → path no bucket `media`
3. `uploadMediaObject(supabase, 'media', path, file)` → upload
4. `resolveMediaPublicUrl(supabase, 'media', path)` → URL pública
5. URL é passada como `p_photo` ao RPC `create_person` / `update_person`

Para update com troca de foto, a foto antiga é limpa via `cleanupMediaObject` após o upload bem-sucedido da nova.

**Rationale:** Centraliza autorização e garante que nenhuma foto fica órfã por erro de rede entre upload e criação. O RPC `create_person` já aceita `p_photo` diretamente.

### D6 — getPersonDetailsAction para dados completos no edit

Ao abrir o form de edição, o Client Component chama `getPersonDetailsAction(id)` (Server Action), que executa:

```sql
SELECT p.*, 
  json_agg(DISTINCT pp.*) AS phones,
  json_agg(DISTINCT pe.*) AS emails,
  row_to_json(ps.*) AS socials,
  json_build_object('id', o.id, 'name', o.name) AS organization
FROM persons p
LEFT JOIN person_phones pp ON pp.person_id = p.id
LEFT JOIN person_emails pe ON pe.person_id = p.id
LEFT JOIN person_socials ps ON ps.person_id = p.id
LEFT JOIN organizations o ON o.id = p.organization_id
WHERE p.id = $1 AND p.account_id = $2
GROUP BY p.id, ps.id, o.id
```

Equivalente via SDK: `.select('*, person_phones(*), person_emails(*), person_socials(*), organizations(id, name)')`.

O `account_id` é incluído no filtro para prevenir IDOR — um usuário não pode acessar dados de outra conta mesmo conhecendo o `id`.

**Rationale:** A view `persons_details` existe mas a feature doc indica não usá-la para edição (reservada para sidebar). Server Action é preferível a browser client para manter autorização server-side.

### D7 — Guard obrigatório em delete

Antes de qualquer `.in('id', ids)`, a action valida:

```typescript
if (!ids || ids.length === 0) {
  return { success: false, code: 'INVALID_INPUT', message: 'Nenhum item selecionado.' }
}
```

A query sempre inclui `.eq('account_id', accountId)` como segunda condição, garantindo que mesmo com ids válidos de outras contas, nada seja deletado fora do escopo da conta atual.

### D8 — Empty states por contexto

O Server Component passa um segundo dado: `totalUnfiltered` (count sem filtros ativos). O Client Component usa essa informação para distinguir os dois estados:

- `totalUnfiltered === 0` → empty state "sem dados" com CTA de criação
- `totalUnfiltered > 0 && data.length === 0` → empty state "sem resultados" com botão de reset (limpa `search` + `organization_id` + `page` da URL)

### D9 — Navegação limpa sem params na URL

Ao navegar pelo sidebar ou nav-tabs para `/pessoas` ou `/organizacoes`, a URL fica sem params. Params aparecem na URL somente quando o usuário aplica filtros, busca ou troca de página. Ao recarregar (F5) ou acessar uma URL com params, os filtros são aplicados normalmente.

Implementação: links no sidebar e nav-tabs apontam para `/pessoas` sem query string. O Client Component lê as props iniciais do server (searchParams parsed) e inicializa o estado local a partir delas — sem sync bidirecional complexo.

## Risks / Trade-offs

- **Race condition em navigação rápida**: múltiplos `router.push()` em sequência podem causar renders intermediários. Mitigação: `useTransition` serializa as transitions; `isPending` desabilita controles durante navegação.

- **Foto órfã em falha parcial**: se o upload para o bucket `media` suceder mas o RPC falhar, a foto fica no bucket sem referência. Mitigação: a Server Action tenta limpar o arquivo em caso de falha do RPC (best-effort cleanup). Monitorar via logs de Storage.

- **react-input-mask@next compatibility com React 19**: versão `@next` é a indicada para React 18+/19. Testar comportamento de `ref` e `onChange` no OrganizationForm antes de finalizar.

- **persons_summary sem `account_id` explícito no select**: a view já filtra via RLS, mas o `.eq('account_id', ...)` é adicionado explicitamente nas queries para clareza e auditabilidade.

## Migration Plan

Não há migração de banco de dados. A mudança é inteiramente no código da aplicação. Deploy é zero-downtime — substituição direta dos arquivos existentes.

## Open Questions

- Nenhuma no momento.
