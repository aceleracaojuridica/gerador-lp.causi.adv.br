## ADDED Requirements

### Requirement: Criar organização com validação de permissão
O sistema SHALL validar permissão `organizations.create` antes de criar uma organização. O form permanece aberto durante o envio.

#### Scenario: Criação bem-sucedida
- **WHEN** o usuário preenche o form com nome válido e submete
- **THEN** o sistema insere a organização na tabela `organizations` com `account_id` da sessão, fecha o form e exibe toast de sucesso

#### Scenario: Falha na criação
- **WHEN** a Server Action retorna erro
- **THEN** o form permanece aberto com os valores intactos e exibe toast de erro

#### Scenario: Sem permissão de criação
- **WHEN** o usuário não tem permissão `organizations.create`
- **THEN** a Server Action retorna `{ success: false, code: 'FORBIDDEN' }` sem executar insert

---

### Requirement: Campo CNPJ com máscara
O sistema SHALL exibir o campo CNPJ com máscara `00.000.000/0001-00` via `react-input-mask`.

#### Scenario: Digitação do CNPJ
- **WHEN** o usuário digita no campo CNPJ
- **THEN** o sistema aplica a máscara automaticamente formatando o número no padrão brasileiro

---

### Requirement: Buscar dados ao editar
O sistema SHALL buscar dados completos da organização ao abrir o form de edição.

#### Scenario: Abertura do form de edição
- **WHEN** o usuário clica em uma linha da tabela para editar
- **THEN** o sistema busca os dados da organização filtrando por `id` e `account_id`, exibe loading state no form enquanto carrega e popula o form com os dados retornados

#### Scenario: Prevenção de IDOR no fetch
- **WHEN** a action é chamada com `id` de organização de outra conta
- **THEN** o sistema retorna `null` (filtro por `account_id`) e o form exibe estado de erro

---

### Requirement: Atualizar organização com optimistic UI
O sistema SHALL aplicar as atualizações otimisticamente na lista ao submeter o form de edição, com rollback automático em caso de falha.

#### Scenario: Atualização bem-sucedida
- **WHEN** o usuário edita e submete com dados válidos
- **THEN** o sistema aplica `useOptimistic` na lista imediatamente, fecha o form, executa a Server Action em background e `revalidatePath` confirma os dados reais

#### Scenario: Falha na atualização — rollback e retry
- **WHEN** a Server Action de update retorna erro
- **THEN** `useOptimistic` reverte para os dados originais automaticamente e exibe toast com ação "Editar novamente"

---

### Requirement: Excluir organizações com optimistic UI e guard de segurança
O sistema SHALL remover organizações da lista otimisticamente, validar que o array de IDs não está vazio e incluir `account_id` na query de deleção.

#### Scenario: Exclusão bem-sucedida
- **WHEN** o usuário confirma a exclusão de uma ou mais organizações
- **THEN** o sistema aplica `useOptimistic` removendo os itens, fecha o dialog de confirmação e executa `deleteOrganizationsAction`

#### Scenario: Falha na exclusão — rollback
- **WHEN** a Server Action de delete retorna erro
- **THEN** `useOptimistic` reverte os itens removidos para a lista e exibe toast de erro

#### Scenario: Guard contra array vazio
- **WHEN** `deleteOrganizationsAction` é chamada com array de IDs vazio
- **THEN** a action retorna `{ success: false, code: 'INVALID_INPUT' }` sem executar query

#### Scenario: Isolamento por conta na deleção
- **WHEN** `deleteOrganizationsAction` executa a query
- **THEN** a query MUST incluir `.eq('account_id', accountId)` além do `.in('id', ids)`

#### Scenario: Desvinculação de pessoas ao excluir organização
- **WHEN** uma organização com pessoas vinculadas é excluída
- **THEN** o banco desvincula as pessoas (`persons.organization_id = NULL`) via constraint — o app não precisa tratar isso manualmente
