## Context

A página `/oportunidades/[pipelineId]` já possui UI completa (header, Kanban, modais, sheet, modo seleção) alimentada por `mock-data.ts` e actions que retornam sucesso fake. O banco expõe `deals_summary`, RPCs `get_deals_by_stage` / `get_deals_won_lost` e `update_pipeline`. O padrão de referência é `pessoas`/`organizacoes`: Server Component para fetch inicial, URL params para filtros, Server Actions com `getSession` + permissões + `account_id`, client com `useOptimistic` e `useTransition`.

Constraints alinhados com o usuário:
- Entregar escopo completo do `kanban.md` nesta change (specs separadas por capability).
- Cookie `causi_pipeline`; limpar ao trocar conta; funil mais antigo (`ORDER BY created_at ASC LIMIT 1`) quando cookie ausente.
- Infinite scroll: 25 deals por coluna por “lote”, sem param de paginação na URL.
- URL: `search`, `tags`, `owner` (UUID do responsável; coluna no banco: `owner_user_id`), `status` (`open` | `won_lost`), `sort`, `order`.
- Realtime: `postgres_changes` (exceção à regra geral do repo para esta feature).
- Exclusão física com guard `ids.length === 0` e `.eq('account_id', accountId)`.

## Goals / Non-Goals

**Goals:**
- Kanban funcional com dados reais, todos os fluxos do doc na rota de oportunidades.
- Controles de funil no header (trocar, editar, excluir etapa) sem implementar `/funis`.
- Sheet de visualização com `deals_summary` e mutations de status.
- Permissões/limites na UI e no servidor.
- Realtime para insert/update/delete de deals.

**Non-Goals:**
- Páginas `/funis` e `/etiquetas`.
- CRUD de tarefas; chat/conversa funcional no sheet.
- Criar novo funil (apenas editar o atual).
- Migrar outras rotas para `owner_user_id` UUID.
- Substituir `postgres_changes` por broadcast (decisão explícita do produto).

## Decisions

### 1. Arquitetura página: shell RSC + streaming + client Kanban

Padrão alinhado a `/pessoas`: shell rápido, dados pesados via promise + `<Suspense>`.

**Fase 1 — `page.tsx` (bloqueante, leve):**
- `getSession`, validar `pipelineId` vs `account_id`
- Buscar pipeline + `pipeline_stages` do funil ativo (`pipelines` + `pipeline_stages` via SDK)
- Parse de search params (`search`, `tags`, `owner`, `status`, `sort`, `order`)
- Iniciar `dealsDataPromise` (IIFE assíncrona **sem await** no return)

**Fase 2 — `dealsDataPromise` (streaming):**
- RPC de deals (página 1), `totalCount`, `totalUnfiltered`, agregados por coluna
- `pipelines_summary` para combobox "Trocar Funil" (ver §1b)
- `pipeline_stages` de todos os funis da conta (destino em `DealMoveForm`)

**`page.client.tsx`:**
- Shell imediato: `NavTabs`, header, busca, popover de filtros
- `DealsCount`, `DealsPipelineSwitcher` e `DealsKanbanSection` consomem a promise via `use()` dentro de `<Suspense>`
- Fallback: `kanban-skeleton.tsx` (colunas da fase 1, corpos em skeleton)
- `nav.isFetching` → skeleton completo do Kanban ao trocar URL/filtros
- Estado de colunas no parent (`kanbanColumns`) sincronizado com `DealsKanbanSection` via callbacks — ponto de integração do realtime (§9)
- Infinite scroll, DnD, modais, sheet, modo seleção, sincronização URL

**`loading.tsx` (rota):** spinner global (`app/(app)/loading`) apenas até o shell da fase 1; não substitui o skeleton do Kanban.

**`actions.ts`:** mutations + read actions (§8c) + `setPipelineCookieAction` + `loadMoreDealsAction`.

**Alternativa rejeitada:** fetch 100% no client — perde auth inicial e duplica validação.

### 1b. Combobox "Trocar Funil" — `pipelines_summary`

- Listagem: `pipelines_summary` (`id`, `name`, `deal_count`) filtrado por `account_id`, `ORDER BY created_at ASC`
- Badge no combobox: `deal_count` da view — total macro do funil (todos os status, sem filtros de URL)
- Badge do header da página: `totalCount` filtrado (mesmos critérios do Kanban ativo)
- Não usar `pipeline_details` nesta rota (reservada à configuração de funil)

### 2. Fetch de deals: RPC por modo de visibilidade

| `status` URL | RPC | Colunas UI |
|--------------|-----|------------|
| ausente ou `open` | `get_deals_by_stage` | Etapas reais do funil |
| `won_lost` | `get_deals_won_lost` | Duas colunas estáticas (Ganhos / Perdidos) |

Mapeamento `sort` → `p_order_column` (RPC):
- `last_message` → `'last_message created_at'`
- `created_at` → `'created_at'`
- `overdue_task` → `'overdue_task due_time'`
- `updated_at` → `'updated_at'` (se exposto na UI)

Offset/limit por chamada de infinite scroll: `p_offset = pageIndex * 25`, `p_limit = 25` **por invocação da RPC** (a RPC particiona por `pipeline_stage_id`, então cada coluna recebe até 25 novos itens por lote).

**Não usar** RPCs deprecated de oportunidades (`get_deals`, `get_single_deal`, `get_deals_by_id`). Para fetch pontual (sheet, realtime, lista de ids), usar `deals_summary` via Supabase SDK.

### 3. Cookie `causi_pipeline` e links de navegação

- HTTP-only cookie (mesmo padrão de `causi_act`), path `/`, valor = id numérico do funil.
- **Gravação:** `setPipelineCookieAction` no client ao montar `page.client.tsx` (`cookies().set` não roda em render RSC). Também ao trocar funil no combobox (nova rota).
- **Leitura:** `getPipelineCookie()` em `/oportunidades` (redirect) e em `app/(app)/layout.tsx` (sidebar).
- **Links:** `dealsPath(pipelineId)` em `src/lib/deals-path.ts` → `dealsHref` no `AppLayout` / `AppSidebar` (`/oportunidades/{id}` ou `/oportunidades` se cookie ausente).
- Delete em `switchAccountAction`.
- `/oportunidades` sem id: ler cookie → validar na conta → senão primeiro funil (`pipelines` WHERE `account_id` ORDER BY `created_at` ASC LIMIT 1) → redirect; sem funil → `/funis`.

### 4. Infinite scroll (sem URL)

- Scroll global do board: ao atingir o fim, `loadMoreDealsAction` com `pageIndex` incrementado; RPC retorna até 25 deals **por coluna** no lote.
- Parada global: `hasMore = totalLoaded < totalCount` (soma de cards em todas as colunas vs badge filtrado do header).
- Intersection observer no scroll global do board.
- Overlay de loading inferior durante "load more"; skeleton via Suspense na carga inicial de dados.

### 5. Drag-and-drop

- **Deals**: optimistic `useOptimistic` + `updateDealStageAction` (`deals.pipeline_stage_id`; em bulk move também `pipeline_id`). Não atualizar `deals.order`.
- **Stages**: optimistic reorder + `updateStageOrderAction` (apenas `order` da etapa movida). Etapa `entry` fixa primeira; sem drop antes dela.
- Desabilitar DnD quando `status=won_lost` ou modo seleção ativo.

### 6. Modo seleção e exclusão

- Ativação só via submenu “Selecionar”; encerra quando `selectedIds.size === 0`.
- `deleteDealsAction(ids)`: early return erro se `ids.length === 0`; `DELETE FROM deals WHERE id IN (...) AND account_id = ?`.

### 7. Pipeline edit / delete stage

- **Editar funil**: submit único chama `update_pipeline` RPC com JSON de stages; reorder/add só após Salvar.
- **Excluir etapa**: `DeletePipelineStageForm` retorna `pipeline_stage_id` + `deals_action` (`move` | `delete`) — **não** envia ids de deals. A `deletePipelineStageAction` opera no banco por etapa:
  - **Mover**: `UPDATE deals SET pipeline_stage_id = :target WHERE pipeline_stage_id = :source AND account_id = :account`
  - **Excluir deals**: `DELETE FROM deals WHERE pipeline_stage_id = :source AND account_id = :account`
  - Depois: `DELETE` da linha em `pipeline_stages` (com validação de conta/funil).
  - Motivo: o Kanban só carrega 25 deals por coluna; a etapa pode ter centenas.
- Guards: `pipeline_stage_id` obrigatório; etapa deve pertencer ao `pipeline_id` da sessão/conta; proibir tipos protegidos no server.
- Não reverter se usuário cancelar modal pai depois.
- Etapas `entry` / `qualified` / `disqualified`: botão remover **visível e disabled** (como no `PipelineForm` atual).

### 8. DealForm / DealInfo

- `DealForm`: `onSubmitAction` real; em edição carrega via `getDealDetailsAction`; validar pessoa única no funil no create; person disabled no edit; tags via `deals_tags`; limite `serverIsWithinLimit('deals')`.
- `DealInfo`: deal do Kanban ou `getDealDetailsAction` ao abrir sheet; contato da pessoa via `getDealPersonDetailsAction`; status toggle chama `updateDealStatusAction`.
- **Parâmetro `deal` na URL (extensão):** abertura/fechamento do sheet por estado local (`isDealSheetOpen`); URL atualizada em background via `buildDealsListUrl` — **não** entra em `DealsQuery` nem no fetch RSC — **sem `nuqs`**. Abrir/fechar pelo usuário: `router.push` (histórico para back/forward). Limpeza por id inválido/erro: `router.replace` + toast. `pendingUrlDealRef` distingue mudanças de URL iniciadas pelo app vs. back/forward (`useSearchParams`). Funções centrais: `fetchDealForSheet`, `closeDealSheet`, `resetDealSheet`. Deep link e back/forward: effect em `dealUrlParam` chama `fetchDealForSheet`; clique no card usa `{ optimistic: deal }`. Falha no fetch exibe toast em qualquer origem. Validar `pipeline_id === query.pipelineId`; deal ausente do Kanban carregado é OK. `DealInfo`: `LoadingOverlay` enquanto `isLoading` (deal) ou `isLoadingPerson` (contato).
- `person_photo` nos cards/sheet: `resolveMediaPublicUrl()` (bucket `media`).
- Após mutations que alteram lista global: `router.refresh()` e/ou atualização otimista local; comboboxes com 30 itens + hint de busca.
- Modais pesados (`DealForm`, `PipelineForm`, `PersonForm`): `dynamic()` com `ssr: false` + `LoadingOverlay`.

### 8c. Server Actions de leitura

Centralizadas em `actions.ts` com `getSession` + filtro `account_id`:

| Action | Uso |
|--------|-----|
| `setPipelineCookieAction` | Persistir funil ativo no cookie |
| `getDealDetailsAction` | Sheet e `DealForm` (edição) |
| `getDealPersonDetailsAction` | `DealInfo` — dados de contato |
| `getPipelineDetailsAction` | `PipelineForm` (edição) |
| `getPipelineStageDealsCountAction` | `DeletePipelineStageForm` |
| `getDealsDetailsBatchAction` | Realtime — refetch em lote de cards após eventos em `conversations` |

### 8b. Cards do Kanban (dados do `deals_summary`)

Campos já previstos na UI mock — popular do banco sem mudar layout:
- Responsável (`owner_name`), próxima tarefa (`overdue_task`), badges (bloqueado / follow-up / erro IA via `blocked_at`, `conversation_status`, etc.)
- `last_message`, `new_messages`, `tags`, canal (`channel_type`), `person_name`, `person_photo`

### 9. Realtime

Hook `useDealsRealtime` no parent (`DealPageClient`), integrado ao estado `kanbanColumns` (§1). Um canal Supabase com **dois** listeners `postgres_changes` (exceção à regra geral do repo; ver `proposal.md`). Chat funcional da oportunidade (futuro) terá subscription própria em `messages` — fora desta change.

**Canal único** (ex.: `kanban:{pipelineId}`), cleanup em unmount ou troca de `pipelineId` (`removeChannel`).

#### 9a. Tabela `deals` — CRUD estrutural

- Filter: `pipeline_id=eq.{pipelineId}`.
- Handler valida `account_id` vs sessão antes de mutar estado.
- **INSERT**: merge na coluna correta se passar filtros ativos da URL; ignorar se não passar.
- **UPDATE**: mover/atualizar card; se payload insuficiente para render, refetch pontual via `getDealDetailsAction`.
- **DELETE**: remover card **imediatamente** (fora do batch de conversas).

#### 9b. Tabela `conversations` — preview de mensagem no card

Nova mensagem (trigger em `messages` → UPDATE `conversations.last_message_at`) **não altera** `deals`. Cards exibem `last_message`, `new_messages` e `conversation_status` via `deals_summary`.

- Filter: `account_id=eq.{accountId}` (não usar `deal_id=in.(...)` — limite de 100 valores no Realtime e Kanban carrega >100 cards com infinite scroll).
- Handler client-side:
  1. Resolver deal via mapa `conversation_id → DealRow` dos deals **já carregados** em `kanbanColumns`.
  2. Se ausente → ignorar (converge no próximo infinite scroll ou refresh).
  3. Se presente → enfileirar `deal_id` no coletor de batch (§9c).
- Latência de até ~10s aceitável: card é preview; inbox/chat terá realtime dedicado.

#### 9c. Batch fetch — janela fixa de 10s

Coletor de eventos de conversa (não é debounce — timer **não reinicia** ao chegar novos eventos):

```
Primeiro evento na janela → abre fila (Set<deal_id>) + inicia timer 10s
Eventos seguintes         → apenas pending.add(deal_id)
Timer expira              → getDealsDetailsBatchAction(ids) → merge único
Próximo evento            → nova janela de 10s
```

- Dedupe grátis via `Set<number>`.
- Após fetch: validar filtros URL por row; `applyDealUpdateToKanban`; re-sort se `sort=last_message`; atualizar `viewingDeal` se aberto no sheet.
- Cleanup do hook: cancelar timer; descartar fila pendente (ou flush opcional).

**Alternativa rejeitada:** debounce trailing — com tráfego contínuo o timer reinicia e pode atrasar flush indefinidamente.

**Alternativa rejeitada:** `deal_id=in.(ids carregados)` — teto de 100 IDs no filter `in` do Realtime; resubscribe a cada load more.

#### 9d. Sincronização de estado parent ↔ Kanban

`DealsKanbanSection` / `DealKanban` mantêm cópia local de colunas derivada de `initialColumns`. Merge realtime no parent **deve** refletir na UI:

- Preferir estado **controlado** (`kanbanColumns` + `onKanbanColumnsChange` no parent) **ou** callback imperativo equivalente.
- Garantir que `applyDealUpdateToKanban` / batch merge atualizem o estado que `DealKanban` renderiza.

#### 9e. Supressão de eco e races com mutations locais

`postgres_changes` não tem self-exclusion: toda mutation do próprio client chega de volta como eco. O handler **não** deve ignorá-los indiscriminadamente (perderia edições concorrentes de outros clientes), mas deve suprimi-los nos dois casos abaixo.

**Mecanismo B — guard por `updated_at` (permanente):**
- Cada `DealRow` no estado local carrega o `updated_at` mais recente conhecido.
- Ao receber qualquer evento UPDATE/INSERT em `deals`, comparar `payload.updated_at` (ou o valor retornado pelo refetch) com o `updated_at` local do card.
- Se `payload.updated_at <= local.updated_at` → ignorar; o estado local já é igual ou mais recente.
- Pré-requisito: `updateDealStageAction`, `updateDealAction` e `updateDealStatusAction` devem retornar `updated_at` além dos campos já presentes (`.select(“..., updated_at”)`); o client armazena esse valor no `DealRow` após cada mutation.
- Cobre tanto o eco imediato quanto a race A→B→C onde o eco de A→B chega tarde.

**Mecanismo C — set in-flight (janela temporária):**
- Entre o momento do update otimista (`t0`) e a resolução da action com `updated_at` real (`t1`), o client ainda não conhece o `updated_at` gravado e não pode aplicar o guard B.
- Manter `inFlightDealIds: Set<number>` no hook de realtime; adicionar `deal_id` ao set **antes** de disparar a action; remover após receber o resultado (`finally`).
- Enquanto `deal_id` está no set, ignorar ecos de UPDATE desse id.
- Cobre apenas a janela `[t0, t1]`; após `t1` o guard B assume.

**Decisão sobre INSERT (create):**
- `createDealAction` usa `router.refresh()` em vez de inserção otimista com id temporário — decisão explícita para evitar duplicata: o eco do INSERT traz o id real e não teria como ser mapeado para um card temporário. Não alterar para optimistic insert sem revisar essa lógica.

**Alternativa rejeitada — source_id por sessão:** carimbar a mutation com id de sessão para filtrar ecos no handler. Exigiria coluna nova no banco e acoplamento schema; se o objetivo fosse self-exclusion por design, `broadcast` seria a ferramenta certa (produto optou por `postgres_changes` explicitamente).

### 10. Padrões UI: oculto vs desabilitado

Seguir o comportamento já simulado na UI — não padronizar tudo como “ocultar”:

| Contexto | Controle | Comportamento |
|----------|----------|----------------|
| Kanban, modo seleção | `DragIndicator` da coluna | **Oculto** (coluna `disabled`; handle sem hover) |
| Kanban, etapa `entry` | `DragIndicator` da coluna | **Oculto** (`locked` no `KanbanColumnHandle`) |
| Modal editar funil, etapa `entry` | `DragIndicator` da linha | **Visível, disabled** |
| Modal editar funil, etapas protegidas | Botão remover (X) | **Visível, disabled** |
| Sem permissão / limite | Botões de ação (criar, excluir, etc.) | **Disabled** com tooltip quando aplicável (padrão `pessoas`) |

### 11. Permissões UI

Conforme `docs/references/roles-and-permissions.md`:

| Ação | Permission |
|------|------------|
| Ver kanban | `deals` `read` (layout já exige feature `deals`) |
| Criar/editar/mover deal | `deals` `create` / `update` |
| Excluir deal | `deals` `delete` |
| Editar funil, etapas, excluir etapa | `pipelines` `update` (e `delete` só se houver ação de remover funil no futuro) |

Botões **disabled** com tooltip quando sem permissão ou limite (não remover do DOM salvo exceção explícita de produto).

### 12. Contagens (`totalCount` / `totalUnfiltered`) — padrão `pessoas`

Mesmo modelo da listagem de pessoas:

| Métrica | Significado no Kanban |
|---------|----------------------|
| `totalUnfiltered` | Deals no funil ativo + modo de visibilidade (`open` ou `won_lost`), **sem** `search`, `tags` nem `owner` |
| `totalCount` | Deals com **todos** os filtros ativos da URL aplicados |

- **Badge do header**: `totalCount` (filtrado).
- **Badge do combobox "Trocar Funil"**: `deal_count` de `pipelines_summary` (macro, todos os status) — ver §1b.
- **Totais por coluna** (`get_deals_count` / `get_deals_won_lost_count`): mesmos filtros da URL que `totalCount`.

Fetch na promise: contagem filtrada + contagem sem filtros de busca/etiqueta/responsável (análogo a `persons_summary` com e sem filtros).

### 13. Empty states

Dois estados distintos; em ambos as **colunas do funil permanecem visíveis** (headers de `pipeline_stages`, corpos vazios ou `hideColumnBody`) com o empty centralizado **abaixo** do board.

1. **`totalUnfiltered === 0`**: empty “Adicione Oportunidades” + CTA criar; **desabilitar** `ButtonSearch` e popover de filtros; infinite scroll desligado.
2. **`totalUnfiltered > 0` e `totalCount === 0`** (inclui `status=won_lost` sem resultados): empty “Sem resultados” + **“Limpar filtros”** que remove `search`, `tags`, `owner`, `status`, `sort` e `order` da URL (volta ao padrão sem params).

Popover de filtros — botão **“Limpar”**: mesmo efeito (remove busca, filtros e ordenação da URL).

### 14. Infinite scroll — fim de lista (global, não por coluna)

Cada `loadMoreDealsAction` ainda pede até **25 deals por etapa** na RPC (`p_offset` / `p_limit`), mas **não** é necessário `hasMore` por coluna.

**Critério único:**

```
totalLoaded = soma dos deals em todas as colunas no estado do client
hasMore     = totalLoaded < totalCount
```

- `totalCount`: total de oportunidades do funil atual com os **mesmos filtros da URL** que alimentam o Kanban (soma de `get_deals_count` ou equivalente no modo `won_lost`) — o mesmo número do badge do header.
- Exemplo: 50 cards na tela e `totalCount === 60` → ainda há 10 para buscar; não importa em qual coluna estão.
- **Não** usar “última resposta retornou &lt; 25 itens em uma coluna” como sinal de fim: após dois lotes uma coluna pode ter 50 cards e outras ainda ter mais pendentes; o offset da RPC é por etapa, mas o critério de parada é global.

Estado auxiliar: `loadGeneration` ou `pageIndex` incrementado a cada load more (offset RPC = `pageIndex * 25` por etapa). Quando `!hasMore`, o observer de scroll não dispara nova action.

Quando `totalUnfiltered === 0`, infinite scroll desligado.

### 15. Tipos de domínio explícitos (não `database.types`)

- `oportunidades/[pipelineId]/types.ts` define `DealRow`, `DealDataResult`, `Pipeline`, `PipelineStage`, `PersonDetails` e unions de UI (`ChannelType`, `ConversationStatus`, `LastMessage`, etc.).
- Campos alinhados ao contrato real de `deals_summary` e ao shape retornado pelas RPCs `get_deals_by_stage` / `get_deals_won_lost` — validar contra docs de schema e `src/lib/database.types.ts` **somente como referência**, sem importar tipos gerados.
- Padrão de fetch/cast igual a `/pessoas`: `(data ?? []) as unknown as DealRow[]`.
- O client Supabase permanece sem `Database` generic; formulários usam Zod (`DealForm`, `DealsFilterForm`), não `TablesInsert<"deals">`.

**Alternativa rejeitada:** `type DealRow = Tables<"deals_summary">` — incompleto para JSON aninhado (`last_message`, `overdue_task`, `tags`) e acoplamento frágil a regeneração do CLI.

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| `postgres_changes` não escala como broadcast | Aceito pelo produto; documentar; monitorar |
| Infinite scroll 25×N colunas = muitas linhas por lote | RPC já limita por stage; debounce load more |
| Exclusão física irreversível | Confirmação modal; guard ids vazio |
| Cookie de funil stale após delete pipeline | Validar no server e redirect |
| Race optimistic vs realtime | Preferir refetch/batch se `updated_at` mais recente; ignorar stale pós-DnD |
| Ruído em `conversations` (account-wide) | Filtro client: só deals carregados; batch 10s reduz fetches |
| Parent vs `DealKanban` state divergente | Estado controlado ou sync explícito (§9d) |
| `DealInfo` grande refactor | Passar deal do kanban primeiro; refetch summary no open |

## Migration Plan

1. Implementar actions + server fetch; remover mocks.
2. Wire forms e sheet.
3. Ativar realtime por último (facilita debug): `getDealsDetailsBatchAction` → hook (`deals` + `conversations`, batch 10s) → merge controlado no parent.
4. Remover `mock-data.ts` e exports mock dos forms.
5. QA manual: troca conta, won_lost, bulk delete guard, limite deals.

Rollback: reverter branch; cookie novo é inofensivo se não lido.

## Open Questions

- Nenhuma bloqueante — permissão de funil: `pipelines` (`update` para editar funil/etapas).
