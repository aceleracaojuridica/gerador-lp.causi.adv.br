## Why

A rota `/oportunidades/[pipelineId]` é o coração do CRM do Causi, mas hoje opera com mocks, Server Actions stub e `DealInfo` estático. Sem dados reais, drag-and-drop, filtros, limites de plano e realtime, a feature não entrega valor ao advogado. Esta change conecta o Kanban ao Supabase conforme `docs/features/deals-kanban.md`, preservando o visual já revisado.

## What Changes

- `/oportunidades` e `/oportunidades/[pipelineId]` passam a buscar funis, etapas e deals reais (RPC `get_deals_by_stage` / `get_deals_won_lost`)
- Cookie `causi_pipeline` para último funil; limpeza ao trocar conta; redirect para funil mais antigo da conta quando cookie ausente ou inválido
- Busca (`search`), filtros (`tags`, `owner`, `status`) e ordenação (`sort`, `order`) via URL — sem param de paginação (infinite scroll client-side com offset interno)
- Infinite scroll: ao rolar o board, cada lote carrega até 25 deals **por coluna** via RPC; critério de parada **global** (`totalLoaded < totalCount`)
- Drag-and-drop otimista de deals e etapas (modo `open`); visibilidade `won_lost` com colunas estáticas Ganhos/Perdidos sem DnD
- Modo de seleção em massa: mover, excluir, selecionar por coluna
- CRUD de oportunidades via Server Actions reais (`DealForm`); mover via `DealMoveForm`; exclusão física com guard de `ids` vazio + `account_id`
- Edição do funil atual no contexto da página (`PipelineForm`, exclusão de etapa imediata, RPC `update_pipeline`); troca de funil via combobox no header
- Sheet de visualização conectado a `deals_summary`; status won/lost/open sem confirmação; abas tarefas/chat permanecem como placeholder
- Parâmetro de URL `deal` para deep link e histórico do browser: sheet controlado por estado local; URL atualizada em background via `buildDealsListUrl` + `router.push`/`replace` (sem `nuqs`); back/forward abre/fecha o sheet; deal fora do Kanban visível é válido se pertencer ao funil; deal de outro funil ou id inválido fecha silenciosamente
- Realtime via `postgres_changes` em `deals` (`pipeline_id`) e `conversations` (`account_id`); preview de mensagem no card com batch fetch em janela fixa de 10s
- Permissões e limites na UI (`deals` para oportunidades; `pipelines` `update` para editar funil/etapas) + validação server-side
- Contagens `totalCount` / `totalUnfiltered` e totais por coluna alinhados aos filtros da URL (padrão `/pessoas`)
- Shell da página não bloqueia no fetch de deals: promise assíncrona + `<Suspense>` no client (padrão `/pessoas`); `loading.tsx` global só até o shell inicial
- Dois empty states com colunas do funil visíveis + busca/filtros desabilitados quando `totalUnfiltered === 0`
- Combobox "Trocar Funil" via `pipelines_summary` (`deal_count` macro por funil); badge do header com `totalCount` filtrado
- Links de oportunidades na sidebar e abas usam `causi_pipeline` atual (`deals-path` + `layout.tsx`)
- **BREAKING**: `DealForm` / `PipelineForm` deixam de exportar mocks como API pública; actions reais em `oportunidades/[pipelineId]/actions.ts`
- **BREAKING**: param `owner` na URL de oportunidades (UUID do responsável; mapeia para `p_owner_user_id` / coluna `owner_user_id` no banco)

## Capabilities

### New Capabilities

- `deals-kanban`: Página Kanban — routing, cookie de funil, fetch inicial, colunas/cards, DnD, filtros/ordenação URL, infinite scroll, modo `won_lost`, empty states, header e abas
- `deals-crud`: Criar, editar, excluir e mover oportunidades (unitário e em massa), tags, limites, regra de pessoa única por funil, deals bloqueados
- `deals-view-sheet`: Sheet de visualização com dados de `deals_summary`, ações e toggle de status
- `pipeline-kanban-controls`: Trocar funil, editar funil atual, reordenar/excluir etapas no contexto da página de oportunidades
- `deals-realtime`: Sincronização Supabase Realtime (`postgres_changes` em `deals` + `conversations`, batch fetch 10s) sem reload completo

### Modified Capabilities

- `session-context`: Atualização otimista de `usage.deals_count` após criar/excluir deal; limpeza de `causi_pipeline` ao trocar conta (via `switchAccountAction` ou equivalente)

## Impact

**Rotas e páginas:**
- `src/app/(app)/(oportunidades)/oportunidades/page.tsx`
- `src/app/(app)/(oportunidades)/oportunidades/[pipelineId]/page.tsx`
- `src/app/(app)/(oportunidades)/oportunidades/[pipelineId]/page.client.tsx`
- `src/app/(app)/(oportunidades)/oportunidades/[pipelineId]/kanban-board.tsx`
- `src/app/(app)/(oportunidades)/oportunidades/[pipelineId]/actions.ts`
- `src/app/(app)/(oportunidades)/oportunidades/[pipelineId]/use-deals-realtime.ts` (hook Realtime + coletor batch 10s)
- `src/app/(app)/(oportunidades)/oportunidades/[pipelineId]/types.ts` (`DealRow`, `DealDataResult`, `PersonDetails` — `database.types.ts` só como referência, sem import)
- `src/app/(app)/(oportunidades)/oportunidades/[pipelineId]/kanban-skeleton.tsx`
- `src/app/(app)/layout.tsx`, `src/lib/deals-path.ts`, `src/lib/pipeline-cookie.ts`

**Componentes e forms:**
- `src/components/deals/deal-info.tsx`
- `src/forms/DealForm/*`, `src/forms/DealMoveForm/*`, `src/forms/DealsFilterForm/*`
- `src/forms/PipelineForm/*`, `src/forms/DeletePipelineStageForm/*`

**Sessão:**
- `src/lib/session/actions.ts` (`deletePipelineCookie` em `switchAccountAction`)

**Banco / RPC (somente consumo, sem migrations nesta change):**
- RPCs: `get_deals_by_stage`, `get_deals_won_lost`, `get_deals_count`, `get_deals_won_lost_count`, `update_pipeline`
- Views / SDK: `deals_summary`, `pipelines_summary` (combobox), `pipelines`, `pipeline_stages` (não usar `get_deals` / `get_single_deal` / `get_deals_by_id`)
- Read actions em `actions.ts`: `getDealDetailsAction`, `getDealsDetailsBatchAction`, `getDealPersonDetailsAction`, `getPipelineDetailsAction`, `getPipelineStageDealsCountAction`, `setPipelineCookieAction`
- Tabelas: `deals`, `deals_tags`, `pipeline_stages`, `pipelines`, `conversations` (realtime preview no card)

**Fora de escopo (confirmado):**
- Páginas dedicadas `/funis` e `/etiquetas` (abas podem linkar; não implementar essas rotas)
- Listagem/criação de tarefas; chat funcional da oportunidade

**Referência:** `docs/features/deals-kanban.md`, `docs/implementations/session-context.md`, padrão de `pessoas` / `organizacoes`
