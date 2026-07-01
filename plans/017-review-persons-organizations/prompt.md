## Objetivo

Analisar e planejar a correção da implementação da página `/pessoas` e a replicação das mudanças em `/organizacoes`.

## Problemas identificados

**`data-table.tsx` — skeleton nunca exibido**
O componente possui um estado `isLoading`, mas ele nunca é ativado. O skeleton deve ser exibido sempre que a query principal da página estiver em andamento — exemplos: ao buscar, ao alterar coluna/direção de ordenação, ao trocar de página.

**`page.client.tsx` — Badge do Header sem skeleton**
O contador no `Badge` do `Header` também deve exibir um skeleton enquanto `isLoading` for verdadeiro.

## Revisão geral

Com base nos arquivos de documentação anexados e no contexto do projeto, analise a implementação da página `/pessoas` e todos os seus componentes e forms nos seguintes aspectos:

- Fetching de dados #file:06-fetching-data.md
- Mutações #file:07-mutating-data.md 
- Cache #file:08-caching.md 
- Revalidação #file:09-revalidating.md 
- Lazy loading #file:lazy-loading.md 
- Streaming #file:streaming.md 
- Segurança de dados #file:data-security.md 

Para cada item encontrado, classifique como **correção** (algo incorreto ou quebrado) ou **melhoria** (algo funcional mas que pode ser aprimorado), descreva o motivo e indique o que deve ser feito.

## Replicação em `/organizacoes`

A implementação de `/organizacoes` espelha a de `/pessoas`. Inclua no plano a replicação de todas as correções e melhorias em `/organizacoes`.

## Formato do plano

Organize a saída em:
1. **Diagnóstico** — lista de correções e melhorias encontradas por arquivo/componente
2. **Plano de ação** — sequência de alterações a serem feitas, incluindo `/organizacoes`