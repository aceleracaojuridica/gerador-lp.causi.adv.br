## MODIFIED Requirements

### Requirement: Atualização otimista de usage após mutation
O session context SHALL ser atualizado via `setSession` após mutations que afetam contadores de usage, incluindo `persons_count` após criar ou excluir pessoas.

#### Scenario: Criação de pessoa incrementa persons_count
- **WHEN** `createPersonAction` retorna sucesso
- **THEN** o Client Component chama `setSession(prev => ({ ...prev, usage: { ...prev.usage, persons_count: prev.usage.persons_count + 1 } }))`

#### Scenario: Exclusão de pessoas decrementa persons_count
- **WHEN** `deletePersonsAction` retorna sucesso
- **THEN** o Client Component chama `setSession` decrementando `persons_count` pelo número de pessoas excluídas

#### Scenario: Rollback não altera persons_count
- **WHEN** a Server Action de create ou delete falha e ocorre rollback da UI
- **THEN** `setSession` NÃO é chamado e `persons_count` permanece com o valor original
