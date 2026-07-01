# Changelog — Padronização de Comandos Supabase CLI

**Data:** 2026-03-30
**Scope:** Remoção dos scripts `pnpm db:*` e padronização do projeto inteiro em comandos diretos do Supabase CLI (`supabase <command>`), alinhados com a documentação oficial. Correção do uso de `--linked` no workflow de declarative schemas.

---

## Contexto

O projeto possuía 7 scripts `db:*` no `package.json` que traduziam comandos do Supabase CLI (ex: `pnpm db:push` → `supabase db push --linked`). Isso causava:

- Inconsistência interna: mix de `pnpm run db:*`, `pnpm exec supabase` e `supabase` em diferentes docs
- Divergência com a documentação oficial do Supabase, que usa `supabase <command>` direto
- O script `db:diff` estava **errado** para declarative schemas: executava `supabase db diff --linked` (diffa contra o remoto), quando o correto é `supabase db diff -f <nome>` (diffa schema files contra shadow DB local, sem `--linked`)

---

## Arquivos Alterados

### `package.json`
- **Removidos** os 7 scripts `db:*`: `db:login`, `db:link`, `db:types`, `db:pull`, `db:push`, `db:diff`, `db:new`

### `AGENTS.md`
- Removida linha `pnpm db:types` da tabela de Comandos
- Tabela "Comandos de Banco de Dados" reescrita com comandos diretos do Supabase CLI:
  - `supabase login`
  - `supabase link --project-ref <ref>`
  - `supabase db diff -f <nome>`
  - `supabase db push --dry-run`
  - `supabase db push`
  - `supabase db pull`
  - `supabase migration new <nome>`
  - `supabase gen types typescript --linked > src/lib/database.types.ts`

### `docs/database/overview.md`
- **Setup Inicial**: substituídos `pnpm run db:login`, `pnpm run db:link`, `pnpm run db:pull` pelos comandos `supabase` diretos; adicionada nota sobre `pnpm exec supabase` como alternativa se o CLI não estiver no PATH global
- **Comandos Frequentes**: tabela reescrita com `supabase <command>` em todos os itens
- **Workflow de Alteração**: corrigido o uso de `supabase db diff -f <nome>` (sem `--linked`); adicionada explicação do comportamento e nota de revisão manual para caveats do migra
- **Ambientes**: seção expandida — documentados os **dois projetos Supabase** separados (dev e prod), com tabela de mapeamento Projeto → Uso → Branch → Configuração, e adicionado o **Workflow Completo (Development → Production)** com todos os passos de link, diff, push e geração de tipos
- **Troubleshooting**: corrigidos `pnpm exec supabase migration repair` → `supabase migration repair` e referência ao título da seção `db:pull` → `db pull`
- **Boas práticas**: corrigido `pnpm exec supabase migration new` → `supabase migration new`

### `.agents/rules/database-changes.md`
- **Zero Autonomy**: lista de comandos proibidos atualizada de `pnpm db:*` para `supabase db push`, `supabase db pull`, etc.
- **Declarative Workflow**: passo 2 corrigido de `pnpm run db:diff` para `supabase db diff -f <nome_descritivo>` com nota explícita de **não usar `--linked`**; adicionado passo de revisão manual para caveats; adicionado uso de `--dry-run`

### `docs/guides/frontend-guide.md`
- Aviso "Autonomia Zero para Banco": `db:push`, `db:pull`, `db:diff` → `supabase db push`, `supabase db pull`, `supabase db diff`

### `docs/guides/shadcn.md`
- Comando de geração de tipos: `pnpm db:types` → `supabase gen types typescript --linked > src/lib/database.types.ts`

### `docs/decisions/adr.md`
- ADR-007: referência `db:diff` → `supabase db diff -f <nome>`

### `README.md`
- Nota de schema changes: `db push` / `db diff` → `supabase db push` / `supabase db diff -f <nome>`

### `docs/edge-functions/overview.md`
- Todos os comandos: `pnpm exec supabase functions <cmd>` → `supabase functions <cmd>`

---

## Arquivos NÃO Alterados

### `.agents/rules/declarative-database-schema.md`
- Revertido pelo desenvolvedor. O arquivo já usava `supabase db diff -f` corretamente. A única alteração proposta era remover o `supabase stop` do passo 3 e adicionar nota sobre `--linked` — mantido no estado original por decisão do desenvolvedor.

### `docs/ai-context/conventions.md`
- Já estava correto (`supabase db diff`, `supabase migration new`) — sem necessidade de alteração.

---

## Decisões Técnicas

| Decisão | Escolha |
|---------|---------|
| Padrão de comando | `supabase <command>` (idêntico à documentação oficial) |
| `pnpm exec supabase` | Mencionado como alternativa para quem não tem o CLI global |
| `--linked` no `db diff` | **NÃO usar** no workflow declarativo — opera com shadow DB local |
| `--linked` no `db push` / `db pull` / `gen types` | Recomendado — torna o target explícito |
| Scripts `db:*` no `package.json` | Removidos — sem vantagem sobre os comandos diretos |
| CI/CD (GitHub Actions) | Fora do escopo desta task |
