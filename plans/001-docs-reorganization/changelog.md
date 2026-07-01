# Reorganização da Documentação do Projeto

**Data:** 2026-03-26
**Status:** Concluído
**Resultado:** 43 arquivos escritos em `docs/` (12 pastas)

---

## Contexto

O projeto Causi (SaaS CRM para advogados — Next.js + Supabase) possuía ~39 arquivos de documentação em `docs/` com problemas graves:

- **Referências quebradas**: 100+ links apontando para arquivos SQL deletados (movidos para `supabase/schemas/`)
- **Informações erradas**: Nomes de colunas incorretos (`base_price_cents` em vez de `base_price`), tipos de ID errados (uuid em vez de bigint), fluxos de convite incorretos, permissões que não existiam
- **Duplicação e contradição**: Um mesmo arquivo (002-RBAC.md, 830+ linhas) cobria roles, RLS, billing, planos e addons, com seções que se contradiziam entre si
- **Linguagem de MVP**: O projeto já está em produção com clientes pagantes, mas os docs ainda descreviam fluxos como "MVP manual via banco de dados"
- **Lacunas**: Nenhuma documentação dedicada para features (conversas, kanban, contatos, tarefas, canais), nenhum índice de rotas, nenhum arquivo de contexto para IA, dados reais de planos/roles dispersos e errados

A nova documentação precisava ser a **fonte de verdade** para desenvolvimento em Next.js + Supabase e servir como contexto para agentes de IA.

---

## O que foi feito

### Fase 1 — Auditoria
Leitura completa de todos os 39 arquivos existentes, do arquivo `temp/review-docs.md` com correções, e dos 3 arquivos SQL de schema (`public.sql`, `billing.sql`, `classroom.sql`). Produção de relatório catalogando cada arquivo como DROP/REWRITE/KEEP/MERGE, listando referências quebradas, mapeando correções do review-docs e identificando lacunas.

### Fase 2 — Estrutura Proposta
Definição da nova árvore de pastas `docs/` com 42 arquivos em 12 pastas, seguindo princípios: um tópico por arquivo, sem duplicação, links ao invés de repetição, paths corretos para `supabase/schemas/`.

### Fase 3 — Escrita (4 chunks)
Escrita de todos os 43 arquivos markdown:

| Chunk | Escopo | Arquivos | Tipo de conteúdo |
|-------|--------|----------|-----------------|
| **A** | `database/` | 10 | Gerado a partir dos SQL sources — schemas completos com todas as colunas, tipos e FKs corretos |
| **B** | `features/` | 8 | Extraído do PRD e pages doc — cada feature com tabelas, funções, fluxos e regras de negócio |
| **C** | `architecture/`, `design/`, `edge-functions/`, `components/`, `api/` | 13 | Reescrito (arch/auth com correções do review-docs) + migrado (edge functions, guides) |
| **D** | `references/`, `ai-context/`, `guides/`, `decisions/`, README | 12 | Dados reais do banco (planos, roles, enums) + resumo IA + convenções + ADR/PRD reescritos |

### Correções aplicadas (principais)
- IDs corrigidos para `bigint` (não uuid) em todas as tabelas billing
- `base_price` (não `base_price_cents`), `unit_price` (não `unit_price_cents`)
- `users_accounts` documentado corretamente como apenas para contas adicionais
- Owner identificado por `role_id` com slug `owner`, não por `accounts.created_by_user_id`
- Invite cria registro em `public.users` (não em `users_accounts`)
- Permissões no formato real `{"recurso": ["create","read","update","delete"]}` (não `can_delete_deals`)
- Todos os paths atualizados para `supabase/schemas/<schema>/`
- Linguagem MVP removida — documentação reflete estado de produção

---

## Arquivos deste plano

| Arquivo | Propósito |
|---------|-----------|
| [phase-1-audit.md](./phase-1-audit.md) | Relatório de auditoria: status de cada arquivo (DROP/REWRITE/KEEP/MERGE), referências quebradas, correções mapeadas, lacunas identificadas |
| [phase-2-structure.md](./phase-2-structure.md) | Estrutura aprovada do `docs/`: árvore de arquivos, mapeamento de fontes, atribuição de chunks |
| [phase-3-progress.md](./phase-3-progress.md) | Tracker de progresso: checklist de todos os 43 arquivos com status de conclusão |

---

## Resultado final

```
docs/                          # 43 arquivos em 12 pastas
├── README.md                     # Índice mestre
├── architecture/ (3)             # Stack, auth, integrações
├── design/ (1)                   # Design system e UX
├── database/ (10)                # Schemas, funções, triggers, RLS, views, storage
├── edge-functions/ (7)           # Índice + 6 edge functions
├── features/ (8)                 # Conversas, kanban, contatos, tarefas, canais, billing, classroom, admin
├── api/ (1)                      # Índice de rotas
├── components/ (1)               # Convenções de componentes
├── references/ (3)               # Planos, roles, enums (dados reais do banco)
├── guides/ (3)                   # Next.js, Shadcn, TypeScript+Zod
├── decisions/ (2)                # ADR e PRD reescritos
└── ai-context/ (3)               # Resumo do projeto, feature map, convenções
```

### Próximos passos sugeridos
- Revisar os arquivos em `docs/` e validar contra o estado atual do código
- Quando satisfeito, substituir `docs/` por `docs/` (renomear)
- Atualizar referências no `.agent/rules/database-changes.md` para apontar para a nova estrutura
- Atualizar o `README.md` raiz do projeto para apontar para `docs/` (ou `docs/` após renomear)
