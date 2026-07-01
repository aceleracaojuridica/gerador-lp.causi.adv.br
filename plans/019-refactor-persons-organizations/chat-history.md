# Análise de lógica e estrutura de componentes
_Exported on 5/11/2026 at 09:19:50 GMT-4 from Cursor (3.3.30)_

---

**User**

Analise os arquivos de persons e organizations, páginas, componentes e actions, e me aponte o que se repete entre eles em termos de lógica e estrutura de componentes. Não altere nada ainda. Quero apenas um relatório com o que você identificou e uma sugestão de como abstrair cada ponto, para eu decidir o que vale a pena extrair.

**Pastas de referência:**
@src/app/(app)/(pessoas)/organizacoes , @src/app/(app)/(pessoas)/pessoas ,@src/forms/PersonForm , @src/forms/OrganizationForm 

---

**Cursor**

Vou inspecionar essas áreas em modo somente leitura para mapear duplicações reais entre `persons` e `organizations`: páginas, actions e formulários/componentes, e então te devolvo um relatório com sugestões de extração sem alterar nada.

Agora vou ler o trecho de docs do Next.js mais pertinente a `page.tsx` + Server Actions, e depois comparar a árvore de `pessoas`/`organizacoes` com os formulários para separar repetição estrutural de repetição de negócio.

Vou separar a análise em duas frentes: uma para `pessoas` e outra para `organizacoes`, para comparar padrões de página, actions e composição dos formulários sem perder detalhes.

Já tenho os arquivos principais lidos. Agora estou cruzando os padrões literalmente repetidos para distinguir o que é “mesma estrutura com dados diferentes” do que é “complexidade específica de pessoa”.

A duplicação estrutural já está bem clara. Estou consolidando agora em “vale extrair” versus “melhor deixar separado”, para não sugerir uma abstração grande demais.

Encontrei um padrão bem claro: `pessoas` e `organizacoes` seguem praticamente o mesmo “template” de módulo, e a maior parte da repetição está na orquestração da UI e da listagem, não na regra de negócio em si. A complexidade realmente específica está muito mais em `PersonForm` e em `pessoas/actions.ts`.

## Visão geral
A estrutura se repete quase 1:1 entre:

- `src/app/(app)/(pessoas)/pessoas`
- `src/app/(app)/(pessoas)/organizacoes`
- `src/forms/PersonForm`
- `src/forms/OrganizationForm`

Nos dois casos, o fluxo é:

1. `page.tsx` faz parse de querystring e busca inicial.
2. `page.client.tsx` controla busca, modal de form, modal de exclusão e navegação.
3. `data-table.tsx` monta a tabela paginada com TanStack.
4. `columns.tsx` define colunas, seleção em massa e menu de ações.
5. `actions.ts` concentra CRUD server-side.
6. `Form` faz hidratação no modo edição e submit para server action.

Isso é um forte sinal de que já existe um “padrão de recurso CRUD” implícito no módulo.

## O que se repete e como eu abstrairia
- `page.tsx` dos dois recursos repete a mesma lógica-base: ler `searchParams`, sanitizar `search`, normalizar `page`, validar `sort`, fazer `count + list query`, tratar `PGRST103` e passar props para o client.
  Sugestão: extrair um helper pequeno de listagem, algo como `parseListPageParams()` + um util de paginação/sort. Eu evitaria um “page factory” grande por enquanto; o ganho aqui parece maior em helpers pequenos do que em uma abstração mega genérica.

- `page.client.tsx` repete quase toda a casca da tela: tabs, header, badge com total, `ButtonSearch`, `buildUrl`, estado de modal, transições de fetch/delete, fallback de erro, dialog do form e `DeleteConfirmDialog`.
  Sugestão: extrair um shell composto, não um componente monolítico. Algo como `ContactsResourcePageShell` com slots para `table`, `formDialog` e `deleteDialog`, ou então um hook `useCrudListPageState()` para encapsular `buildUrl`, seleção de item, modal de exclusão e transições.

- O helper `buildUrl()` está praticamente duplicado nos dois `page.client.tsx`.
  Sugestão: extrair um util/hook tipo `useListUrlBuilder(basePath, defaults, extraFilters?)`. Em `pessoas`, ele receberia `organization_id` como filtro extra; em `organizacoes`, não.

- `data-table.tsx` é uma das duplicações mais fortes. A estrutura é quase a mesma: `getPageNumbers()`, `useReactTable()` com `manualPagination/manualSorting/manualFiltering`, `rowSelection`, estados de skeleton/empty/no-results, renderização da tabela e paginação.
  Sugestão: esse é um bom candidato para uma abstração real. Eu extrairia um `EntityListTable<T>` ou um `DataTableShell<T>` com:
  - `columns`
  - `data`
  - `getRowId`
  - `onRowClick`
  - `emptyState`
  - `noResultsState`
  - `loadingRowRenderer`
  - props de paginação/sort

- `getPageNumbers()` está duplicado byte a byte nas duas tabelas.
  Sugestão: extrair direto para um util compartilhado. Esse é o low-hanging fruit mais óbvio.

- `columns.tsx` repete vários blocos estruturais:
  - `SortableHeader`
  - coluna de seleção
  - header que troca para “ações em massa” quando há seleção
  - coluna de menu com editar/excluir
  - formatação manual de `created_at`
  Sugestão: extrair factories/utilitários de coluna, por exemplo:
  - `createSelectionColumn<T>()`
  - `createRowActionsColumn<T>()`
  - `createCreatedAtColumn<T>()`
  - `SortableHeader`
  - `formatDateTimeBr()`
  Eu não tentaria abstrair as colunas de domínio em si; só os blocos repetidos.

- Nos formulários, há repetição clara de infraestrutura:
  - `useForm` com `zodResolver`
  - `useEffect` de hidratação no modo edição
  - `onLoadingChange` / `onPendingChange`
  - submit montando `FormData`
  - campos compartilhados como `name`, `state`, `city`, `address`, `additional_info`
  Sugestão: separar em duas camadas:
  1. um hook de hidratação, tipo `useEditFormLoader({ id, load, mapToValues, onLoadedExtras })`
  2. seções compartilhadas de UI, especialmente `LocationFields` (`StateCombobox` + `CityCombobox`) e talvez uma seção simples de dados básicos (`name`, `address`, `additional_info`)

- O `CityField` está duplicado quase literalmente em `PersonForm` e `OrganizationForm`.
  Sugestão: extrair sem medo. Esse é provavelmente o melhor ponto de extração dentro dos forms.

- A seção de localização também repete o comportamento de limpar cidade ao trocar estado.
  Sugestão: virar um componente controlado compartilhado, algo como `StateCityFields<TFieldNames>` ou, mais simples, um componente específico do domínio `BrazilLocationFields`.

- `actions.ts` também tem uma casca repetida:
  - `getSession()`
  - verificação de permissão
  - validação
  - `createClient()`
  - filtro por `account_id`
  - `revalidatePath()`
  - retorno em `ActionResult`
  Sugestão: extrair helpers de guarda, não o CRUD inteiro. Exemplo:
  - `requireServerSession()`
  - `ensurePermission(session, resource, action)`
  - `validationError(message)`
  - `databaseError(message)`
  - talvez um helper genérico para delete por ids/account
  Eu não juntaria `pessoas/actions.ts` e `organizacoes/actions.ts` num CRUD genérico, porque a implementação de pessoa já foge bastante do caso simples.

## Onde eu teria cautela
- Eu não extrairia um “formulário genérico de entidade” unificando `PersonForm` e `OrganizationForm`. `PersonForm` tem foto, upload, crop, telefones, e-mails, redes sociais, organização vinculada, diffs de arrays e persistência em duas etapas. O ganho seria baixo e o acoplamento ficaria alto.

- Eu também não extrairia um “actions.ts genérico” para create/update. Em `organizacoes`, o fluxo é CRUD simples em tabela; em `pessoas`, há RPC, arrays relacionados, diff de ids e persistência de foto. Aqui vale mais compartilhar guard rails do que compartilhar a mutation.

- `PersonPageClient` tem side effects que `OrganizationPageClient` não tem, como atualização de `session.usage` e tratamento de `photoRetryRequired`. Então, se extrair a página client, eu faria um shell com composição, não um componente fechado com dezenas de props booleanas.

## Abstrações que já estão boas
Já existe um bom começo de extração compartilhada, e eu preservaria isso:

- `DeleteConfirmDialog` já resolve bem a confirmação genérica.
- `ButtonSearch`, `Header`, `NavTabs`, `LoadingOverlay` já funcionam como primitives reutilizáveis.
- `StateCombobox` e `CityCombobox` já são bons blocos compartilhados.
- `AvatarImageEditorDialog` já abstrai a parte de edição de imagem; o `person-photo-editor.tsx` praticamente só reexporta isso.

Ou seja: o projeto já está indo na direção certa. O que falta abstrair está mais no “glue code” entre essas peças.

## Ordem de extração que eu priorizaria
Se você quiser atacar isso com o melhor custo/benefício, eu priorizaria assim:

1. `getPageNumbers`, `SortableHeader`, formatador de data e factories de colunas.
2. `LocationFields` / `CityField` e trechos comuns de form.
3. `buildUrl` + parsing de listagem/paginação.
4. `DataTableShell<T>` genérico.
5. Shell/hook da página client.
6. Helpers de guard/validation nas server actions.

Se quiser, no próximo passo eu posso transformar esse relatório em uma proposta concreta de refactor por etapas, separando o que é extração pequena, média e arriscada.

---

**User**

<timestamp>Friday, May 8, 2026, 3:32 PM (UTC-4)</timestamp>
<system_notification>
The following task has finished. If you were already aware, ignore this notification and do not restate prior responses.

<task>
kind: subagent
status: success
task_id: a41390ed-c79e-4faa-87cc-792632e2f647
title: Mapear fluxo de organizacoes
detail: Relatório somente leitura com foco em `organizacoes` + `OrganizationForm` e contraste direto com `pessoas` + `PersonForm`.

---

### 1) Árvore relevante de arquivos

**Organizações (rota)**

- `c:\Users\devbo\OneDrive\Documentos\Sites\causi-app\src\app\(app)\(pessoas)\organizacoes\page.tsx`
- `c:\Users\devbo\OneDrive\Documentos\Sites\causi-app\src\app\(app)\(pessoas)\organizacoes\page.client.tsx`
- `c:\Users\devbo\OneDrive\Documentos\Sites\causi-app\src\app\(app)\(pessoas)\organizacoes\actions.ts`
- `c:\Users\devbo\OneDrive\Documentos\Sites\causi-app\src\app\(app)\(pessoas)\organizacoes\data-table.tsx`
- `c:\Users\devbo\OneDrive\Documentos\Sites\causi-app\src\app\(app)\(pessoas)\organizacoes\columns.tsx`
- `c:\Users\devbo\OneDrive\Documentos\Sites\causi-app\src\app\(app)\(pessoas)\organizacoes\types.ts`

**OrganizationForm**

- `c:\Users\devbo\OneDrive\Documentos\Sites\causi-app\src\forms\OrganizationForm\organization-form.tsx`
- `c:\Users\devbo\OneDrive\Documentos\Sites\causi-app\src\forms\OrganizationForm\organization-form.types.ts`
- `c:\Users\devbo\OneDrive\Documentos\Sites\causi-app\src\forms\OrganizationForm\schema.ts`
- `c:\Users\devbo\OneDrive\Documentos\Sites\causi-app\src\forms\OrganizationForm\index.ts`

**Parallelismo explícito (para comparar com “persons”)**

- `c:\Users\devbo\OneDrive\Documentos\Sites\causi-app\src\app\(app)\(pessoas)\pessoas\` — mesmos nomes (`page.tsx`, `page.client.tsx`, `actions.ts`, `data-table.tsx`, `columns.tsx`, `types.ts`)
- `c:\Users\devbo\OneDrive\Documentos\Sites\causi-app\src\forms\PersonForm\` — `person-form.tsx`, `person-form.types.ts`, `schema.ts`, `index.ts`

---

### 2) Responsabilidades dos arquivos principais

| Arquivo | Papel |
|--------|--------|
| `organizacoes/page.tsx` | RSC: lê `searchParams`, normaliza busca (`replace(/[,()]/g, "")`), paginação, ordenação permitida (`validSortFields`), sessão obrigatória, duas queries em paralelo (total sem filtros + lista filtrada) em `organizations_summary`, erro `PGRST103` → `redirect("/organizacoes")`, passa props para o client. |
| `organizacoes/page.client.tsx` | Shell da lista: `NavTabs`, `Header` + `ButtonSearch`, `useOptimistic` para update/delete, `buildUrl` com query string, diálogo com `OrganizationForm` (dynamic `ssr: false`), `DeleteConfirmDialog`, toasts e `router` para navegação. |
| `organizacoes/actions.ts` | Server Actions: `validateOrganizationFormData` (schema em `@/forms/OrganizationForm/schema`), CRUD filtrando `account_id`, `serverHasPermission("organizations", …)`, `revalidatePath("/organizacoes")`, `getOrganizationDetailsAction` para edição (anti-IDOR). |
| `organizacoes/data-table.tsx` | TanStack Table manual (paginação/ordenação/filtros no servidor): estados de loading (skeleton), empty “sem dados” / “sem resultados”, paginação com `getPageNumbers`. |
| `organizacoes/columns.tsx` | Definição de colunas: checkbox + bulk delete na coluna nome, meta `OrganizationTableMeta` / `OrganizationColumnMeta`, componente local `SortableHeader`, linha clicável para editar. |
| `organizacoes/types.ts` | `OrganizationRow` (view `organizations_summary`) e `OrganizationDetails` (edição na tabela `organizations`). |
| `OrganizationForm/organization-form.tsx` | Client: RHF + `zodResolver(organizationFormSchema)`, carrega edição via `getOrganizationDetailsAction`, monta `FormData` para `onSubmitAction`, campos lugar (UF/cidade/endereço) com `StateCombobox`/`CityCombobox` e subcomponente `CityField` com `useWatch`. |
| `OrganizationForm/schema.ts` | Valida nome + CNPJ opcional (`unmaskNumeric`/`isValidCnpj`). |
| `OrganizationForm/organization-form.types.ts` | `OrganizationFormValues`, `OrganizationFormProps` (injetar server action + callbacks loading/pending). |
| `OrganizationForm/index.ts` | Barrel export dos módulos do form. |

---

### 3) Padrões internos já presentes

- **Lista**: RSC busca dados + Client renderiza lista; constante `PAGE_SIZE = 50` e mesma sanitização de `search` nas duas rotas (`pessoas` e `organizacoes`).
- **URL state**: `search`, `page`, `sort`, `order`; omissão de `sort`/`order` quando padrão `created_at` + `desc` no `buildUrl`.
- **Tabela**: `@tanstack/react-table` em modo servidor (`manualPagination/Sorting/Filtering`), `meta` para callbacks (`onEdit`/`onDelete`), coluna nome com UX de seleção em massa.
- **Forms**: formulário na pasta `src/forms/<Entity>Form/` com schema Zod + types; import das **actions da rota** no form (`OrganizationForm` → `organizacoes/actions`, `PersonForm` → `pessoas/actions`).
- **Actions**: padrão `ActionResult`, `safeParse` único erro amigável (`issues[0]`), permissões granulares, `revalidatePath` na rota da listagem.

---

### 4) O que parece genérico / abstraível (sem alterar código)

- **`getPageNumbers`** em `data-table.tsx` — função byte-a-byte igual em `OrganizationDataTable` e `PersonDataTable`.
- **`SortableHeader` + uso de `table.options.meta`** — mesmo desenho em `columns.tsx` das duas entidades (`OrganizationTableMeta` vs `PersonTableMeta`).
- **Esqueleto da página cliente**: tabs, header, search, optimistic delete, fluxo Dialog + footer “Salvar/Carregando…” + dynamic import do form — quase mesmo layout; divergências são copy, IDs de formulário e `onSuccess`/sessão (`PersonPageClient` atualiza uso; `OrganizationPageClient` só fecha/toast).
- **`page.tsx` (RSC)**: template “dual count + ranged query + view `*_summary` + validação de sort” — apenas mudam nome da view, campos `.or(...ilike)`, `validSortFields` e filtro extra (`organization_id` em pessoas).
- **Validação em server action**: helper `validate*FormData` + `organizationFormSchema`/`personFormSchema` — estrutura repetível para outras entidades simples.

---

### 5) Nomes/trechos exatos para comparar linha-a-linha com `pessoas`

**Rotas**

- **`PAGE_SIZE`** e regex de busca: `replace(/[,()]/g, "")` — `organization` em `organizacoes/page.tsx` vs `person` em `pessoas/page.tsx`.
- **Views/views SQL**: `"organizations_summary"` vs `"persons_summary"`.
- **Sort permitidos**: `"name", "created_at", "persons_count"` vs `"name", "created_at", "updated_at"`.
- **Redirects de erro**: `redirect("/organizacoes")` vs `redirect("/pessoas")`.
- **`buildUrl`**: base `"/organizacoes"` com `merged` só `search/page/sort/order` vs `"/pessoas"` com `organization_id` adicional; **mesmo bloco** que zera `sort`/`order` quando `created_at` + `desc`.

**Client**

- **`useOptimistic`**: ações `{ type: "update" | "delete" }` — orgs por `id` vs pessoas por `person_id`.
- **Dynamic import**: `dynamic(..., { ssr: false, loading: () => <><LoadingOverlay />...` — compare `OrganizationForm` vs `PersonForm`.
- **`DeleteConfirmDialog`**: orgs usam `getCount` com `persons_count`; pessoas usam `getAvatar` e mensagem de impacto (oportunidades/tarefas/conversas).

**Actions**

- Funções espelhadas: `getOrganizationDetailsAction` / `getPersonDetailsAction`, `createOrganizationAction` / `createPersonAction`, `update*`, `delete*`.
- **Permissões**: `serverHasPermission(session, "organizations", ...)` vs `"persons"` (e pessoas têm limites/extras como `serverIsWithinLimit`, mídia, etc.).

**Forms**

- **Import acoplado à rota**: 
 - `getOrganizationDetailsAction` de `"../../app/(app)/(pessoas)/organizacoes/actions"` em `OrganizationForm`; 
 - `getPersonDetailsAction` em `PersonForm` vindo de `pessoas/actions`.
- **Campos compartilhados no domínio “pessoa/org”**: `state`, `city`, `address`, `additional_info` aparecem no Zod das duas entidades; combos `StateCombobox` / `CityCombobox` + padrão `CityField`/watcher aparece nos dois formulários em grau maior em `PersonForm` (organization tem `CityField` dedicado isolando re-render).

**Colunas específicas a contrastar**

- Orgs: coluna **`persons_count`** com link `href={`/pessoas?organization_id=${row.original.id}`}` vs colunas de pessoa (foto, telefone, e-mail, organização, etc. em `pessoas/columns.tsx`).

---

**Resumo:** o fluxo de organizações replica o da listagem de pessoas na mesma arquitetura (RSC + client + `*_summary` + tabela servidor + dialogs + actions coladas ao segmento `(pessoas)`). Os maiores clones são `page.client.tsx`, `page.tsx`, `data-table.tsx` (`getPageNumbers`), e `columns.tsx` (`SortableHeader` + seleção bulk). O `OrganizationForm` é deliberadamente menor que `PersonForm`, mas repete composição shadcn + localização + padrão de server action/FomData — comparação útil campo a campo onde ambos tem `state`/`city`/`address`/`additional_info`.
</task>
</system_notification>
<user_query>The above subagent result is already visible to the user. DO NOT reiterate or summarize its contents unless asked, or if multi-task result synthesis is required. Otherwise do not say anything and end your turn.</user_query>

<timestamp>Friday, May 8, 2026, 3:32 PM (UTC-4)</timestamp>
<system_notification>
The following task has finished. If you were already aware, ignore this notification and do not restate prior responses.

<task>
kind: subagent
status: success
task_id: dcfcbfde-a09a-42fe-8de4-cfe3556adb5a
title: Mapear fluxo de pessoas
detail: Segue o relatório solicitado (somente leitura). Não consegui atualizar o `updateCurrentStep` da timeline (erro de JSON na ferramenta); o conteúdo abaixo é o entregável principal.

---

## 1) Árvore relevante de arquivos

**`pessoas` (lista + actions da rota)** 
- `c:\Users\devbo\OneDrive\Documentos\Sites\causi-app\src\app\(app)\(pessoas)\pessoas\page.tsx` 
- `c:\Users\devbo\OneDrive\Documentos\Sites\causi-app\src\app\(app)\(pessoas)\pessoas\page.client.tsx` 
- `c:\Users\devbo\OneDrive\Documentos\Sites\causi-app\src\app\(app)\(pessoas)\pessoas\actions.ts` 
- `c:\Users\devbo\OneDrive\Documentos\Sites\causi-app\src\app\(app)\(pessoas)\pessoas\types.ts` 
- `c:\Users\devbo\OneDrive\Documentos\Sites\causi-app\src\app\(app)\(pessoas)\pessoas\columns.tsx` 
- `c:\Users\devbo\OneDrive\Documentos\Sites\causi-app\src\app\(app)\(pessoas)\pessoas\data-table.tsx`

**`PersonForm` (forms)** 
- `c:\Users\devbo\OneDrive\Documentos\Sites\causi-app\src\forms\PersonForm\person-form.tsx` 
- `c:\Users\devbo\OneDrive\Documentos\Sites\causi-app\src\forms\PersonForm\schema.ts` 
- `c:\Users\devbo\OneDrive\Documentos\Sites\causi-app\src\forms\PersonForm\person-form.types.ts` 
- `c:\Users\devbo\OneDrive\Documentos\Sites\causi-app\src\forms\PersonForm\person-photo-editor.tsx` (re-export) 
- `c:\Users\devbo\OneDrive\Documentos\Sites\causi-app\src\forms\PersonForm\index.ts`

**Espelho `organizacoes` (para comparação explícita)** 
- `c:\Users\devbo\OneDrive\Documentos\Sites\causi-app\src\app\(app)\(pessoas)\organizacoes\page.tsx` 
- `c:\Users\devbo\OneDrive\Documentos\Sites\causi-app\src\app\(app)\(pessoas)\organizacoes\page.client.tsx` 
- `c:\Users\devbo\OneDrive\Documentos\Sites\causi-app\src\app\(app)\(pessoas)\organizacoes\actions.ts` 
- `c:\Users\devbo\OneDrive\Documentos\Sites\causi-app\src\app\(app)\(pessoas)\organizacoes\types.ts` 
- `c:\Users\devbo\OneDrive\Documentos\Sites\causi-app\src\app\(app)\(pessoas)\organizacoes\columns.tsx` 
- `c:\Users\devbo\OneDrive\Documentos\Sites\causi-app\src\app\(app)\(pessoas)\organizacoes\data-table.tsx` 
- `c:\Users\devbo\OneDrive\Documentos\Sites\causi-app\src\forms\OrganizationForm\organization-form.tsx` 
- `c:\Users\devbo\OneDrive\Documentos\Sites\causi-app\src\forms\OrganizationForm\schema.ts` 
- `c:\Users\devbo\OneDrive\Documentos\Sites\causi-app\src\forms\OrganizationForm\organization-form.types.ts` 
- `c:\Users\devbo\OneDrive\Documentos\Sites\causi-app\src\forms\OrganizationForm\index.ts`

---

## 2) Responsabilidades dos arquivos principais

| Arquivo | Papel |
|--------|--------|
| `pessoas/page.tsx` | RSC: sessão, Supabase server, parsing de `searchParams` (`search`, `page`, `sort`, `order`, só em pessoas `organization_id`), query em `persons_summary` + contagem paralela sem filtro, `redirect`/`PGRST103`, delega ao client. |
| `pessoas/page.client.tsx` | Shell da lista: `NavTabs`, `Header`, busca (`ButtonSearch`), tabela otimista, `Dialog` + `PersonForm` dinâmico, exclusão (`DeleteConfirmDialog`), `toast`, em pessoas também `useSessionContext` para `usage.persons_count` e fluxo `photoRetryRequired`. |
| `pessoas/actions.ts` | Server actions: validação FormData ↔ `personFormSchema`; `getPersonDetailsAction`; `createPersonAction`/`updatePersonAction` via RPC + mídia; `persistPersonPhotoAction`; `deletePersonsAction`; permissões (`serverHasPermission`), limite (`serverIsWithinLimit`). |
| `pessoas/types.ts` | `PersonRow` (view), tipos nested (`PersonPhone`, etc.), `PersonDetails` para edição. |
| `pessoas/columns.tsx` | Colunas TanStack: `SortableHeader`, seleção em massa, metadados de coluna, ações por `table.options.meta`. |
| `pessoas/data-table.tsx` | Tabela cliente: `manualPagination/Sorting`, `getPageNumbers`, estados empty (sem dados / sem filtro / loading), paginação. |
| `PersonForm/person-form.tsx` | RHF + Zod, arrays de telefone/email, foto/upload, combobox de organização, localização → monta FormData / chama actions importadas da rota `pessoas`. |
| `PersonForm/schema.ts` | `phoneSchema`, `emailSchema`, `personFormSchema`. |
| `PersonForm/person-form.types.ts` | `PersonFormProps`, `PersonFormSuccessResult` (id + `created` + `photoRetryRequired`). |

---

## 3) Padrões internos já existentes

- **Lista CRM**: página RSC espelha `organizacoes/page.tsx` (mesmo `PAGE_SIZE`, normalização de busca `replace(/[,()]/g, "")`, dois selects em paralelo com `Promise.all`, tratamento `PGRST103` + redirect).
- **Client de lista**: layout idêntico em blocos (`NavTabs` Pessoas/Organizações, `Header` + badge, `ButtonSearch`, botão novo, `useOptimistic` com `{ update | delete }`, `buildUrl` com default `sort/order` omitidos quando `created_at` + `desc`).
- **Tabela**: `data-table.tsx` quase paralelo (`getPageNumbers` duplicado, mesma estrutura de skeleton/empty/pagination); `columns.tsx` usa o mesmo padrão `PersonTableMeta` / `OrganizationTableMeta` + `SortableHeader` + seleção bulk no header da coluna nome.
- **Actions**: `"use server"`, helper `validate*FormData` com `*.safeParse` + `toRawString` de `FormData`, `getSession`/`createClient`, respostas `ActionResult`, `revalidatePath` na rota.
- **Form em `forms/*`**: `zodResolver`, `organizationId`/`personId` para edição, `useEffect` + `*DetailsAction` para carregar, `onLoadingChange` / `onPendingChange`, submissão via `FormData` + `onSubmitAction` injetado pelo pai.
- **Imports frágeis**: ambos os forms importam actions com path relativo longo até `src/app/(app)/(pessoas)/…/actions`.

---

## 4) Pontos genéricos / abstraíveis

- **`buildUrl` + shape de `searchParams`** (pessoas acrescenta `organization_id` e `onClearFilters` correspondente).
- **`getPageNumbers` e boa parte de `*DataTable`** (props quase iguais; só mudam tipo de linha, `getRowId`, textos/icons de empty).
- **Blocos de erro de query em `page.client`** (Empty + `Report` + botões Voltar/Recarregar) — estrutura equivalente nas duas rotas.
- **`SortableHeader` + meta `headerClassName`/`cellClassName`** — repetidos em cada `columns.tsx`.
- **Padrão `validateXFormData` + schema em `forms/*/schema`** — organização mais simples; pessoas adicionam JSON nested e RPC.
- **Diálogo create/edit**: `dynamic` form + `Dialog`/`DialogFooter` com submit por `form="…"` — mesmo molde entre pessoas e organizações.

---

## 5) Nomes e trechos exatos para comparar com `organizations`

Compare lado a lado (busca textual ou diff):

**Views e filtros**

- `persons_summary` ↔ `organizations_summary`
- `"person_id"` / `organization_id` (query param só em pessoas) ↔ em orgs não há equivalente secundário
- `validSortFields = ["name", "created_at", "updated_at"]` ↔ `["name", "created_at", "persons_count"]`

**Redirects e paths**

- `redirect("/pessoas")` ↔ `redirect("/organizacoes")`
- `revalidatePath("/pessoas")` ↔ `revalidatePath("/organizacoes")`
- URLs: `'/pessoas?${qs}'` ↔ `'/organizacoes?${qs}'`

**Actions e permissões**

- `serverHasPermission(session, "persons", …)` ↔ `"organizations"`
- Funções espelho: 
 `getPersonDetailsAction` ↔ `getOrganizationDetailsAction` 
 `createPersonAction` ↔ `createOrganizationAction` 
 `updatePersonAction` ↔ `updateOrganizationAction` 
 `deletePersonsAction` ↔ `deleteOrganizationsAction`
- RPC pessoas: `"create_person"`, `"update_person"` ↔ orgs: `.from("organizations").insert` / `.update`
- Extra só em pessoas: `serverIsWithinLimit`, `persistPersonPhotoAction`, `cleanupMediaObject`, `parseJson` para `phones`/`emails`/`socials`

**Schemas**

- `personFormSchema` ↔ `organizationFormSchema`
- Campos compartilhados no modelo de negócio: `state`, `city`, `address`, `additional_info` (nos dois schemas/forms)

**Componentes cliente**

- `PersonPageClient` / `OrganizationPageClient`
- `PersonDataTable` / `OrganizationDataTable` — dentro: `getRowId: (row) => String(row.person_id)` ↔ `String(row.id)`
- Imports dinâmicos: 
 `import("@/forms/PersonForm/person-form")` ↔ `import("@/forms/OrganizationForm")`

**Forms – imports relativos até a rota (mesmo smell arquitetural)**

- `"../../app/(app)/(pessoas)/pessoas/actions"` em `person-form.tsx`
- `"../../app/(app)/(pessoas)/organizacoes/actions"` em `organization-form.tsx`

**Types**

- `PersonRow` ↔ `OrganizationRow` 
- `PersonDetails` ↔ `OrganizationDetails` 
- Props: `PersonFormProps` / `PersonFormSuccessResult` ↔ `OrganizationFormProps` (orgs sem `photoRetryRequired` nem `created` no callback)

**Composição compartilhada fora do escopo mas visível nos forms**

- `CityCombobox`, `StateCombobox` em `PersonForm` e `OrganizationForm`

---

**Resumo:** O fluxo de **pessoas** replica o de **organizações** em camada de lista (RSC + client + data-table + columns + dialog + delete), com diferenças centrais em **filtro extra** (`organization_id`), **sort fields**, **session usage** e **actions** (RPC, telefones/emails/redes, foto). Os **forms** seguem o mesmo contrato (RHF + Zod + `get*DetailsAction` + FormData + actions injetadas), mas `PersonForm` é substancialmente mais rico; o **acoplamento** `forms/*` → `app/(app)/(pessoas)/…/actions` é idêntico nos dois lados e é o principal candidato a desduplicar ou mover para um módulo de actions compartilhado.
</task>
</system_notification>
<user_query>The above subagent result is already visible to the user. DO NOT reiterate or summarize its contents unless asked, or if multi-task result synthesis is required. Otherwise do not say anything and end your turn.</user_query>

Agora crie um plano de implementação dessas mudanças. Caso tenha dúvidas ou ambiguidades pode me perguntar.

**Considerações:**
- Realmente prefiro helpers pequenos do que um componente grande e genérico que pode causar problemas de customização futuramente.
- Não sei se criaria um `ContactsResourcePageShell`, prefiro montar a estrutura da página colocando os componentes que vão nela.
- O componente `EntityListTable` parece uma boa ideia. Porém hoje tenho duvidas de como lidar com o EmptyState, se valeria apena mover o EmptyState pra fora de tabela, pois atualmente gerencio 3 tipos de EmptyState (sem dados, sem resultados, erro ao puxar dados).
- `BrazilLocationFields` acho melhor não usar um nome tão especifico, pois atualmente ele está usando apenas locais BR mas futuramente eu penso em considerar usar Países (a biblioteca já da suporte a select de country), mas não quero implementar países agora.
- Sobre os `actions` verificar o que você vai criar de helpers e funções, antes verifique em `/src/lib` e `src/hooks` para ver o que já existe e como usar. Por exemplo, hoje já existe no projeto `serverHasPermission` e `hasPermission`.
- Também prefiro Components para Composition do que um com várias props pois fica mais travado e dificil de personalizar quando precisa. Inclusive tem uma skill no projeto `vercel-composition-patterns` que orienta sobre práticas de composição de componentes.
- Note que já existe duas pastas de componentes que são `/ui` (componentes primitivos/simples e shadcn) e `/ui-patterns` (componentes compostos), e também é possível criar pastas de componentes especificos para uma rota tipo `/persons` (ainda não existe).

---

**Cursor**

Vou validar primeiro o que já existe em `src/lib`, `src/hooks` e nos diretórios de componentes para o plano não propor abstrações redundantes nem ir contra os padrões de composição do projeto.

Vou ler os helpers e padrões de composição mais relevantes para ancorar o plano nas abstrações já existentes, principalmente sessão/permissão, `Header` e o combobox de localização.

Vou checar rapidamente a organização atual de `src/components` e se já existe algum padrão de pastas por domínio antes de fixar os caminhos sugeridos no plano.

Vou só confirmar a forma de `ActionResult` e se já existe algum util parecido para mensagens de action antes de fechar o plano.

Vou checar a organização atual de `src/lib` só para propor paths que combinem com o que já existe no projeto, sem inventar uma subárvore nova desnecessária.

Achei um candidato importante em `src/lib`: vou ler `search-params.ts` antes de fechar o plano, porque ele pode mudar bastante a proposta de helper para URL/listagem.

Fechei os pontos que podiam mudar o desenho do plano: já existe `[src/lib/search-params.ts](src/lib/search-params.ts)` para reaproveitar na parte de querystring, e os componentes existentes já seguem um padrão de composição bom em `[src/components/ui-patterns/header.tsx](src/components/ui-patterns/header.tsx)` e `[src/components/ui/empty.tsx](src/components/ui/empty.tsx)`.

---

**User**

Implement the plan as specified, it is attached for your reference. Do NOT edit the plan file itself.

To-do's from the plan have already been created. Do not create them again. Mark them as in_progress as you work, starting with the first one. Don't stop until you have completed all the to-dos.

---

**Cursor**

Vou começar pelo primeiro to-do (helpers puros), marcar como `in_progress` e implementar em sequência até concluir todos os itens do plano.

Iniciei a extração do core compartilhado da tabela em `ui-patterns`, mantendo o controle de EmptyState e erro fora desse core (nos wrappers), como você pediu.

Encontrei 2 erros de tipagem no `PersonDataTable` após a extração; vou corrigir agora e validar novamente os lints.

Implementei o plano completo, sem editar o arquivo de plano, e finalizei todos os to-dos como `completed`.

Principais entregas:

- Extraí helpers puros em `src/lib`:
  - `src/lib/search-params.ts`: `sanitizeSearchTerm`, `parsePageParam`, `parseSortParam`, `parseOrderParam`, `buildListUrl`
  - `src/lib/pagination.ts`: `getPageNumbers`
  - `src/lib/format-date-time.ts`: `formatDateTime`
- Criei o core compartilhado de tabela composto em:
  - `src/components/ui-patterns/entity-list-table.tsx`
    - `EntityListTable`
    - `EntityListTablePagination`
- Extraí cabeçalho de ordenação reutilizável:
  - `src/components/ui-patterns/table-sortable-header.tsx`
- Refatorei wrappers de `pessoas` e `organizacoes` para usar os novos helpers/core:
  - `src/app/(app)/(pessoas)/pessoas/page.tsx`
  - `src/app/(app)/(pessoas)/organizacoes/page.tsx`
  - `src/app/(app)/(pessoas)/pessoas/page.client.tsx`
  - `src/app/(app)/(pessoas)/organizacoes/page.client.tsx`
  - `src/app/(app)/(pessoas)/pessoas/data-table.tsx`
  - `src/app/(app)/(pessoas)/organizacoes/data-table.tsx`
  - `src/app/(app)/(pessoas)/pessoas/columns.tsx`
  - `src/app/(app)/(pessoas)/organizacoes/columns.tsx`
- Extraí composição de localização com nome neutro e `countryCode` configurável:
  - `src/components/ui-patterns/location-fields.tsx`
  - integração em:
    - `src/forms/PersonForm/person-form.tsx`
    - `src/forms/OrganizationForm/organization-form.tsx`
- Revisão mínima de actions (sem CRUD genérico):
  - adicionei `getFirstIssueMessage` em `src/lib/form-data.ts`
  - uso em:
    - `src/app/(app)/(pessoas)/pessoas/actions.ts`
    - `src/app/(app)/(pessoas)/organizacoes/actions.ts`

Validação executada:

- `pnpm lint` passou sem erros após os ajustes de Biome/imports.

