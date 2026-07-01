# Changelog — Revisão da Documentação

Data: 2026-03-30
Branch: feature/lucas

---

## Arquivos Modificados (total: 26)

### `docs/api/routes.md`
- Rotas auth: `signup` → `cadastrar`, `forgot-password` → `redefinir`, removido `verify`
- Adicionada rota `/oportunidades` (página de listagem)
- `[pipeline-id]` → `[pipelineId]`
- Adicionada seção Agentes (`/agentes`, `/agentes/[agent-id]`)
- `/cursos/*` marcado como planejado (não implementado no frontend)
- `[account-id]` → `[id]` no admin
- Admin anotado como grupo separado `(admin)/`
- Agentes adicionado no menu sidebar
- Árvore de pastas reescrita com estrutura real

### `docs/architecture/overview.md`
- WAHA adicionado na stack de integrações
- Árvore de pastas reescrita com estrutura real
- Rotas auth corrigidas
- Exemplo Realtime corrigido: `messages` não tem `account_id`, adicionados 2 exemplos corretos (por `conversation_id` e por `account_id` na tabela `conversations`)
- Nota sobre `SERVICE_ROLE_KEY` (primariamente Edge Functions, super admins têm RLS Full access)

### `docs/architecture/auth.md`
- `validate_account_invitation` → `is_valid_invite_for_user(p_email, p_account_id, p_token)`

### `docs/architecture/integrations.md`
- Passo 7 "Enfileirar": corrigido para descrever fluxo real (Edge Function → N8N → messages_queue)
- Adicionada seção "Integrações de IA" com N8N, OpenAI (transcrição), modelos configuráveis
- Adicionado "Fluxo do Agente de IA" (6 passos)

### `docs/database/overview.md`
- `22 tabelas` → `24 tabelas`
- `npx supabase` → `pnpm exec supabase` (todas ocorrências)
- Adicionada seção "Fluxo Declarativo de Schemas"
- Adicionada seção "Ambientes" (dev/prod, project-ref)

### `docs/database/rls.md`
- DELETE: "restrito a super admins" → "permitido para usuários com permissão `delete`"
- "Muitas tabelas não permitem DELETE por usuários comuns" → corrigido para refletir realidade

### `docs/database/views.md`
- `lessons_view`: removida menção a `is_locked`, documentado NULL masking condicional

### `docs/database/schema-classroom.md`
- Removida menção a coluna `is_locked`, documentado comportamento real da view

### `docs/database/schema-public.md`
- `22 tabelas` → `24 tabelas`
- `messages_queue`: nota de que é utilizada pelo N8N

### `docs/ai-context/project-summary.md`
- Stack formatada como lista com bullet points
- Nomes de tabelas em inglês
- `22 tabelas` → `24 tabelas`
- Rotas atualizadas com nomes reais
- SERVICE_ROLE_KEY clarificado

### `docs/ai-context/feature-map.md`
- `[pipeline-id]` → `[pipelineId]`
- `/cursos/*` marcado como planejado
- `[account-id]` → `[id]`
- `/auth/*` → rotas reais listadas
- Adicionada rota `/agentes`

### `docs/ai-context/conventions.md`
- Adicionada convenção de parâmetros dinâmicos camelCase
- Adicionada seção JSDoc completa (4 seções obrigatórias)
- Exemplo NUQS com código (absorvido de components/overview.md)
- Regras shadcn expandidas (cn(), CVA, instalação)
- Referências atualizadas (removidos rules, adicionados guides)

### `docs/components/overview.md`
- Reduzido de ~113 linhas para resumo curto com redirect para `conventions.md`

### `docs/decisions/adr.md`
- ADR-004: título corrigido, descrição expandida (signup habilitado para educacional)
- ADR-005: justificativa melhorada (isolamento de dados entre escritórios)
- ADR-007: adicionado Declarative Database Schemas

### `docs/decisions/prd.md`
- `account_invitations`: clarificado como convite para contas existentes
- Rotas auth corrigidas
- `[pipeline-id]` → `[pipelineId]`

### `docs/design/overview.md`
- Fontes: removidos Merriweather e JetBrains Mono (só Inter é carregada)
- `[pipeline-id]` → `[pipelineId]`
- Referência atualizada: `components/overview.md` → `conventions.md`

### `docs/guides/frontend-guide.md`
- Estrutura de pastas: `(auth)` com nomes reais, adicionado `(admin)`, removido `api/`
- `npx shadcn` → `pnpm dlx shadcn`
- Aviso Autonomia Zero: `db:migrate` → `db:diff`

### `docs/guides/shadcn.md`
- `npx shadcn-ui@latest` → `pnpm dlx shadcn@latest`
- `npm install next-themes` → `pnpm add next-themes`

### `docs/guides/typescript-e-zod.md`
- `npm install zod` → `pnpm add zod`

### `docs/edge-functions/overview.md`
- `npx supabase` → `pnpm exec supabase` (todas ocorrências)

### `docs/references/roles-and-permissions.md`
- Adicionado `is_super_admin()` na seção "Como as Permissões são Verificadas"

### `docs/features/kanban.md`
- `[pipeline-id]` → `[pipelineId]`
- Removida nota "(não existe /oportunidades genérico)"

### `docs/features/classroom.md`
- `is_locked` → descrição correta do NULL masking

### `docs/features/admin-panel.md`
- `[account-id]` → `[id]`

### `docs/README.md`
- `22 tabelas` → `24 tabelas`
- Seção "Contexto para IA" → "Contexto Rápido" com nota para devs humanos
- Referência de componentes atualizada para `conventions.md`

### `.agents/rules/database-changes.md`
- Removido conteúdo corrompido
- Enxugado: só Zero Autonomy, Declarative Workflow, Enum Rules + referências
- Soft delete corrigido para `is_active`
- `db:migrate` → `db:new` na lista de comandos restritos

### `.agents/rules/nextjs-structure.md`
- Enxugado: só JSDoc (4 seções), Source of Truth, Next.js docs + referência

### `package.json`
- Script `db:migrate` (comando inexistente no Supabase CLI) → `db:new` (`supabase migration new`)

### `AGENTS.md`
- "Run migrations / `pnpm db:migrate`" → "Create empty migration / `pnpm db:new <name>`"

---

## Resumo por Categoria

| Categoria | Qtd Correções |
|-----------|:---:|
| Rotas incorretas/faltantes | 15+ |
| Contagem de tabelas (22→24) | 5 |
| `npx`/`npm` → `pnpm` | 12 |
| Funções/colunas inexistentes | 3 |
| Informações faltantes (IA, ambientes, schemas) | 4 |
| Redundância/consolidação | 4 |
| Comandos CLI inválidos (`db:migrate`) | 4 |
| Outros (fontes, RLS, SERVICE_ROLE_KEY) | 6 |
