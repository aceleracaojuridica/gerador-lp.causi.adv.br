## ADDED Requirements

### Requirement: Listar funis para troca
O header SHALL listar funis da conta no combobox "Trocar Funil".

#### Scenario: Combobox de funis
- **WHEN** o usuário abre o combobox
- **THEN** o sistema lista funis da conta via `pipelines_summary` (`id`, `name`, `deal_count`), ordenados por `created_at ASC`

#### Scenario: Badge de contagem no combobox
- **WHEN** cada funil é exibido no combobox
- **THEN** o badge usa `deal_count` da view — total macro de oportunidades do funil (todos os status, sem filtros de URL), distinto do badge filtrado do header da página ativa

### Requirement: Permissão para editar funil
Ações de editar funil e etapas SHALL exigir `hasPermission('pipelines', 'update')` na UI e `serverHasPermission(session, 'pipelines', 'update')` nas Server Actions.

#### Scenario: Sem permissão de update em pipelines
- **WHEN** o usuário não tem `pipelines` `update`
- **THEN** o botão "Editar Funil" fica **disabled** com feedback adequado

### Requirement: Editar funil atual
O usuário SHALL editar apenas o funil exibido via modal "Editar Funil".

#### Scenario: Carregar funil para edição
- **WHEN** o usuário abre o modal "Editar Funil"
- **THEN** o `PipelineForm` carrega dados via `getPipelineDetailsAction` (funil, etapas e responsável)

#### Scenario: Salvar alterações
- **WHEN** o usuário altera nome, responsável, etapas (adicionar, renomear, cor, reordenar) e clica Salvar
- **THEN** a Server Action chama RPC `update_pipeline` com JSON de stages e a página reflete mudanças após sucesso

#### Scenario: Reordenar etapas no modal
- **WHEN** o usuário reordena etapas dentro do modal
- **THEN** a ordem só persiste após Salvar (não chama API a cada drag)

#### Scenario: Não criar funil novo
- **WHEN** o usuário busca fluxo de criação de funil
- **THEN** esta change não implementa criação — apenas edição do funil ativo

### Requirement: Excluir etapa com confirmação imediata
A remoção de etapa no modal de edição SHALL sempre passar por modal de confirmação e aplicar imediatamente.

#### Scenario: Abrir confirmação
- **WHEN** o usuário clica "X" em uma etapa removível no modal de edição
- **THEN** abre `DeletePipelineStageForm` com contagem via `getPipelineStageDealsCountAction` (por `pipeline_stage_id` + `account_id`, não apenas cards visíveis no Kanban)

#### Scenario: Confirmar com mover deals
- **WHEN** o usuário escolhe mover oportunidades para outra etapa e confirma
- **THEN** a `deletePipelineStageAction` recebe `pipeline_stage_id` da etapa removida (não lista de ids visíveis no Kanban) e atualiza **todos** os deals com esse `pipeline_stage_id` para a etapa destino, com `.eq('account_id', accountId)`; em seguida remove a etapa e atualiza o Kanban mesmo se o usuário depois cancelar o modal pai de edição

#### Scenario: Confirmar com excluir deals
- **WHEN** o usuário escolhe excluir oportunidades da etapa e confirma
- **THEN** a `deletePipelineStageAction` exclui **todos** os deals da etapa via `pipeline_stage_id` + `account_id` (não via array de ids do client), pois o Kanban pode exibir apenas 25 cards enquanto a etapa tem mais oportunidades; em seguida remove a etapa

#### Scenario: Guards na exclusão de etapa
- **WHEN** `deletePipelineStageAction` é invocada
- **THEN** valida `pipeline_stage_id` e `account_id` (etapa pertence ao funil/conta da sessão); nunca usa array vazio de ids como critério de delete em massa da conta

#### Scenario: Etapas protegidas — botão remover
- **WHEN** a etapa é do tipo `entry`, `qualified` ou `disqualified`
- **THEN** o botão remover (X) permanece visível porém **disabled**, como no `PipelineForm` atual

#### Scenario: Etapa entry — drag no modal
- **WHEN** a etapa é do tipo `entry` no modal de edição de funil
- **THEN** o `DragIndicator` da linha permanece visível porém **disabled** (reordenação bloqueada)

### Requirement: Reordenar etapa pelo Kanban
Reordenar colunas no board SHALL atualizar ordem após drop bem-sucedido (ver spec `deals-kanban`).

#### Scenario: Consistência com modal
- **WHEN** etapas foram reordenadas no board e depois o usuário abre o modal de edição
- **THEN** o modal reflete a ordem persistida no banco
