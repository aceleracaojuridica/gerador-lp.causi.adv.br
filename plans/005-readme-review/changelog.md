# Changelog: Revisão do README.md

Data: 2026-03-30

---

## README.md (raiz)

### Removido
- Imagem `causi.webp` (arquivo não existe) → substituída por `oportunidades-preview.webp`
- Seção "Documentação" antiga com 17 links todos quebrados (prefixos numéricos `001-`, `002-`, etc.)
- Seção "Documentação Individual das Edge Functions" (tabela separada duplicada)
- Seção "Guias para Desenvolvedores" com link inválido para `nextjs-guia-completo.md`
- Seção "Guias de Implementação (v2)" — docs `docs/v2/` não existem mais
- Seção "Rules" com paths `.agent/rules/` incorretos e apenas 3 rules desatualizadas
- Seção "ADR — Estrutura recomendada do projeto" com bloco de código desatualizado e referência a `docs/src-structure.mmd` (inexistente)
- Seção "Estrutura de Rotas e Páginas" (~100 linhas) com links quebrados para `docs/004-pages-and-navigation.md` e `docs/adr.md`
- Seção "Boas práticas" com fluxo Git detalhado (~80 linhas) — migrado para `docs/guides/git-workflow.md`
- Seção "Documentações" no final com links externos avulsos para Supabase CLI
- Typo: "evintando" corrigido para "evitando"
- Typo: título "Docuemntações" corrigido (seção removida)
- Formatação incorreta de callout `> ![NOTE]` → `> [!NOTE]`

### Adicionado
- **Seção "Comandos Principais"**: tabela com `pnpm dev`, `pnpm build`, `pnpm lint`, `pnpm format`, `pnpm typecheck`
- **Seção "Documentação" reescrita**: aponta para `docs/README.md` como índice mestre + tabelas por categoria cobrindo toda a estrutura atual de `docs/`
  - Contexto Rápido: `ai-context/project-summary`, `conventions`, `feature-map`
  - Arquitetura: `overview`, `auth`, `integrations`
  - Banco de Dados: todos os 8 sub-docs (`overview`, schemas, `rls`, `functions`, `triggers`, `views`, `constraints`, `storage`)
  - Features: todos os 8 docs de features (`conversations`, `kanban`, `contacts`, `tasks`, `channels`, `subscriptions`, `classroom`, `admin-panel`)
  - Edge Functions: `overview` + 6 handlers individuais
  - Guias: `nextjs`, `git-workflow`, `frontend-guide`, `shadcn`, `typescript-e-zod`
  - Decisões & Referências: `prd`, `adr`, `plans-and-features`, `roles-and-permissions`, `statuses-and-enums`, `design/overview`, `api/routes`

### Atualizado
- **Stack Tecnológica**: adicionados React 19, Tailwind CSS 4, Shadcn UI, Edge Functions (Deno), WAHA, Biome, Husky, Zod; link para `docs/architecture/overview.md` e `docs/decisions/adr.md`
- **Rules**: path corrigido `.agent/` → `.agents/`; lista atualizada de 3 para 11 rules com descrições (reflete `.agents/rules/` real)
- **Skills**: path corrigido `.agent/` → `.agents/`
- **Seção "Configuração do Editor"**: path corrigido `.agent/` → `.agents/` nas instruções
- **Commits Semânticos**: mantidos com tabela completa (11 prefixos)
- **Padrão de prompt**: mantido com os 3 passos expandidos
- **Git Workflow**: ~80 linhas de comandos substituídas por resumo de 6 linhas + link para `docs/guides/git-workflow.md`

---

## docs/guides/git-workflow.md

### Adicionado
- **Seção "Fluxo de Branches"**: conteúdo migrado do README com diagrama Mermaid, comandos para criar branch, integrar em `develop`, subir `develop` para `main` via PR, e manter branches sincronizadas

---

## Métricas

| Métrica | Antes | Depois |
|---|---|---|
| Linhas no README | ~490 | ~285 |
| Links internos quebrados | 24+ | 0 |
| Docs referenciados | 17 (maioria inválidos) | 40+ (todos válidos) |
| Rules listadas | 3 (desatualizadas) | 11 (completas) |
