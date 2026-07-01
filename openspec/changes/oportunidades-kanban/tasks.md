## 1. Fundação (tipos, cookie, redirect)

- [x] 1.1 Criar util server `causi_pipeline` (get/set/delete) e integrar limpeza em `switchAccountAction`
- [x] 1.2 Implementar `/oportunidades/page.tsx` com redirect (cookie → funil mais antigo → `/oportunidades/{id}`)
- [x] 1.3 Alinhar `types.ts` com contrato de `deals_summary` e RPCs (consultar `database.types.ts` só como referência, sem import); remover dependência de `mock-data.ts`
- [x] 1.4 Mapear `sort`/`order` URL → parâmetros RPC (`last_message`, `created_at`, `overdue_task`, `updated_at`)
- [x] 1.5 `deals-path.ts` + `layout.tsx`: `dealsHref` na sidebar com cookie `causi_pipeline`
- [x] 1.6 `setPipelineCookieAction` no client ao montar a página (gravação do cookie fora do render RSC)

## 2. Server fetch e página RSC

- [x] 2.1 Refatorar `[pipelineId]/page.tsx`: validar pipeline por `account_id`, buscar stages via SDK
- [x] 2.2 Fetch paralelo: deals página 1 + `totalCount` (filtrado) + `totalUnfiltered` (sem search/tags/owner) + agregados por coluna
- [x] 2.5 Default sort `last_message` desc sem URL; mapear `DealsFilterForm` → params `sort`/`order`
- [x] 2.6 Passar `totalCount` / `totalUnfiltered` ao client (padrão `pessoas`)
- [x] 2.3 Passar props corretas para `page.client.tsx` (`owner` na URL → `ownerUserId` UUID, filtros, colunas won_lost)
- [x] 2.4 Remover `mock-data.ts` e redirect fixo `/oportunidades/1`
- [x] 2.7 `dealsDataPromise` sem await no RSC + `<Suspense>` / `use()` no client (padrão `/pessoas`)
- [x] 2.8 `kanban-skeleton.tsx` como fallback de Suspense e durante `nav.isFetching`
- [x] 2.9 Combobox "Trocar Funil" via `pipelines_summary` (`deal_count` macro por funil)

## 3. Server Actions (deals)

- [x] 3.1 `createDealAction` — insert `deals` + `deals_tags`, validação pessoa única no funil, permissão, limite
- [x] 3.2 `updateDealAction` — update deal + tags; bloquear edição se `blocked_at`
- [x] 3.3 `deleteDealsAction` — guard `ids.length`, DELETE com `account_id`
- [x] 3.4 `moveDealsAction` — pipeline/stage + reset status ao sair de won/lost
- [x] 3.5 `updateDealStageAction` — DnD single card (`pipeline_stage_id` only)
- [x] 3.6 `updateDealStatusAction` — won/lost/open + timestamps
- [x] 3.7 `loadMoreDealsAction` — RPC offset +25 por etapa; `hasMore` global: `sum(cards) < totalCount` (action server-side; cálculo de `hasMore` no client em 6.2)
- [x] 3.8 Read actions: `setPipelineCookieAction`, `getDealDetailsAction`, `getDealPersonDetailsAction`, `getPipelineDetailsAction`, `getPipelineStageDealsCountAction`

## 4. Server Actions (pipeline / stages)

- [x] 4.1 `updatePipelineAction` — RPC `update_pipeline`
- [x] 4.2 `updateStageOrderAction` — update `pipeline_stages.order` (uma etapa)
- [x] 4.3 `deletePipelineStageAction` — por `pipeline_stage_id` + `account_id` (mover todos ou DELETE todos os deals da etapa, não ids do Kanban) + DELETE stage

## 5. Forms e wiring

- [x] 5.1 `DealForm`: remover mocks; `onSubmitAction` real; combobox pessoa/owner/tags (30 itens + hint)
- [x] 5.2 `DealMoveForm`: wire `moveDealsAction` (form é prop-driven; `page.tsx` agora busca etapas de todos os funis da conta para destino)
- [x] 5.3 `DealsFilterForm`: tags/users reais; URL `sort`/`order`/`tags` CSV; param `owner` (UUID); `status` open/won_lost; aplicar só no submit
- [x] 5.4 `PipelineForm` / `DeletePipelineStageForm`: actions reais; proteger etapas especiais

## 6. Client Kanban (`page.client.tsx` + `kanban-board.tsx`)

- [x] 6.1 Remover simulação mock/delay; URL-driven search/filters/sort
- [x] 6.2 Infinite scroll: observer só se `totalLoaded < totalCount`; overlay + skeleton
- [x] 6.3 DnD deals e stages com optimistic UI (desabilitar em won_lost e modo seleção)
- [x] 6.4 Modo seleção: bulk move/delete, checkbox por coluna
- [x] 6.5 Header: trocar funil, editar funil (`pipelines` update), permissões e limite em botões
- [x] 6.6 `setSession` deals_count após create/delete (incl. `deleted_count` ao excluir etapa)
- [x] 6.7 Re-sort colunas após DnD deal; `resolveMediaPublicUrl` em fotos

## 7. Sheet (`DealInfo`)

- [x] 7.1 Passar deal real / fetch `deals_summary` ao abrir sheet
- [x] 7.2 Wire editar deal, editar pessoa, excluir, toggle status
- [x] 7.3 Manter placeholders tarefas/chat

## 8. Realtime

- [x] 8.1 `getDealsDetailsBatchAction` — `deals_summary` com `.in('id', ids)` + `account_id`; guard `ids.length === 0`
- [x] 8.2 Hook `useDealsRealtime`: canal único com `postgres_changes` em `deals` (`pipeline_id=eq.{id}`) e `conversations` (`account_id=eq.{id}`); cleanup em unmount/troca de funil
- [x] 8.3 Coletor de batch (janela fixa 10s, timer não reinicia): enfileirar `deal_id` só se deal carregado (`conversation_id` → mapa de `kanbanColumns`); flush → `getDealsDetailsBatchAction`
- [x] 8.4 Merge em `kanbanColumns` no parent (`DealPageClient`): deals INSERT/UPDATE/DELETE (DELETE imediato); batch de conversas com filtros URL + re-sort; sincronizar estado com `DealsKanbanSection`/`DealKanban` (controlado ou equivalente); atualizar `viewingDeal` se aberto

## 9. QA e polish

- [x] 9.1 Verificar empty states: colunas visíveis + empty abaixo; cadastro vs filtros (incl. `won_lost`); "Limpar filtros" remove filtros e ordenação; busca/filtros desabilitados quando `totalUnfiltered === 0`
- [x] 9.2 Troca de conta + cookie + redirect funil
- [x] 9.3 `pnpm lint` nos arquivos alterados
- [x] 9.4 Verificar permissões `deals` / `pipelines` na UI conforme `roles-and-permissions.md`
- [x] 9.5 Preservar padrões oculto vs disabled (coluna seleção/entry, modal funil, botões sem permissão)

## 10. Sheet — parâmetro de URL `deal` (extensão)

- [x] 10.1 `page.client.tsx`: estado local `isDealSheetOpen`; `fetchDealForSheet` / `closeDealSheet` / `resetDealSheet`; URL via `pushDealUrl`/`replaceDealUrl` em background
- [x] 10.2 Abrir deal (card / Visualizar): abertura imediata + `router.push` com `?deal=` + fetch otimista com toast em falha
- [x] 10.3 Fechar sheet, exclusão e realtime delete: fechamento imediato + `router.push` remove `deal`; realtime via `handleViewingDealChange`
- [x] 10.4 Deep link e back/forward: effect em `dealUrlParam` + `pendingUrlDealRef`; validar `pipeline_id`; fetch falho → `router.replace` + toast; `DealInfo` overlay em `isLoading || isLoadingPerson`
- [x] 10.5 QA: reload com deal fora do infinite scroll; deal de outro funil; back/forward do browser
