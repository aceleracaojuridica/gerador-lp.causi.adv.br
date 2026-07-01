---
description: 
alwaysApply: true
---

# Causi

## O que é

Vertical SaaS para advogados brasileiros: CRM Kanban + WhatsApp Inbox + AI Agent + Automatic Follow-up.

Stack: Next.js 16 (App Router, RSC), React 19, Tailwind CSS 4, Shadcn UI, Supabase (Postgres + Auth + RLS + Storage), Zod, Biome, Husky, TypeScript 5, Vercel, pnpm.

Multi-tenant: todos os dados isolados por `account_id`. RLS é obrigatório em todas as tabelas.

---

## Antes de Codificar

**Não assuma. Não esconda dúvidas. Exponha tradeoffs.**

Antes de implementar qualquer coisa:
- Declare suas premissas explicitamente. Se incerto, pergunte.
- Se existem múltiplas interpretações, apresente-as — não escolha silenciosamente.
- Se uma abordagem mais simples existe, diga. Questione quando necessário.
- Se algo está confuso, pare. Nomeie o que está confuso. Pergunte.

Leia o contexto do projeto antes de qualquer tarefa: `docs/` 

<!-- BEGIN:nextjs-agent-rules -->

# Next.js: SEMPRE leia os docs antes de codificar

Antes de qualquer trabalho em Next.js, encontre e leia o doc relevante em `node_modules/next/dist/docs/`. Seus dados de treinamento estão desatualizados — os docs são a fonte da verdade.

<!-- END:nextjs-agent-rules -->

---

## Princípios de Implementação

### Estilo de código

Escreva código humanizado: use nomes intuitivos que revelam intenção (`isUserActive`, `calculateTotalWithDiscount`), documente funções com JSDoc, e evite abstrações prematuras — resolva o problema concreto antes de generalizar. Prefira clareza a esperteza, mas não sacrifique elegância: código limpo e bem estruturado, de facil entendimento humano.

### Simplicidade primeiro

**Mínimo de código que resolve o problema. Nada especulativo.**

- Nenhuma feature além do que foi pedido.
- Nenhuma abstração para código de uso único.
- Nenhuma "flexibilidade" ou "configurabilidade" que não foi solicitada.
- Nenhum tratamento de erro para cenários impossíveis.
- Se você escreveu 200 linhas e podia ser 50, reescreva.

Pergunta de controle: "Um engenheiro sênior diria que isso está complicado demais?" Se sim, simplifique.

### Mudanças cirúrgicas

**Toque apenas no que é necessário. Limpe apenas sua própria bagunça.**

Ao editar código existente:
- Não "melhore" código adjacente, comentários ou formatação.
- Não refatore coisas que não estão quebradas.
- Siga o estilo existente, mesmo que você faria diferente.
- Se notar código morto não relacionado, mencione — não delete.

Quando suas mudanças criarem órfãos:
- Remova imports/variáveis/funções que AS SUAS mudanças tornaram não utilizadas.
- Não remova código morto pré-existente a menos que seja solicitado.

Teste: cada linha alterada deve se rastrear diretamente à solicitação do usuário.

### Execução orientada a objetivos

**Defina critérios de sucesso. Execute em loop até verificar.**

Transforme tarefas em objetivos verificáveis:
- "Adicionar validação" → "Escrever testes para inputs inválidos, depois fazê-los passar"
- "Corrigir o bug" → "Escrever um teste que reproduz o bug, depois fazê-lo passar"
- "Refatorar X" → "Garantir que os testes passem antes e depois"

Para tarefas com múltiplos passos, declare um plano breve:
```
1. [Passo] → verificar: [checagem]
2. [Passo] → verificar: [checagem]
3. [Passo] → verificar: [checagem]
```

### Documentação reflete o estado atual, não o histórico

**Documentação descreve como o sistema funciona agora. Nunca como ele funcionava antes, nem o que mudou. Não registre alterações, isto causa ruido na documentação.**

Ao atualizar qualquer documentação do projeto:
- Não registre o que foi corrigido, alterado ou removido;
- Descreva apenas a implementação atual;
- Remova referências a comportamentos, campos, funções ou fluxos que não existem mais.

---

## Comandos

| Tarefa | Comando |
|---|---|
| Dev server | `pnpm dev` |
| Build | `pnpm build` |
| Lint (Biome) | `pnpm lint` |
| Format (Biome) | `pnpm format` |

---

## Regras do Projeto

1. **pnpm apenas** — nunca use `npm` ou `yarn`
2. **Biome cuida da formatação e linting** — não force estilo de código manualmente
3. **RLS é obrigatório** — nunca bypass no código client-side; `SERVICE_ROLE_KEY` apenas no servidor (mediante revisão do desenvolvedor)
4. **Siga `docs/ai-context/conventions.md`** — nomenclatura, estrutura de componentes, padrões Supabase, tratamento de erros
5. **Commits semânticos** — `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`