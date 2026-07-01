## ADDED Requirements

### Requirement: Fetch server-side por conta
A página `/organizacoes` SHALL buscar dados exclusivamente no servidor, filtrando sempre por `account_id` da sessão ativa via `organizations_summary` view.

#### Scenario: Carregamento inicial da página
- **WHEN** o usuário acessa `/organizacoes` sem params na URL
- **THEN** o sistema retorna as primeiras 50 organizações da conta ativa ordenadas por `created_at` DESC

#### Scenario: Troca de conta via account-switching
- **WHEN** o usuário troca de conta e a página executa `router.refresh()`
- **THEN** o sistema re-executa o fetch com o novo `account_id` e exibe as organizações da nova conta

---

### Requirement: Busca por nome e CNPJ
O sistema SHALL filtrar organizações via busca textual aplicada nos campos `name` e `cnpj` da view `organizations_summary`.

#### Scenario: Busca com termo válido
- **WHEN** o usuário digita um termo no campo de busca (após debounce do ButtonSearch)
- **THEN** o sistema atualiza a URL com `?search=<termo>` e exibe somente organizações cujo nome ou CNPJ contém o termo (case-insensitive)

#### Scenario: Limpeza da busca
- **WHEN** o usuário limpa o campo de busca
- **THEN** o sistema remove `search` da URL e exibe todas as organizações

---

### Requirement: Ordenação server-side
O sistema SHALL ordenar organizações no banco conforme os parâmetros `sort` e `order` da URL.

#### Scenario: Ordenação por coluna
- **WHEN** o usuário clica em um cabeçalho de coluna ordenável (nome, criado em)
- **THEN** o sistema atualiza a URL com `?sort=<coluna>&order=asc|desc` e retorna dados ordenados pelo banco

#### Scenario: Ordenação padrão
- **WHEN** nenhum param de ordenação está presente na URL
- **THEN** o sistema ordena por `created_at` DESC

---

### Requirement: Paginação server-side
O sistema SHALL paginar resultados no banco (50 itens por página) via parâmetro `page` na URL.

#### Scenario: Troca de página
- **WHEN** o usuário clica em um número de página ou nos botões anterior/próximo
- **THEN** o sistema atualiza a URL com `?page=<n>` e retorna o intervalo correto de registros

#### Scenario: Reset de página ao filtrar
- **WHEN** o usuário altera busca ou ordenação
- **THEN** o sistema reseta `page` para 1 na URL

---

### Requirement: Contador total com filtros ativos
O sistema SHALL exibir no `HeaderTitle` a contagem total de organizações correspondentes aos filtros ativos.

#### Scenario: Contador com busca ativa
- **WHEN** a página carrega com `?search=acme`
- **THEN** o counter exibe o total de organizações que correspondem à busca

#### Scenario: Skeleton durante carregamento
- **WHEN** a página está carregando
- **THEN** o contador exibe um skeleton no lugar do número

---

### Requirement: Persistência de estado via URL
O sistema SHALL preservar o estado de busca, ordenação e página na URL.

#### Scenario: Reload com params na URL
- **WHEN** o usuário recarrega a página com params na URL
- **THEN** o sistema aplica os filtros e exibe a página correta com os dados filtrados

#### Scenario: Navegação limpa pelo sidebar ou nav-tabs
- **WHEN** o usuário acessa `/organizacoes` clicando no sidebar ou na aba do nav-tabs
- **THEN** a URL não contém nenhum query param e a listagem exibe o estado padrão

---

### Requirement: Contagem de pessoas vinculadas e navegação para /pessoas
O sistema SHALL exibir a contagem de pessoas vinculadas a cada organização e permitir navegar para `/pessoas` filtrado por aquela organização.

#### Scenario: Link de contagem
- **WHEN** o usuário clica na contagem de pessoas de uma organização
- **THEN** o sistema navega para `/pessoas?organization_id=<id>` com o filtro pré-ativo

---

### Requirement: Empty state — sem dados
O sistema SHALL exibir empty state com CTA de criação quando não há nenhuma organização na conta.

#### Scenario: Conta sem organizações
- **WHEN** a conta não possui nenhuma organização cadastrada
- **THEN** o sistema exibe empty state com botão "Nova Organização"

---

### Requirement: Empty state — sem resultados com filtros
O sistema SHALL exibir empty state com botão de reset quando busca ativa não retorna resultados, mas a conta possui organizações.

#### Scenario: Busca sem resultados
- **WHEN** a conta possui organizações mas a busca ativa não retorna nenhum resultado
- **THEN** o sistema exibe empty state com botão para limpar todos os filtros (search + page)
