## ADDED Requirements

### Requirement: Fetch server-side por conta
A página `/pessoas` SHALL buscar dados exclusivamente no servidor, filtrando sempre por `account_id` da sessão ativa via `persons_summary` view.

#### Scenario: Carregamento inicial da página
- **WHEN** o usuário acessa `/pessoas` sem params na URL
- **THEN** o sistema retorna os primeiros 50 contatos da conta ativa ordenados por `created_at` DESC

#### Scenario: Troca de conta via account-switching
- **WHEN** o usuário troca de conta e a página executa `router.refresh()`
- **THEN** o sistema re-executa o fetch com o novo `account_id` do cookie `causi_act` e exibe os contatos da nova conta

---

### Requirement: Busca full-text por nome, telefone e e-mail
O sistema SHALL filtrar contatos via busca textual aplicada simultaneamente nos campos `name`, `primary_phone` e `primary_email` da view `persons_summary`.

#### Scenario: Busca com termo válido
- **WHEN** o usuário digita um termo no campo de busca (após debounce do ButtonSearch)
- **THEN** o sistema atualiza a URL com `?search=<termo>` e exibe somente contatos cujo nome, telefone primário ou e-mail primário contém o termo (case-insensitive)

#### Scenario: Limpeza da busca
- **WHEN** o usuário limpa o campo de busca ou clica no botão de reset
- **THEN** o sistema remove `search` da URL e exibe todos os contatos sem filtro de texto

---

### Requirement: Filtro por organização
O sistema SHALL permitir filtrar contatos por organização via `EntityCombobox` interativo na área de filtros da página.

#### Scenario: Seleção de organização no filtro
- **WHEN** o usuário seleciona uma organização no combobox de filtro
- **THEN** o sistema atualiza a URL com `?organization_id=<id>` e exibe somente contatos vinculados àquela organização

#### Scenario: Acesso via link de contagem em /organizacoes
- **WHEN** o usuário clica na contagem de pessoas de uma organização na página `/organizacoes`
- **THEN** o sistema navega para `/pessoas?organization_id=<id>` com o filtro pré-ativo

#### Scenario: Limpeza do filtro de organização
- **WHEN** o usuário limpa o combobox de organização
- **THEN** o sistema remove `organization_id` da URL e exibe contatos de todas as organizações

---

### Requirement: Ordenação server-side
O sistema SHALL ordenar contatos no banco de dados conforme os parâmetros `sort` e `order` da URL.

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
- **WHEN** o usuário altera busca, organização ou ordenação
- **THEN** o sistema reseta `page` para 1 na URL

---

### Requirement: Contador total com filtros ativos
O sistema SHALL exibir no `HeaderTitle` a contagem total de contatos correspondentes aos filtros ativos (não apenas os da página atual).

#### Scenario: Contador com busca ativa
- **WHEN** a página carrega com `?search=joao`
- **THEN** o counter no header exibe o total de contatos que correspondem à busca, não 50

#### Scenario: Skeleton durante carregamento
- **WHEN** a página está carregando (Suspense/loading)
- **THEN** o contador exibe um skeleton no lugar do número

---

### Requirement: Persistência de estado via URL
O sistema SHALL preservar o estado de filtros, busca, ordenação e página na URL, permitindo compartilhamento e recarga.

#### Scenario: Reload com params na URL
- **WHEN** o usuário recarrega a página com params na URL (ex: `?search=joao&page=2`)
- **THEN** o sistema aplica os filtros e exibe a página correta com os dados filtrados

#### Scenario: Navegação limpa pelo sidebar ou nav-tabs
- **WHEN** o usuário acessa `/pessoas` clicando no sidebar ou na aba do nav-tabs
- **THEN** a URL não contém nenhum query param e a listagem exibe o estado padrão (sem filtros)

---

### Requirement: Empty state — sem dados
O sistema SHALL exibir um empty state com CTA de criação quando não há nenhum contato na conta (independente de filtros).

#### Scenario: Conta sem contatos
- **WHEN** a conta não possui nenhum contato cadastrado
- **THEN** o sistema exibe empty state com ícone, texto explicativo e botão "Nova Pessoa"

---

### Requirement: Empty state — sem resultados com filtros
O sistema SHALL exibir um empty state com botão de reset quando filtros/busca ativos não retornam resultados, mas a conta possui contatos.

#### Scenario: Filtro sem resultados
- **WHEN** a conta possui contatos mas os filtros/busca ativos não retornam nenhum resultado
- **THEN** o sistema exibe empty state com texto "Nenhum resultado encontrado" e botão para limpar todos os filtros (search + organization_id + page)

#### Scenario: Reset completo de filtros pelo empty state
- **WHEN** o usuário clica no botão de reset dentro do empty state de sem resultados
- **THEN** o sistema remove `search`, `organization_id` e `page` da URL simultaneamente
