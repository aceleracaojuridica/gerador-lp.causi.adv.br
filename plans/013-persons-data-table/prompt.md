Preciso modificar a estrutura da página atual com separação de responsabilidades, seguindo o padrão do `shadcn-data-table.md` que divide em `columns.tsx`, `data-table.tsx` e `page.tsx`. A página também possui `header` e `nav-tabs`.

Como referência de schema use o `supabase-tables.md`, ignorando qualquer menção a data-grid.

**Estrutura esperada:**
- `page.tsx` — Server Component. Responsável apenas pelo fetch inicial e renderização do layout base (header, nav-tabs). Não implementar o fetch real do Supabase ainda — manter o array de persons de exemplo já existente na página simulando um fetch.
- `page.client.tsx` — Client Component que orquestra o estado da página: qual dialog está aberto, qual pessoa está selecionada, callbacks de ações.
- `columns.tsx` — definição das colunas com ColumnDef<Person>.
- `data-table.tsx` — componente genérico da tabela.

**Componentes existentes — não modificar, apenas integrar:**
- O form de pessoa (create/edit) já existe em `src/forms` e já está sendo aberto ao clicar em "nova pessoa". Manter esse comportamento. O form não recebe dados de uma person corretamente ainda, então não ajustar isso agora.
- O delete dialog já existe também em `src/forms` como componente genérico de confirmação e já está recebendo os dados corretamente. Apenas integrá-lo ao novo fluxo sem modificá-lo.

**Fluxo de estado (gerenciado pelo page.client.tsx):**
- Clicar em excluir → abre o delete dialog existente com as pessoas selecionadas
- Clicar em criar → abre o form existente em modo criação (comportamento atual)
- Clicar em editar → abre o form existente passando os dados da pessoa selecionada (não ajustar o form em si, só garantir que ele abre)
- Busca no search-button do header → filtra os dados da tabela

**Funcionalidades da tabela:**
- Busca via search-button no header
- Paginação seguindo o componente Pagination já existente
- Ordenação ao clicar nos TableHead (toggle asc/desc)
- Não implementar filtros de visibilidade ou reordenação de colunas

**Restrições:**
- Preservar o design atual da tabela
- Novos elementos devem seguir o estilo dos componentes existentes
- Não implementar fetch real do Supabase em nenhum arquivo dessa alteração
- Não modificar o form de pessoa nem o delete dialog
- Sempre usar ícones do @material-symbols-svg/react/rounded/w600