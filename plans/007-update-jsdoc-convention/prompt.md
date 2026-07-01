Vamos atualizar o padrão de documentação JSDoc do projeto em duas etapas.

## Etapa 1 — Propor uma nova convenção para a documentação

Localize o trecho abaixo na documentação do projeto:

---
## JSDoc (Obrigatório)

Todo componente deve incluir JSDoc com as seguintes seções:

1. **@motivacao** — por que o componente existe
2. **@problema** — qual problema ele resolve
3. **@solucao** — como ele resolve
4. **@consideracoes** — ciclo de vida, performance, restrições

A documentação de comportamento do componente vive no JSDoc + TypeScript types, **não** em arquivos markdown separados.
---

Antes de propor qualquer alteração, analise o projeto como um todo:

- Quais tipos de arquivos existem? (pages, forms, components, hooks, utils, actions...)
- Qual é o nível médio de complexidade dos componentes?
- Existe algum padrão de documentação já emergindo naturalmente no código?
- O padrão atual está sendo seguido de forma consistente ou já está abandonado?

Com base nessa análise, proponha uma nova convenção de JSDoc que seja realista para este projeto específico. Use o formato abaixo como ponto de partida, mas sinta-se livre para ajustar, simplificar ou estender se identificar algo mais adequado ao que você encontrou no código:

**Referência sugerida:**
```tsx
/**
 * Descrição curta e direta do que o componente ou função faz.
 *
 * @remarks
 * Contexto adicional quando necessário: restrições de uso, decisões de design,
 * dependências implícitas, comportamentos não-óbvios, ou qualquer informação
 * relevante que não apareça nos tipos ou na descrição.
 *
 * @param name - Descrição do parâmetro (quando os tipos não forem suficientes).
 * @returns O que retorna (para funções utilitárias com retorno não-óbvio).
 */
```

**Diretrizes que devem ser mantidas independente do formato escolhido:**
- O objetivo é permitir que um dev entenda o arquivo sem precisar ler o código
- A documentação deve viver no JSDoc + TypeScript types, não em markdowns separados
- O formato deve ser sustentável — fácil de manter e de seguir no dia a dia

Apresente a convenção proposta com exemplos reais retirados do próprio projeto, justificando as escolhas.

## Etapa 2 — Planejar a migração dos JSDocs existentes

Sem alterar nenhum arquivo ainda, faça um levantamento de todos os arquivos que contém JSDoc no padrão antigo. Considere como padrão antigo qualquer JSDoc que contenha ao menos uma dessas variações:

- Tags com @: `@motivacao`, `@problema`, `@solucao`, `@consideracoes`
- Tags em inglês: `@motivation`, `@problem`, `@solution`, `@considerations`
- Títulos sem @: `Motivação:`, `Problema:`, `Solução:`, `Considerações:`
- Qualquer combinação com negrito: `**Motivação**`, `**@motivacao**`, `**Problema**`, etc.
- Variações com ou sem acento: `@motivação`, `@consideração`

Para cada arquivo encontrado, descreva:
- O que o JSDoc atual diz
- O que o novo JSDoc deve dizer
- Se há alguma informação no JSDoc atual que vale preservar ou se é apenas paráfrase do código

Ao final, apresente o plano completo de migração para aprovação antes de qualquer escrita.