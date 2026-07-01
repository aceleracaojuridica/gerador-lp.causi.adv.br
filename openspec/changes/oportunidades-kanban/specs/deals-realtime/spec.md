## ADDED Requirements

### Requirement: Sincronização Realtime de deals
O Kanban SHALL refletir INSERT, UPDATE e DELETE em `deals` sem reload completo da página.

#### Scenario: Nova oportunidade
- **WHEN** outro cliente ou processo insere um deal no funil visível
- **THEN** o card aparece na coluna correta respeitando filtros ativos (ou é ignorado se não passar nos filtros)

#### Scenario: Atualização de deal
- **WHEN** um deal visível é atualizado (etapa, status, campos do card)
- **THEN** o card na UI é atualizado ou movido de coluna

#### Scenario: Exclusão
- **WHEN** um deal visível é excluído
- **THEN** o card é removido do Kanban imediatamente, sem aguardar batch de conversas

#### Scenario: Subscription lifecycle
- **WHEN** o componente desmonta ou o `pipelineId` muda
- **THEN** o canal `postgres_changes` é removido (cleanup), incluindo cancelamento do timer de batch pendente

### Requirement: Sincronização de preview de conversa no card
O Kanban SHALL refletir alterações em `conversations` que afetam campos do card derivados de `deals_summary` (`last_message`, `new_messages`, `conversation_status`), sem reload completo.

#### Scenario: Nova mensagem em conversa vinculada
- **WHEN** chega UPDATE em `conversations` (ex.: `last_message_at` após INSERT em `messages`) e o deal correspondente está carregado no Kanban
- **THEN** o `deal_id` é enfileirado para refetch em batch; após a janela de coleta, o card é atualizado via `deals_summary`

#### Scenario: Conversa sem deal ou deal não carregado
- **WHEN** chega evento de `conversations` cujo deal não está em `kanbanColumns`
- **THEN** o evento é ignorado (sem fetch)

#### Scenario: Chat dedicado (non-goal desta capability)
- **WHEN** o usuário visualizar mensagens em tempo real no sheet/inbox
- **THEN** isso SHALL usar subscription própria em `messages` (fora do escopo desta spec)

### Requirement: Subscriptions postgres_changes
O client SHALL usar um canal Realtime com listeners separados para `deals` e `conversations`.

#### Scenario: Filtro de deals
- **WHEN** a subscription é criada
- **THEN** `deals` usa filter `pipeline_id=eq.{pipelineId}`

#### Scenario: Filtro de conversations
- **WHEN** a subscription é criada
- **THEN** `conversations` usa filter `account_id=eq.{accountId}` (sem filter `deal_id=in.(...)`)

### Requirement: Filtro por conta e funil
Handlers Realtime SHALL ignorar eventos de outras contas ou funis.

#### Scenario: Evento de outro funil
- **WHEN** chega evento de `deals` com `pipeline_id` diferente do funil aberto
- **THEN** o evento é ignorado

#### Scenario: Validação de account
- **WHEN** chega payload de deal ou resultado de refetch
- **THEN** o handler valida `account_id` contra `session.account.id` antes de mutar estado

#### Scenario: Filtros da URL após refetch
- **WHEN** um deal refetchado não passa nos filtros ativos da URL
- **THEN** o card é removido do Kanban se estava visível, ou permanece ausente se era novo

### Requirement: Batch fetch com janela fixa
Refetches disparados por eventos em `conversations` SHALL ser coalescidos em uma única query por janela de tempo.

#### Scenario: Coleta na janela
- **WHEN** o primeiro evento de conversa enfileira um `deal_id` na janela ativa
- **THEN** inicia timer de 10 segundos que **não** reinicia ao chegar eventos subsequentes na mesma janela

#### Scenario: Flush da janela
- **WHEN** o timer de 10 segundos expira
- **THEN** o client chama `getDealsDetailsBatchAction` com todos os `deal_id` deduplicados da fila e faz merge único no estado das colunas

#### Scenario: Dedupe na fila
- **WHEN** múltiplos eventos na mesma janela referem o mesmo `deal_id`
- **THEN** apenas um refetch desse deal ocorre no flush

### Requirement: Supressão de eco de mutations locais
O handler realtime SHALL ignorar eventos que representam o reflexo da própria mutation do cliente, sem suprimir edições concorrentes de outros clientes.

#### Scenario: Eco de UPDATE suprimido por updated_at (guard B)
- **WHEN** chega evento UPDATE em `deals` e `payload.updated_at <= DealRow.updated_at` no estado local
- **THEN** o evento é ignorado sem alterar o estado do Kanban

#### Scenario: Eco durante janela in-flight (guard C)
- **WHEN** chega evento UPDATE em `deals` para um `deal_id` presente em `inFlightDealIds`
- **THEN** o evento é ignorado sem alterar o estado; o set é limpo após a action resolver

#### Scenario: Edição externa concorrente não é suprimida
- **WHEN** chega evento UPDATE de outro cliente com `payload.updated_at > DealRow.updated_at` e o deal não está em `inFlightDealIds`
- **THEN** o card é atualizado normalmente com o payload/refetch mais recente

#### Scenario: Eco de INSERT não gera duplicata
- **WHEN** um deal é criado via `createDealAction` (que usa `router.refresh()`, não insert otimista)
- **THEN** o eco do INSERT realtime é tratado como novo card externo; não há card temporário para deduplicar

### Requirement: Actions retornam updated_at
Mutations que geram eco SHALL retornar `updated_at` para viabilizar o guard B.

#### Scenario: updated_at disponível após mutation
- **WHEN** `updateDealStageAction`, `updateDealAction` ou `updateDealStatusAction` retorna com sucesso
- **THEN** o resultado inclui `updated_at` e o client armazena esse valor no `DealRow` local correspondente

### Requirement: Reconciliação com deals_summary quando necessário
Quando o payload do evento for insuficiente para renderizar o card, o sistema SHALL buscar deal completo.

#### Scenario: Payload parcial em deals
- **WHEN** evento em `deals` não traz campos exigidos pelo card (ex.: `last_message`, `tags`)
- **THEN** o client busca via `getDealDetailsAction` ou batch equivalente e faz merge no estado das colunas

#### Scenario: Batch após conversations
- **WHEN** a janela de batch expira com um ou mais `deal_id` enfileirados
- **THEN** o client busca via `getDealsDetailsBatchAction` (`.in('id', ids)` em `deals_summary` + `account_id`)
