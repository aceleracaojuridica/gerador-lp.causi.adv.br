# Plan: Revisão do README.md do Projeto

Reescrever o `README.md` raiz para refletir a nova estrutura de documentação, corrigir 24+ links quebrados, eliminar duplicação de conteúdo com docs especializados, e manter um README conciso (~285 linhas vs ~490 linhas original).

---

## Diagnóstico — O que está errado

### Links Quebrados (24+)

| Link no README | Status | Localização real |
|---|---|---|
| `./docs/prd.md` | ❌ Movido | `./docs/decisions/prd.md` |
| `./docs/adr.md` | ❌ Movido | `./docs/decisions/adr.md` |
| `./docs/000-docs-index.md` | ❌ Removido | `./docs/README.md` |
| `./docs/001-database.md` | ❌ Removido | `./docs/database/overview.md` |
| `./docs/database/001-public_schema.md` | ❌ Renomeado | `./docs/database/schema-public.md` |
| `./docs/database/002-billing_schema.md` | ❌ Renomeado | `./docs/database/schema-billing.md` |
| `./docs/database/003-classroom_schema.md` | ❌ Renomeado | `./docs/database/schema-classroom.md` |
| `./docs/database/004-rls.md` | ❌ Renomeado | `./docs/database/rls.md` |
| `./docs/database/005-triggers.md` | ❌ Renomeado | `./docs/database/triggers.md` |
| `./docs/database/006-functions.md` | ❌ Renomeado | `./docs/database/functions.md` |
| `./docs/database/007-constraints.md` | ❌ Renomeado | `./docs/database/constraints.md` |
| `./docs/002-RBAC.md` | ❌ Removido | `./docs/references/roles-and-permissions.md` |
| `./docs/003-billing.md` | ❌ Removido | `./docs/features/subscriptions.md` |
| `./docs/004-pages-and-navigation.md` | ❌ Removido | `./docs/api/routes.md` |
| `./docs/005-edge-functions.md` | ❌ Movido | `./docs/edge-functions/overview.md` |
| `./docs/helpers.md` | ❌ Removido | — |
| `./docs/implementation-step_001.md` | ❌ Removido | — |
| `./docs/guides/nextjs-guia-completo.md` | ❌ Renomeado | `./docs/guides/nextjs.md` |
| `./docs/v2/asaas-integration.md` | ❌ Removido | — |
| `./docs/v2/courses-platform.md` | ❌ Removido | — |
| `./docs/v2/whatsapp-business-api.md` | ❌ Removido | — |
| `./docs/src-structure.mmd` | ❌ Removido | — |
| `.agent/rules/*` (3 arquivos) | ❌ Caminho errado | `.agents/rules/` (11 arquivos) |
| `.agent/skills/*` | ❌ Caminho errado | `.agents/skills/` (10 pastas) |
| `/public/causi.webp` | ❌ Não existe | — |

### Conteúdo Duplicado

| Seção no README | Documento especializado |
|---|---|
| Fluxo Git completo (~80 linhas) | `docs/guides/git-workflow.md` |
| Estrutura de Rotas completa (~100 linhas) | `docs/api/routes.md` |
| Estrutura de pastas (ADR trecho) | `docs/architecture/overview.md` |
| Detalhamento Semantic Commits | `docs/guides/git-workflow.md` + `docs/ai-context/conventions.md` |

### Docs Novos Não Referenciados

- `docs/ai-context/` — project-summary, conventions, feature-map
- `docs/features/` — 8 docs de features
- `docs/references/` — plans-and-features, roles-and-permissions, statuses-and-enums
- `docs/components/overview.md`
- `docs/database/storage.md`, `docs/database/views.md`
- `docs/guides/frontend-guide.md`, `docs/guides/shadcn.md`
- `docs/architecture/auth.md`, `docs/architecture/integrations.md`

---

## Steps

### Phase 1 — Header e Introdução
1. Manter badges e descrição curta. Substituir imagem `causi.webp` (não existe) por `oportunidades-preview.webp`
2. Manter seção "O que é o Causi" (texto atual está bom)

### Phase 2 — Stack Tecnológica
3. Atualizar tabela de stack — alinhar com `docs/ai-context/project-summary.md` e `docs/architecture/overview.md`. Adicionar Biome e Husky *(parallel com step 4)*

### Phase 3 — Getting Started
4. Manter seção "Começando" com explicação do pnpm e passos de setup *(parallel com step 3)*

### Phase 4 — Documentação (reescrita completa)
5. Reescrever seção "Documentação": apontar para `docs/README.md` como índice mestre, seguido de tabela resumida refletindo a estrutura real:
   - **Início Rápido**: project-summary, conventions, feature-map
   - **Arquitetura**: overview, auth, integrations
   - **Banco de Dados**: database/overview (com nota dos sub-docs)
   - **Features**: 8 features
   - **Edge Functions**: edge-functions/overview
   - **Guias**: nextjs, git-workflow, shadcn, frontend-guide, typescript-e-zod
   - **Decisões**: prd, adr
   - **Referências**: plans-and-features, roles-and-permissions, statuses-and-enums
6. Remover seções "Guias de Implementação (v2)" e "Docs Individual das Edge Functions" *(parallel com step 5)*

### Phase 5 — Rules e Skills (atualizar)
7. Corrigir caminho `.agent/` → `.agents/`
8. Atualizar lista de Rules: listar as 11 atuais com descrição breve (`code-format-sql`, `database-changes`, `database-create-migration`, `database-functions`, `database-rls-policies`, `declarative-database-schema`, `edge-functions`, `nextjs-structure`, `nextjs-supabase-auth`, `shadcn`, `use-realtime`)
9. Verificar/atualizar lista de Skills (10 atuais)

### Phase 6 — Boas Práticas (simplificar)
10. Manter referência às imagens `editor-settings.png` / `editor-settings-2.png`
11. Manter "Anti vibe-coding" resumido
12. Commits Semânticos: tabela rápida + link para `docs/guides/git-workflow.md`
13. Fluxo Git: eliminar ~80 linhas duplicadas → resumo + link para `docs/guides/git-workflow.md`

### Phase 7 — Seções a remover/simplificar
14. Remover "Estrutura de Rotas e Páginas" (~100 linhas) → resumo + link para `docs/api/routes.md`
15. Remover bloco "ADR — Estrutura recomendada" → link para `docs/architecture/overview.md`
16. Remover referência a `docs/src-structure.mmd`
17. Remover seção "Documentações" com links externos Supabase
18. Manter seção de Variáveis de Ambiente

### Phase 8 — Revisão Final
19. Verificar que todos os links apontam para arquivos existentes
20. Garantir PT-BR consistente
21. Objetivo: ~150-250 linhas

---

## Relevant Files

- `README.md` — reescrita completa
- `docs/guides/git-workflow.md` — adicionada seção "Fluxo de Branches" com conteúdo migrado do README
- `docs/README.md` — índice mestre da documentação (referência, **não modificado**)
- `docs/ai-context/project-summary.md` — alinhamento de descrição/stack
- `docs/architecture/overview.md` — referência para estrutura de pastas e stack
- `docs/api/routes.md` — referência para seção de rotas
- `.agents/rules/` — 11 rules atuais (listadas na tabela)
- `.agents/skills/` — 10 skills atuais (listadas na tabela)

---

## Verification

1. Buscar todos os links internos no README reescrito e confirmar que cada arquivo referenciado existe
2. Buscar por paths antigos com prefixo numérico (`001-`, `002-`, etc.) — deve retornar zero
3. Confirmar `.agents/` (com 's') em todas as referências
4. Confirmar imagem `oportunidades-preview.webp` existe em `public/`
5. Contar linhas — resultado final: ~285 linhas
6. Verificar que nenhum conteúdo extenso duplica docs especializados

---

## Decisions

- **Arquivos modificados**: `README.md` (reescrita) + `docs/guides/git-workflow.md` (adicionada seção de branches)
- **`docs/README.md` não modificado**
- Conteúdo duplicado substituído por links para docs especializados
- Seções v2 removidas (docs não existem mais)
- Imagem header: substituída `causi.webp` por `oportunidades-preview.webp`
- Rules e Skills: tabela resumida com nome + descrição breve
- **Commits Semânticos**: mantidos com tabela completa no README — `git-workflow.md` não cobria esse conteúdo
- **Padrão de prompt**: mantido com os 3 passos expandidos no README — `git-workflow.md` não cobria esse conteúdo
- **Fluxo de branches**: migrado do README para `docs/guides/git-workflow.md`; README mantém resumo de 6 linhas + link para o guia completo