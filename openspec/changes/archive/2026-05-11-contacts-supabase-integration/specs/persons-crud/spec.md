## ADDED Requirements

### Requirement: Criar pessoa com validação de permissão e limite
O sistema SHALL validar permissão `persons.create` e limite do plano (`serverIsWithinLimit`) antes de criar um contato. O form permanece aberto durante o envio.

#### Scenario: Criação bem-sucedida
- **WHEN** o usuário preenche o form e submete com dados válidos
- **THEN** o sistema cria a pessoa via RPC `create_person`, fecha o form, exibe toast de sucesso e atualiza `session.usage.persons_count`

#### Scenario: Falha na criação
- **WHEN** a Server Action retorna erro (permissão, limite ou banco)
- **THEN** o form permanece aberto com os valores intactos e exibe toast de erro

#### Scenario: Limite de contatos atingido
- **WHEN** `serverIsWithinLimit(session, 'persons')` retorna false
- **THEN** a Server Action retorna `{ success: false, code: 'LIMIT_REACHED' }` sem executar insert; UI exibe botão de criar desabilitado com tooltip explicativo via `useAccessControl().isWithinLimit('persons')`

#### Scenario: Sem permissão de criação
- **WHEN** o usuário não tem permissão `persons.create`
- **THEN** a Server Action retorna `{ success: false, code: 'FORBIDDEN' }` sem executar insert

---

### Requirement: Upload de foto integrado ao submit
O sistema SHALL realizar o upload de foto dentro da Server Action de criação/atualização, antes de chamar o RPC, usando o bucket `media` com path `{accountId}/persons/{personId}/{uuid}-{ts}.{ext}`.

#### Scenario: Criação com foto
- **WHEN** o usuário seleciona uma foto e submete o form de criação
- **THEN** o sistema faz upload do arquivo para o bucket `media`, obtém a URL pública e passa como `p_photo` ao RPC `create_person`

#### Scenario: Atualização com troca de foto
- **WHEN** o usuário troca a foto no form de edição e submete
- **THEN** o sistema faz upload da nova foto, obtém a URL pública, chama RPC `update_person` com a nova URL e tenta remover a foto antiga do bucket (best-effort)

#### Scenario: Arquivo inválido (tamanho ou tipo)
- **WHEN** o arquivo selecionado excede 10MB ou não é JPEG/PNG/WebP
- **THEN** a Server Action retorna erro de validação e o form permanece aberto

---

### Requirement: Buscar detalhes completos ao editar
O sistema SHALL buscar dados completos da pessoa (telefones, e-mails, sociais, organização) via Server Action ao abrir o form de edição.

#### Scenario: Abertura do form de edição
- **WHEN** o usuário clica em uma linha da tabela para editar
- **THEN** o sistema chama `getPersonDetailsAction(id)` com `account_id` da sessão, exibe loading state no form enquanto carrega e popula o form com os dados completos retornados

#### Scenario: Prevenção de IDOR no fetch de detalhes
- **WHEN** `getPersonDetailsAction` é chamada com um `id` de pessoa de outra conta
- **THEN** o sistema retorna `null` (filtro por `account_id` na query) e o form exibe estado de erro

---

### Requirement: Atualizar pessoa com optimistic UI
O sistema SHALL aplicar as atualizações otimisticamente na lista ao submeter o form de edição, com rollback automático em caso de falha.

#### Scenario: Atualização bem-sucedida
- **WHEN** o usuário edita e submete com dados válidos
- **THEN** o sistema aplica `useOptimistic` na lista imediatamente, fecha o form, executa a Server Action em background, `revalidatePath` confirma os dados reais

#### Scenario: Falha na atualização — rollback e retry
- **WHEN** a Server Action de update retorna erro
- **THEN** `useOptimistic` reverte para os dados originais automaticamente, exibe toast de erro com ação "Editar novamente" que reabre o form com os valores originais da pessoa

---

### Requirement: Excluir pessoas com optimistic UI e guard de segurança
O sistema SHALL remover pessoas da lista otimisticamente, validar que o array de IDs não está vazio e incluir `account_id` na query de deleção.

#### Scenario: Exclusão bem-sucedida
- **WHEN** o usuário confirma a exclusão de uma ou mais pessoas
- **THEN** o sistema aplica `useOptimistic` removendo os itens, fecha o dialog de confirmação, executa `deletePersonsAction`, `revalidatePath` confirma e `session.usage.persons_count` é decrementado

#### Scenario: Falha na exclusão — rollback
- **WHEN** a Server Action de delete retorna erro
- **THEN** `useOptimistic` reverte os itens removidos para a lista e exibe toast de erro

#### Scenario: Guard contra array vazio
- **WHEN** `deletePersonsAction` é chamada com array de IDs vazio
- **THEN** a action retorna `{ success: false, code: 'INVALID_INPUT' }` sem executar nenhuma query no banco

#### Scenario: Isolamento por conta na deleção
- **WHEN** `deletePersonsAction` executa a query de deleção
- **THEN** a query MUST incluir `.eq('account_id', accountId)` além do `.in('id', ids)`
