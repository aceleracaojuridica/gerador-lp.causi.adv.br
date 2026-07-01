# Plano de Revisão da Documentação Causi

Data: 2026-03-30
Branch: feature/lucas

---

## Objetivo

Revisar e corrigir toda a documentação do projeto em `docs/` e `.agents/rules/`, garantindo que esteja alinhada com o estado atual do código-fonte, sem redundâncias e com informações precisas.

---

## Metodologia

### Fase 1 — Exploração

Exploração paralela do código-fonte em 3 frentes:
1. **Estrutura do projeto**: `package.json`, `AGENTS.md`, `src/app/`, `.agents/rules/`, `supabase/config.toml`, `.env.example`
2. **Banco de dados**: Todos os docs de `docs/database/`, todos os `.sql` em `supabase/schemas/`, verificação de funções, views e RLS policies
3. **Arquitetura e API**: `docs/architecture/`, `docs/api/`, `docs/edge-functions/`, `docs/decisions/`, `docs/references/`, `docs/features/`, estrutura real de rotas em `src/app/`

### Fase 2 — Cruzamento e Identificação de Problemas

Cruzamento da documentação com o estado real do código para identificar:
- Rotas documentadas que não existem ou estão com nomes errados
- Funções SQL referenciadas com nomes incorretos
- Contagens desatualizadas
- Comandos CLI usando `npx` em vez de `pnpm`
- Informações faltantes (integrações IA, ambientes, fluxo declarativo)
- Conteúdo corrompido ou duplicado
- Documentação dispersa sobre o mesmo assunto

### Fase 3 — Implementação

Correções organizadas em 6 subtarefas + consolidação de documentação.

---

## Subtarefas

### Subtarefa 1: Correção da Estrutura de Rotas (6+ arquivos)

**Problema**: A estrutura de rotas documentada estava completamente desalinhada com `src/app/`.

**Verificações realizadas**:
- `src/app/(auth)/` — pastas reais: `cadastrar/`, `login/`, `redefinir/`
- `src/app/(app)/` — grupos reais: `(agentes)`, `(oportunidades)`, `(configuracoes)`, `(pessoas)`
- `src/app/(admin)/` — grupo separado (não dentro de `(app)/`)
- Parâmetros dinâmicos: `[pipelineId]` (camelCase), `[conversation-id]` e `[agent-id]` (kebab-case), `[id]` (simples)
- `/cursos/*` — nenhuma página implementada no frontend
- `src/app/api/` — diretório inexistente

**Arquivos corrigidos**: `docs/api/routes.md`, `docs/architecture/overview.md`, `docs/ai-context/project-summary.md`, `docs/ai-context/feature-map.md`, `docs/decisions/prd.md`, `docs/features/kanban.md`, `docs/features/admin-panel.md`, `docs/design/overview.md`

### Subtarefa 2: Correções de Documentação do Banco de Dados (6 arquivos)

**Problemas encontrados**:
- Contagem de tabelas public: documentado 22, real 24 (24 arquivos em `supabase/schemas/public/tables/`)
- DELETE RLS: documentado como "restrito a super admins", real permite para qualquer usuário com permissão `delete`
- `lessons_view`: documentado com coluna `is_locked`, real usa NULL masking em `content` e `video_url`
- `messages_queue`: faltava nota de que é utilizada pelo N8N, não pelas Edge Functions
- Comandos `npx supabase` em vez de `pnpm exec supabase`
- Faltava seção sobre fluxo declarativo de schemas e ambientes (dev/prod)

**Arquivos corrigidos**: `docs/database/rls.md`, `docs/database/views.md`, `docs/database/schema-classroom.md`, `docs/database/schema-public.md`, `docs/database/overview.md`, `docs/README.md`

### Subtarefa 3: Correções de Documentação de Arquitetura (3 arquivos)

**Problemas encontrados**:
- `validate_account_invitation` referenciada em `auth.md` — função não existe, correto é `is_valid_invite_for_user`
- Exemplo Realtime usava `messages` com filtro `account_id`, mas `messages` não tem essa coluna
- Faltava nota sobre `SERVICE_ROLE_KEY` (primariamente para Edge Functions, não admin in-app)
- Faltava seção de Integrações de IA e descrição do fluxo N8N em `integrations.md`

**Arquivos corrigidos**: `docs/architecture/auth.md`, `docs/architecture/overview.md`, `docs/architecture/integrations.md`

### Subtarefa 4: Correções em Guias e Rules (5 arquivos)

**Problemas encontrados**:
- Fontes: Merriweather e JetBrains Mono documentadas mas não carregadas (só Inter)
- `npx supabase` em Edge Functions overview
- `npx shadcn-ui@latest` → `pnpm dlx shadcn@latest`
- `npm install` → `pnpm add` em guias
- Conteúdo corrompido em `.agents/rules/database-changes.md` (texto garbled + duplicado)
- Soft delete: `deleted_at` documentado como convenção, real usa `is_active`

**Arquivos corrigidos**: `docs/design/overview.md`, `docs/guides/frontend-guide.md`, `docs/edge-functions/overview.md`, `docs/guides/shadcn.md`, `docs/guides/typescript-e-zod.md`, `.agents/rules/database-changes.md`

### Subtarefa 5: Documentos de Referência e Decisões (3 arquivos)

**Problemas encontrados**:
- Faltava menção a `is_super_admin()` em roles-and-permissions.md
- ADR-004: título "sem signup público geral" enganoso (signup habilitado para educacional)
- ADR-005: justificativa fraca (faltava foco em isolamento de dados entre escritórios)
- ADR-007: não mencionava declarative-database-schemas
- PRD: `account_invitations` descrito como cadastro geral (é para adicionar membros a contas existentes)

**Arquivos corrigidos**: `docs/references/roles-and-permissions.md`, `docs/decisions/adr.md`, `docs/decisions/prd.md`

### Subtarefa 6: Melhorias Estruturais (3 arquivos)

- README: nota que `ai-context/` serve tanto IA quanto devs humanos
- `conventions.md`: convenção de parâmetros dinâmicos camelCase
- `project-summary.md`: stack formatada como lista, nomes de tabelas em inglês

### Consolidação de Documentação Dispersa

**Problema**: Informações sobre componentes, convenções e regras de banco estavam repetidas em até 3 arquivos diferentes.

**Ações**:
- `docs/components/overview.md` (95% duplicado com `conventions.md`) → reduzido a resumo com redirect
- `conventions.md` absorveu conteúdo único: JSDoc (4 seções), exemplo NUQS, regras shadcn
- `.agents/rules/database-changes.md` → enxugado para guardrails (Zero Autonomy, Enum Rules) + referências
- `.agents/rules/nextjs-structure.md` → enxugado para conteúdo único (JSDoc, Source of Truth) + referência
- `.agents/rules/shadcn.md` → mantido como está (já conciso e complementar)

### Subtarefa 7: Revisão de AGENTS.md e package.json

**Problema**: Verificação via docs do Supabase CLI (https://supabase.com/docs/reference/cli/supabase-db) confirmou que `supabase db migrate` NÃO existe como comando. O script `db:migrate` no `package.json` era inválido.

**Verificações realizadas**:
- `supabase db push` — existe, `--linked` válido
- `supabase db pull` — existe, `--linked` válido
- `supabase db diff` — existe, `--linked` válido
- `supabase db migrate` — **NÃO EXISTE**
- `supabase migration new` — existe (cria migration vazia)
- `supabase link --project-ref` — existe
- `supabase gen types --linked` — existe

**Ações**:
- `package.json`: `db:migrate` (inválido) → `db:new` (`supabase migration new`)
- `AGENTS.md`: "Run migrations / `pnpm db:migrate`" → "Create empty migration / `pnpm db:new <name>`"
- `.agents/rules/database-changes.md`: `db:migrate` → `db:new` na lista de comandos restritos
- `docs/guides/frontend-guide.md`: `db:migrate` → `db:diff` no aviso de Autonomia Zero
- Demais campos do `AGENTS.md` verificados e confirmados corretos (stack, comandos, regras, referências)

---

## Decisões do Usuário

| Pergunta | Resposta |
|----------|---------|
| `npx supabase` substituir por? | `pnpm exec supabase` (CLI é devDependency) |
| Renomear `ai-context/`? | Não, apenas nota no README |
| `messages_queue` — quem insere? | N8N insere (Edge Function envia para N8N) |
| Parâmetros de rota inconsistentes? | Documentar estado atual (misto) + convenção camelCase para novos |
| Husky não instalado? | Manter referências (instalado em outra branch que será mergeada) |
