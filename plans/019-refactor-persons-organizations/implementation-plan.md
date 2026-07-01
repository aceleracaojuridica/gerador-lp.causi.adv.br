---
name: Refactor contatos CRUD
overview: Reduzir a duplicação entre `pessoas` e `organizacoes` com helpers pequenos e componentes compostos, sem criar um page shell monolítico nem um CRUD genérico de actions. O foco é extrair o núcleo reutilizável da listagem/tabela e os campos de localização, preservando a lógica específica de `PersonForm` e das server actions de pessoas.
todos:
  - id: shared-utils
    content: Extrair helpers puros de query params, paginação e formatação de data sem alterar o fluxo das páginas
    status: completed
  - id: entity-list-table-core
    content: Criar um `EntityListTable` composto em `ui-patterns` focado só em tabela e paginação, deixando estados vazios/erro com os wrappers das rotas
    status: completed
  - id: refactor-list-wrappers
    content: Refatorar `pessoas` e `organizacoes` para usar os helpers e o core compartilhado, mantendo colunas e EmptyStates de domínio
    status: completed
  - id: extract-location-fields
    content: Extrair a composição de localização compartilhada dos formulários com nome neutro e `countryCode` configurável
    status: completed
  - id: review-actions-minimal
    content: Revisar duplicação residual dos actions e extrair apenas helpers mínimos de `ActionResult`/validação se o ganho de legibilidade justificar
    status: completed
isProject: false
---

# Plano de Refactor Pessoas/Organizações

## Objetivo
Reduzir a duplicação entre as rotas de `pessoas` e `organizacoes` sem esconder a montagem das páginas atrás de um shell genérico. A ideia é extrair apenas os blocos realmente estáveis: utilitários puros, um núcleo compartilhado de tabela/paginação e a composição de localização dos formulários.

## Decisões de Escopo
- Manter `[src/app/(app)/(pessoas)/pessoas/page.client.tsx](src/app/(app)/(pessoas)/pessoas/page.client.tsx)` e `[src/app/(app)/(pessoas)/organizacoes/page.client.tsx](src/app/(app)/(pessoas)/organizacoes/page.client.tsx)` como pontos de montagem explícita.
- Não criar `ContactsResourcePageShell` nem um CRUD genérico para actions.
- Reaproveitar os checks já existentes em `[src/lib/session/server-checks.ts](src/lib/session/server-checks.ts)` e o contraponto client-side em `[src/hooks/use-access-control.ts](src/hooks/use-access-control.ts)`; não duplicar `serverHasPermission`, `serverIsWithinLimit` ou `hasPermission`.
- Seguir o padrão de composição já usado em `[src/components/ui-patterns/header.tsx](src/components/ui-patterns/header.tsx)` e `[src/components/ui/empty.tsx](src/components/ui/empty.tsx)`.
- Tratar `erro ao buscar dados` como estado de página, fora do core compartilhado da tabela. O shared `EntityListTable` ficará responsável por tabela/paginação; `sem dados` e `sem resultados` continuam decididos pelos wrappers de cada rota para preservar copy, ícones e CTAs.

## Fase 1: Extrair utilitários puros
Criar/ajustar helpers pequenos para remover duplicação sem mexer ainda no desenho das páginas:
- Estender `[src/lib/search-params.ts](src/lib/search-params.ts)` para centralizar parsing/sanitização de query params usados pelas listagens (`search`, `page`, `sort`, `order` e filtros extras como `organization_id`).
- Criar um helper flat em `src/lib/pagination.ts` com `getPageNumbers()` hoje duplicado em `[src/app/(app)/(pessoas)/pessoas/data-table.tsx](src/app/(app)/(pessoas)/pessoas/data-table.tsx)` e `[src/app/(app)/(pessoas)/organizacoes/data-table.tsx](src/app/(app)/(pessoas)/organizacoes/data-table.tsx)`.
- Criar um helper flat em `src/lib/format-date-time.ts` para a formatação manual de `created_at` hoje repetida em `[src/app/(app)/(pessoas)/pessoas/columns.tsx](src/app/(app)/(pessoas)/pessoas/columns.tsx)` e `[src/app/(app)/(pessoas)/organizacoes/columns.tsx](src/app/(app)/(pessoas)/organizacoes/columns.tsx)`.

## Fase 2: Extrair o núcleo compartilhado da tabela
Criar um componente composto em `[src/components/ui-patterns/entity-list-table.tsx](src/components/ui-patterns/entity-list-table.tsx)` com responsabilidade limitada:
- render da estrutura base da tabela (`Table`, `TableHeader`, `TableBody`)
- render da paginação
- wiring compartilhado de TanStack que não depende do domínio
- composição por children/slots, em vez de uma API grande baseada em props booleanas

A intenção é que o shared component seja um core, não um dono de estados de negócio. Os wrappers das rotas continuam decidindo quando renderizar:
- skeleton
- `Empty` de primeiro uso
- `Empty` de sem resultados
- tabela com linhas reais

Isso mantém customização fácil e evita amarrar `pessoas` e `organizacoes` a um componente rígido.

## Fase 3: Afinar `columns.tsx` e `data-table.tsx`
Refatorar os wrappers de cada rota para ficarem finos:
- `[src/app/(app)/(pessoas)/pessoas/data-table.tsx](src/app/(app)/(pessoas)/pessoas/data-table.tsx)`
- `[src/app/(app)/(pessoas)/organizacoes/data-table.tsx](src/app/(app)/(pessoas)/organizacoes/data-table.tsx)`
- `[src/app/(app)/(pessoas)/pessoas/columns.tsx](src/app/(app)/(pessoas)/pessoas/columns.tsx)`
- `[src/app/(app)/(pessoas)/organizacoes/columns.tsx](src/app/(app)/(pessoas)/organizacoes/columns.tsx)`

Mudanças previstas:
- trocar `getPageNumbers()` pelo helper compartilhado
- trocar a formatação manual de data pelo helper compartilhado
- extrair `SortableHeader` e, se o diff continuar limpo, pequenos factories/helpers de coluna para:
  - seleção em massa
  - coluna de ações por linha
  - coluna de data

Aqui o objetivo é remover repetição estrutural sem tentar unificar colunas de domínio como foto, telefone, `persons_count` ou organização vinculada.

## Fase 4: Refatorar `page.client.tsx` de forma conservadora
Aplicar apenas extrações pequenas nos clients de página:
- `[src/app/(app)/(pessoas)/pessoas/page.client.tsx](src/app/(app)/(pessoas)/pessoas/page.client.tsx)`
- `[src/app/(app)/(pessoas)/organizacoes/page.client.tsx](src/app/(app)/(pessoas)/organizacoes/page.client.tsx)`

Escopo desta fase:
- substituir `buildUrl()` por helper compartilhado apoiado em `[src/lib/search-params.ts](src/lib/search-params.ts)`
- manter a página montando explicitamente `NavTabs`, `Header`, `ButtonSearch`, tabela, dialog de form e `DeleteConfirmDialog`
- avaliar extrair apenas blocos realmente específicos do domínio de contatos para uma pasta própria, por exemplo `src/components/persons/`, se a duplicação visual restante ainda justificar

O que não entra nesta fase:
- page shell genérico
- hook grande para controlar toda a listagem

## Fase 5: Extrair a composição de localização dos formulários
Criar um componente composto com nome neutro, por exemplo `[src/components/ui-patterns/location-fields.tsx](src/components/ui-patterns/location-fields.tsx)`, para substituir o bloco duplicado hoje existente em:
- `[src/forms/PersonForm/person-form.tsx](src/forms/PersonForm/person-form.tsx)`
- `[src/forms/OrganizationForm/organization-form.tsx](src/forms/OrganizationForm/organization-form.tsx)`

Escopo do componente:
- compor `StateCombobox` + `CityCombobox`
- manter o reset de `city` ao trocar `state`
- preservar o watcher isolado que evita rerender do form inteiro
- aceitar `countryCode` com default atual (`"BR"`), mas com nome neutro para não fechar a API em Brasil

O que fica de fora por enquanto:
- extração do bloco de hidratação de edição (`useEffect` + `get*DetailsAction`) para um hook compartilhado, porque `PersonForm` já diverge bastante de `OrganizationForm`
- extração de campos simples como `name`, `address`, `additional_info`, porque o ganho inicial parece menor do que o risco de acoplamento

## Fase 6: Revisão mínima dos actions
Manter `[src/app/(app)/(pessoas)/pessoas/actions.ts](src/app/(app)/(pessoas)/pessoas/actions.ts)` e `[src/app/(app)/(pessoas)/organizacoes/actions.ts](src/app/(app)/(pessoas)/organizacoes/actions.ts)` separados.

Nesta rodada, a meta é só remover ruído duplicado que realmente se provar estável, por exemplo:
- pequenos builders de `ActionResult` em um arquivo flat de `src/lib/`, se isso reduzir repetição sem esconder fluxo
- helper mínimo para extrair a mensagem do primeiro erro de `safeParse`, se o diff ficar mais legível

Não entra nesta fase:
- helper genérico de CRUD
- helper que esconda as particularidades de RPC, mídia, diffs de arrays ou limites de `persons`

## Verificação
Ao final da implementação, validar que nada mudou no comportamento de:
- busca, paginação e ordenação em `pessoas` e `organizacoes`
- seleção em massa e exclusão
- dialog de create/edit
- `PersonForm` com foto, upload e `photoRetryRequired`
- `OrganizationForm` com CNPJ e localização
- updates de `usage.persons_count` em `[src/app/(app)/(pessoas)/pessoas/page.client.tsx](src/app/(app)/(pessoas)/pessoas/page.client.tsx)`

A expectativa é terminar com menos duplicação estrutural, mas ainda com páginas legíveis e fáceis de customizar manualmente.