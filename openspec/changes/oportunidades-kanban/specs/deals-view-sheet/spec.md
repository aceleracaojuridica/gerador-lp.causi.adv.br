## ADDED Requirements

### Requirement: Abrir sheet com deal selecionado
O sistema SHALL exibir detalhes da oportunidade em sheet lateral usando dados de `deals_summary`.

#### Scenario: Clique no card
- **WHEN** o usuário clica em um card fora do modo seleção
- **THEN** o sheet abre imediatamente com dados otimistas do Kanban e reconcilia via `getDealDetailsAction` (`deals_summary` no servidor, filtrado por `account_id`)

#### Scenario: Submenu Visualizar
- **WHEN** o usuário escolhe "Visualizar" no submenu do card
- **THEN** o mesmo sheet abre para aquele deal

### Requirement: Ações no sheet
O sheet SHALL oferecer atalhos para editar deal, editar pessoa e excluir deal.

#### Scenario: Editar oportunidade
- **WHEN** o usuário clica no ícone de editar oportunidade no sheet
- **THEN** abre o modal `DealForm` em modo edição para o deal atual

#### Scenario: Editar pessoa
- **WHEN** o usuário clica em editar pessoa
- **THEN** abre o fluxo/modal de pessoa vinculado ao `person_id` do deal

#### Scenario: Excluir
- **WHEN** o usuário confirma exclusão no sheet
- **THEN** executa `deleteDealsAction` e fecha o sheet

### Requirement: Toggle de status sem confirmação
O usuário SHALL alterar status won/lost/open diretamente no sheet.

#### Scenario: Alterar status
- **WHEN** o usuário clica no controle de status no sheet
- **THEN** a Server Action atualiza `deals.status` e timestamps conforme regras de won/lost/open sem modal de confirmação

### Requirement: Dados de contato da pessoa
O sheet SHALL carregar detalhes de contato da pessoa vinculada via servidor.

#### Scenario: Exibir contato
- **WHEN** o sheet abre com um deal que possui `person_id`
- **THEN** o client chama `getDealPersonDetailsAction` e exibe telefones, e-mails e redes sociais

### Requirement: Estados de carregamento no sheet
O `DealInfo` SHALL exibir `LoadingOverlay` no painel enquanto o deal ou os dados de contato da pessoa estiverem carregando.

#### Scenario: Loading do deal
- **WHEN** o sheet está aguardando `getDealDetailsAction`
- **THEN** exibe `LoadingOverlay` no painel do deal, inclusive quando `deal` ainda é `null` (ex.: deep link)

#### Scenario: Loading da pessoa
- **WHEN** o deal já foi carregado e `getDealPersonDetailsAction` está em andamento
- **THEN** exibe o mesmo `LoadingOverlay` no painel (`isLoading || isLoadingPerson`)

### Requirement: Placeholders de tarefas e chat
As seções de tarefas e conversa SHALL permanecer visíveis como placeholder.

#### Scenario: Aba tarefas
- **WHEN** o sheet está aberto
- **THEN** a aba de tarefas permanece visível sem implementar listagem/criação de tarefas

#### Scenario: Área de chat
- **WHEN** o sheet está aberto
- **THEN** a área de conversa exibe o empty state existente ("Nenhuma conversa foi iniciada ainda")

### Requirement: Parâmetro de URL `deal`
O parâmetro `deal` na URL SHALL ser atualizado em background para deep link e histórico do browser. A abertura e o fechamento do sheet são controlados por **estado local** (`isDealSheetOpen`); a URL **não** é a fonte de verdade da UI no dia a dia. Implementação via `buildDealsListUrl` + `useSearchParams` — **sem `nuqs`**. O param **não** entra em `DealsQuery` nem no fetch RSC.

#### Scenario: Abrir deal atualiza a URL em background
- **WHEN** o usuário abre o sheet por clique no card ou submenu "Visualizar"
- **THEN** o sheet abre imediatamente no estado local e a URL recebe `?deal={id}` via `router.push`, preservando os demais parâmetros de listagem ativos

#### Scenario: Fechar sheet remove o parâmetro
- **WHEN** o usuário fecha o sheet (botão fechar, `onOpenChange` ou exclusão do deal aberto)
- **THEN** o sheet fecha imediatamente no estado local e o parâmetro `deal` é removido da URL via `router.push`

#### Scenario: Deep link ao carregar ou recarregar
- **WHEN** a página é acessada ou recarregada com `?deal={id}` válido
- **THEN** o sheet abre automaticamente com loading ativo e carrega o deal via `getDealDetailsAction`, independentemente do deal estar visível no Kanban carregado (ex.: infinite scroll, filtros)

#### Scenario: Deal válido fora da listagem visível
- **WHEN** `?deal={id}` aponta para oportunidade existente na conta com `pipeline_id` igual ao funil da rota, mas o card não está no estado atual do Kanban
- **THEN** o sheet abre normalmente com dados do banco

#### Scenario: Deal de outro funil é inválido
- **WHEN** `getDealDetailsAction` retorna oportunidade cuja `pipeline_id` difere do funil da rota (deep link, back/forward ou qualquer origem)
- **THEN** o sheet fecha, o parâmetro `deal` é removido da URL via `router.replace` e nenhum toast é exibido

#### Scenario: ID inválido ou inexistente via URL
- **WHEN** `?deal` não é numérico, ou `getDealDetailsAction` falha ao carregar (deep link, reload ou navegação back/forward)
- **THEN** o sheet fecha, o parâmetro `deal` é removido da URL via `router.replace` e o sistema exibe toast de erro

#### Scenario: Erro ao abrir por clique no card
- **WHEN** o usuário abre o sheet por interação no Kanban e `getDealDetailsAction` falha
- **THEN** o sheet fecha, a URL é limpa e o sistema exibe toast de erro

#### Scenario: Navegação back/forward do browser
- **WHEN** o usuário usa voltar ou avançar do browser e a URL ganha ou perde `?deal={id}` sem ação direta de abrir/fechar no sheet
- **THEN** o sheet abre ou fecha conforme o param da URL e, ao abrir, carrega o deal via `getDealDetailsAction` (toast de erro em caso de falha, igual ao clique)

#### Scenario: Exclusão via realtime com sheet aberto
- **WHEN** o deal aberto no sheet é removido por evento realtime (`postgres_changes`)
- **THEN** o sheet fecha e o parâmetro `deal` é removido da URL
