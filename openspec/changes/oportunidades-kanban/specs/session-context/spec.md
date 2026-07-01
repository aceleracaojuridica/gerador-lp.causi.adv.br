## ADDED Requirements

### Requirement: Limpar cookie de funil ao trocar conta
O sistema SHALL remover `causi_pipeline` quando o contexto de conta mudar.

#### Scenario: switchAccountAction
- **WHEN** `switchAccountAction` conclui com sucesso
- **THEN** o cookie `causi_pipeline` é deletado

#### Scenario: Acesso a oportunidades após troca
- **WHEN** o usuário navega para `/oportunidades` com cookie ausente após troca de conta
- **THEN** o redirect usa o funil mais antigo da nova conta

### Requirement: Atualização otimista de deals_count
O session context SHALL atualizar `usage.deals_count` após criar ou excluir deals.

#### Scenario: Criação de deal
- **WHEN** `createDealAction` retorna sucesso
- **THEN** o Client Component incrementa `deals_count` via `setSession`

#### Scenario: Exclusão de deals por ids
- **WHEN** `deleteDealsAction` retorna sucesso
- **THEN** o Client Component decrementa `deals_count` pelo número de ids excluídos retornado pela action

#### Scenario: Exclusão em massa ao remover etapa
- **WHEN** `deletePipelineStageAction` exclui deals por `pipeline_stage_id` (opção "excluir oportunidades")
- **THEN** o Client Component decrementa `deals_count` pelo `deleted_count` retornado pela action (pode ser maior que os cards visíveis no Kanban)

#### Scenario: Falha sem alterar usage
- **WHEN** create ou delete falha
- **THEN** `setSession` de usage não é chamado
