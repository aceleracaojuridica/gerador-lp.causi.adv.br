## ADDED Requirements

### Requirement: Roteamento e cookie do funil ativo
O sistema SHALL persistir o funil ativo no cookie HTTP-only `causi_pipeline` e redirecionar `/oportunidades` para um funil válido da conta.

#### Scenario: Acesso a /oportunidades sem pipelineId
- **WHEN** o usuário acessa `/oportunidades` sem segmento de funil
- **THEN** o sistema lê `causi_pipeline`; se válido para `session.account.id`, redireciona para `/oportunidades/{id}`; senão redireciona para o funil mais antigo da conta (`created_at ASC`, primeiro registro)

#### Scenario: Conta sem funil (edge case)
- **WHEN** não existe nenhum pipeline para `session.account.id` (cenário raro; banco garante funil em contas normais)
- **THEN** o sistema redireciona para `/funis` conforme `kanban.md`

#### Scenario: PipelineId inválido ou de outra conta
- **WHEN** o usuário acessa `/oportunidades/{pipelineId}` com id inexistente ou de outra conta
- **THEN** o sistema aplica a mesma lógica de fallback (cookie válido ou funil mais antigo) e redireciona

#### Scenario: Acesso válido grava cookie
- **WHEN** o usuário acessa `/oportunidades/{pipelineId}` com funil válido na conta ativa
- **THEN** o client chama `setPipelineCookieAction` ao montar a página e grava `causi_pipeline` com esse id

#### Scenario: Sidebar com funil ativo
- **WHEN** o layout da aplicação renderiza a sidebar
- **THEN** o link de Oportunidades aponta para `/oportunidades/{id}` quando `causi_pipeline` está definido (`dealsPath` + `dealsHref`)

#### Scenario: Troca de funil no header
- **WHEN** o usuário seleciona outro funil no combobox "Trocar Funil"
- **THEN** o sistema navega para `/oportunidades/{novoId}` preservando params de busca/filtros/ordenação aplicáveis e atualiza `causi_pipeline`

### Requirement: Fetch inicial server-side do Kanban
A página `/oportunidades/[pipelineId]` SHALL validar o funil e carregar etapas de forma bloqueante; deals e contagens via promise assíncrona consumida no client com `<Suspense>` (padrão `/pessoas`).

#### Scenario: Modo open (padrão)
- **WHEN** `status` está ausente ou é `open`
- **THEN** o Server Component busca etapas em `pipeline_stages` e deals via RPC `get_deals_by_stage` com offset 0 e limit 25 por etapa, mapeando `sort`/`order` da URL para colunas da RPC

#### Scenario: Modo won_lost
- **WHEN** `status=won_lost` na URL
- **THEN** o Server Component busca deals via RPC `get_deals_won_lost` e renderiza apenas duas colunas estáticas (Ganhos e Perdidos), ocultando etapas reais do funil; infinite scroll e totais por coluna seguem o mesmo padrão (25 por coluna + contagens agregadas)

#### Scenario: Contagem no header (filtrada)
- **WHEN** a página carrega com sucesso
- **THEN** o badge do header exibe `totalCount`: total de oportunidades do funil com **todos** os filtros ativos da URL (`search`, `tags`, `owner`, `status`), via soma de `get_deals_count` (modo `open`) ou `get_deals_won_lost_count` (modo `won_lost`) — mesmo critério da badge em `/pessoas`

#### Scenario: Contagem sem filtros de busca (`totalUnfiltered`)
- **WHEN** o Server Component prepara props para o client
- **THEN** também calcula `totalUnfiltered`: deals no funil e modo de visibilidade atual **sem** `search`, `tags` nem `owner` (análogo a `totalUnfiltered` em `/pessoas`)

#### Scenario: Totais por coluna (além dos cards visíveis)
- **WHEN** uma coluna exibe até 25 cards por infinite scroll
- **THEN** o badge de contagem e o valor monetário no header da coluna usam os mesmos filtros da URL que `totalCount` (via `get_deals_count` por `pipeline_stage_id`), não apenas a soma dos cards carregados na UI

#### Scenario: Ordenação padrão sem URL
- **WHEN** `sort` e `order` estão ausentes da URL
- **THEN** o fetch usa ordenação padrão equivalente a última interação descendente (`last_message` / RPC `last_message created_at` + `desc`) sem gravar params na URL

#### Scenario: Formato de etiquetas na URL
- **WHEN** filtros de etiquetas estão ativos
- **THEN** a URL usa `tags` como lista de ids separados por vírgula (ex.: `tags=1,2,3`) compatível com `p_tags` das RPCs

### Requirement: Busca e filtros via URL
O sistema SHALL sincronizar busca, filtros e ordenação com query params sem param de paginação.

#### Scenario: Busca por nome da pessoa
- **WHEN** o usuário digita no `ButtonSearch` (debounce nativo)
- **THEN** a URL inclui `search=<termo>` e o fetch usa `p_search_person_name` na RPC

#### Scenario: Filtros aplicados no popover
- **WHEN** o usuário seleciona etiquetas, responsável (UUID) ou visibilidade e clica "Aplicar"
- **THEN** a URL inclui `tags`, `owner` e/ou `status` conforme seleção

#### Scenario: Limpar no popover de filtros
- **WHEN** o usuário clica "Limpar" **dentro** do popover de filtros
- **THEN** a URL remove `search`, `tags`, `owner`, `status`, `sort` e `order` (ordenação padrão sem params na URL), conforme `kanban.md`

#### Scenario: Limpar filtros no empty state (sem resultados)
- **WHEN** `totalUnfiltered > 0`, `totalCount === 0` (incluindo `status=won_lost` sem matches) e o usuário clica "Limpar filtros" no empty state
- **THEN** a URL remove `search`, `tags`, `owner`, `status`, `sort` e `order` (volta ao padrão sem params de filtro nem ordenação)

#### Scenario: Ordenação
- **WHEN** o usuário escolhe ordenar por última interação, criação ou prazo de tarefa no popover de filtros
- **THEN** a URL inclui `sort` e `order` (mapear valores do form, hoje `order_by` interno, para `sort` na URL); clicar novamente na mesma opção alterna `asc`/`desc`

#### Scenario: Filtros só ao aplicar
- **WHEN** o usuário altera campos no popover de filtros sem clicar "Aplicar"
- **THEN** a URL e o fetch não mudam até confirmar (busca no header continua com debounce próprio)

### Requirement: Infinite scroll (lote por etapa, parada global)
O sistema SHALL carregar mais deals ao scroll global em lotes de até 25 por etapa (RPC), sem param de paginação na URL. O critério de “ainda há mais” é **global**: `totalLoaded < totalCount`.

#### Scenario: Primeira carga
- **WHEN** a página abre
- **THEN** cada coluna exibe até 25 deals retornados pela RPC inicial

#### Scenario: Carregar mais
- **WHEN** o usuário scrolla até o fim do board e `totalLoaded < totalCount`
- **THEN** o client chama `loadMoreDealsAction` com offset incrementado (+25 por etapa na RPC) e faz append nos arrays de cada coluna

#### Scenario: Fim da lista
- **WHEN** `totalLoaded >= totalCount` (mesmos filtros da URL que o badge do header)
- **THEN** o infinite scroll não dispara novos fetches

#### Scenario: Exemplo global
- **WHEN** o Kanban soma 50 cards em todas as colunas e `totalCount` é 60
- **THEN** ainda há mais um load; não é necessário `hasMore` por coluna

#### Scenario: Sem oportunidades cadastradas
- **WHEN** `totalUnfiltered === 0`
- **THEN** infinite scroll permanece desativado

#### Scenario: Loading do shell da rota
- **WHEN** o usuário navega para `/oportunidades/[pipelineId]`
- **THEN** `loading.tsx` global exibe spinner apenas até o shell inicial (fase 1: pipeline + etapas + client mount)

#### Scenario: Loading dos dados do Kanban
- **WHEN** a promise de deals ainda não resolveu ou `nav.isFetching` após troca de URL
- **THEN** o client exibe `DealsKanbanSkeleton` (colunas da fase 1, corpos em skeleton) via `<Suspense>` fallback ou estado de fetching

#### Scenario: Loading de load more
- **WHEN** o usuário dispara infinite scroll com `totalLoaded < totalCount`
- **THEN** exibe overlay inferior de loading até a action concluir

### Requirement: Drag-and-drop de oportunidades (modo open)
No modo `open`, o usuário SHALL mover cards entre colunas com optimistic UI.

#### Scenario: Drop bem-sucedido
- **WHEN** o usuário solta um card em outra etapa
- **THEN** a UI atualiza via `useOptimistic` imediatamente e a Server Action atualiza `deals.pipeline_stage_id` sem alterar `deals.order`

#### Scenario: Ordem visual após drop
- **WHEN** o drop de oportunidade conclui com sucesso
- **THEN** os cards da coluna destino são reordenados conforme `sort`/`order` ativos da página (não pela posição transitória do drag)

#### Scenario: Falha no servidor
- **WHEN** a Server Action falha após drop
- **THEN** a UI reverte ao estado anterior e exibe toast de erro

#### Scenario: Modo won_lost sem DnD
- **WHEN** `status=won_lost`
- **THEN** drag-and-drop de oportunidades e etapas está desabilitado

### Requirement: Drag-and-drop de etapas (modo open)
No modo `open`, o usuário SHALL reordenar colunas exceto a etapa `entry`.

#### Scenario: Reordenar etapa
- **WHEN** o usuário reordena uma coluna e conclui o drop
- **THEN** a UI atualiza optimisticamente e a Server Action persiste apenas `pipeline_stages.order` da etapa movida

#### Scenario: Etapa entry fixa
- **WHEN** a etapa é do tipo `entry`
- **THEN** ela permanece primeira e não aceita drop de outras etapas antes dela

### Requirement: Modo de seleção
O sistema SHALL permitir seleção múltipla de cards conforme `docs/features/deals-kanban.md`.

#### Scenario: Ativar seleção
- **WHEN** o usuário escolhe "Selecionar" no submenu do card
- **THEN** a página entra em modo seleção: checkboxes nos cards, checkbox por coluna, header com ações em massa, DnD desativado e `DragIndicator` das colunas **oculto** (não exibido)

#### Scenario: Indicador de arraste das colunas fora do modo seleção
- **WHEN** o modo seleção não está ativo e a coluna não é do tipo `entry`
- **THEN** o `DragIndicator` da coluna segue o padrão atual (visível no hover do header da coluna)

#### Scenario: Coluna entry no Kanban
- **WHEN** a coluna representa etapa do tipo `entry`
- **THEN** o `DragIndicator` da coluna permanece **oculto** (`locked`), independente do modo seleção

#### Scenario: Toggle por clique
- **WHEN** o modo seleção está ativo e o usuário clica em um card
- **THEN** o card entra ou sai da seleção sem abrir o sheet

#### Scenario: Encerrar seleção
- **WHEN** nenhum card permanece selecionado
- **THEN** o modo seleção encerra e o header volta ao padrão

#### Scenario: Limpar seleção manualmente
- **WHEN** o modo seleção está ativo e o usuário clica "Limpar seleção" no header
- **THEN** todos os cards são desmarcados e o modo seleção encerra

### Requirement: Empty states
O sistema SHALL exibir dois empty states distintos, no padrão de `/pessoas`.

#### Scenario: Nenhuma oportunidade cadastrada no funil
- **WHEN** `totalUnfiltered === 0` (sem filtros de busca/etiqueta/responsável)
- **THEN** exibe colunas do funil visíveis (vazias) e empty "Adicione Oportunidades" com CTA abaixo do board; **busca e filtros desabilitados**

#### Scenario: Filtros ativos sem resultados
- **WHEN** `totalUnfiltered > 0` e `totalCount === 0` (incluindo visibilidade `won_lost`)
- **THEN** exibe colunas visíveis (vazias) e empty "Sem resultados" com botão "Limpar filtros" abaixo do board

#### Scenario: Erro de query
- **WHEN** o fetch falha
- **THEN** o client exibe estado de erro sem perder header e abas; busca e ações principais desabilitadas como em `/pessoas`

### Requirement: Abas de navegação
As abas Oportunidades, Funis de vendas e Etiquetas SHALL permanecer visíveis na página de oportunidades.

#### Scenario: Links das abas
- **WHEN** o usuário visualiza o Kanban
- **THEN** as abas linkam para `/oportunidades/...`, `/funis` e `/etiquetas` respectivamente sem exigir implementação nova dessas rotas nesta change

### Requirement: Tipos de domínio explícitos para deals
O Kanban SHALL usar tipos definidos em `oportunidades/[pipelineId]/types.ts` alinhados ao contrato de `deals_summary` e das RPCs de listagem, sem importar tipos gerados do Supabase.

#### Scenario: Definição de `DealRow`
- **WHEN** o código tipa deals do Kanban, sheet ou realtime
- **THEN** usa `DealRow` (e tipos auxiliares no mesmo arquivo), não `Tables<"deals_summary">`, `Database` ou outros helpers de `src/lib/database.types.ts`

#### Scenario: Referência ao schema gerado
- **WHEN** um desenvolvedor precisa conferir nomes ou nullability de colunas
- **THEN** pode consultar `database.types.ts` ou docs de banco apenas como referência; o arquivo gerado não é importado no código da feature

#### Scenario: Cast após fetch Supabase
- **WHEN** o Server Component ou Server Action recebe dados de `deals_summary` ou RPC via SDK
- **THEN** normaliza para `DealRow[]` com cast explícito (`as unknown as DealRow[]`), no mesmo padrão de `PersonRow` em `/pessoas`
