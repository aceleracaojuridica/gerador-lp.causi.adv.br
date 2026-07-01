## ADDED Requirements

### Requirement: Criar oportunidade
O sistema SHALL criar deals via Server Action com validação Zod, permissão e limite de plano.

#### Scenario: Criação válida
- **WHEN** o usuário submete o modal "+ Nova Oportunidade" com pessoa e etapa obrigatórias
- **THEN** a action insere em `deals`, sincroniza `deals_tags` se houver, respeita trigger de limite e retorna o deal criado; o Kanban exibe o novo card

#### Scenario: Pessoa já vinculada no funil
- **WHEN** a pessoa selecionada já possui deal no mesmo `pipeline_id`
- **THEN** a action retorna erro e o formulário permanece aberto com mensagem clara

#### Scenario: Sem permissão ou limite
- **WHEN** o usuário não tem `deals` create ou `isWithinLimit('deals')` é falso
- **THEN** o botão de criar está desabilitado na UI e a action retorna erro se invocada diretamente

#### Scenario: Atualização de usage na sessão
- **WHEN** a criação tem sucesso
- **THEN** o client incrementa `session.usage.deals_count` via `setSession`

### Requirement: Editar oportunidade
O sistema SHALL atualizar deals existentes exceto troca de pessoa.

#### Scenario: Edição válida
- **WHEN** o usuário edita etapa, etiquetas, valor, origem, responsável ou informações adicionais
- **THEN** a action atualiza `deals` e `deals_tags`; campo pessoa permanece disabled

#### Scenario: Deal bloqueado
- **WHEN** o deal possui `blocked_at` preenchido
- **THEN** a UI exibe ícone de cadeado e bloqueia edição via formulário, mas permite mover o card

### Requirement: Excluir oportunidade
O sistema SHALL excluir fisicamente deals com proteção contra delete em massa acidental.

> **Escopo desta action:** exclusão por **lista explícita de ids** (card, sheet, modo seleção). Exclusão ao remover etapa do funil usa `deletePipelineStageAction` por `pipeline_stage_id` (ver `pipeline-kanban-controls`).

#### Scenario: Exclusão unitária
- **WHEN** o usuário confirma exclusão de um card
- **THEN** a action executa `DELETE` com `.eq('account_id', accountId)` e `.in('id', ids)`

#### Scenario: Exclusão em massa
- **WHEN** o usuário seleciona múltiplos cards e confirma exclusão no header
- **THEN** a mesma action recebe todos os ids selecionados

#### Scenario: Array vazio
- **WHEN** `deleteDealsAction` é chamada com `ids` vazio
- **THEN** retorna erro imediato sem executar query no banco

#### Scenario: Decremento de usage
- **WHEN** a exclusão tem sucesso
- **THEN** o client decrementa `deals_count` pelo número de deals removidos

### Requirement: Mover oportunidades
O sistema SHALL mover deals para outro funil/etapa via modal ou modo seleção.

#### Scenario: Mover via modal
- **WHEN** o usuário escolhe funil e etapa no `DealMoveForm` e confirma
- **THEN** a action atualiza `deals.pipeline_id` e `deals.pipeline_stage_id`

#### Scenario: Mover de won/lost para open
- **WHEN** um deal com status `won` ou `lost` é movido para etapa de funil aberto
- **THEN** a action define `status = open` e zera `won_time` e `lost_time`

#### Scenario: Modo won_lost sem DnD entre etapas reais
- **WHEN** `status=won_lost` na página
- **THEN** não é possível arrastar cards entre colunas; mover só via modal de seleção em massa ou unitário pelo header

### Requirement: Atualizar status won/lost/open
O sistema SHALL atualizar status e timestamps de qualificação.

#### Scenario: Marcar como ganho
- **WHEN** o status passa para `won`
- **THEN** `won_time` recebe timestamp atual

#### Scenario: Marcar como perdido
- **WHEN** o status passa para `lost`
- **THEN** `lost_time` recebe timestamp atual

#### Scenario: Reabrir
- **WHEN** o status passa para `open`
- **THEN** `won_time` e `lost_time` são resetados

### Requirement: Permissões na UI
Botões e menus de CRUD SHALL respeitar `useAccessControl()`.

#### Scenario: Sem permissão de delete
- **WHEN** `hasPermission('deals', 'delete')` é falso
- **THEN** ações de excluir permanecem visíveis porém **disabled**, com feedback coerente ao padrão de `pessoas` (tooltip quando aplicável)

#### Scenario: Sem permissão de create
- **WHEN** `hasPermission('deals', 'create')` é falso ou `isWithinLimit('deals')` é falso
- **THEN** o botão "+ Nova Oportunidade" fica **disabled** (não oculto)
