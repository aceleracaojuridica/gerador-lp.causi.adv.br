# Plan: Padronizar Comandos Supabase CLI

Remover todos os scripts `pnpm db:*` do `package.json` e padronizar o projeto inteiro em comandos diretos do Supabase CLI (`supabase <command>`), alinhados com a documentação oficial. Corrigir o uso errado de `--linked` no workflow de declarative schemas.

---

### Respostas às suas dúvidas

#### Dúvida 1 — Scripts `db:*` têm vantagem?

**Não.** Os scripts causam mais problemas do que resolvem:

1. **Inconsistência interna**: O projeto já mistura `pnpm run db:*`, `pnpm exec supabase`, e `supabase` em diferentes docs (edge functions usam `pnpm exec supabase functions deploy`, mas DB usa `pnpm db:push`).
2. **Diverge da docs oficial**: Toda a documentação do Supabase usa `supabase <command>` direto. Num contexto AI Driven, o agente lê docs oficiais e propõe `supabase db push` — se o projeto exige `pnpm db:push`, cria confusão.
3. **O script `db:diff` está ERRADO para declarative schemas**: Ele executa `supabase db diff --linked`, que diffa migrations contra o banco remoto. No workflow declarativo, o correto é `supabase db diff -f <nome>` (sem `--linked`), que diffa os schemas declarativos contra o shadow database local.
4. **Quando o dev precisa de flags extras** (`--dry-run`, `-f <nome>`, `--include-seed`, `--include-roles`), o script limita em vez de ajudar.

#### Dúvida 2 — Quando usar `--linked`?

O CLI tem 3 targets: `--local` (banco local via `supabase start`), `--linked` (Cloud via `supabase link`), `--db-url` (URL direta).

| Comando | `--linked` necessário? | Motivo |
|---------|:---:|--------|
| `supabase db diff -f <nome>` | **NÃO** | Declarative schemas: diffa schema files vs shadow DB local (Docker). Não toca no remoto. |
| `supabase db push` | Recomendado | Sem flag já usa o projeto linkado, mas `--linked` torna explícito. |
| `supabase db pull` | Recomendado | Idem. |
| `supabase gen types typescript` | **SIM** | Sem flag, gera do banco local. Precisa de `--linked` para gerar do Cloud. |
| `supabase migration new <nome>` | **NÃO** | Operação puramente local (cria arquivo). |
| `supabase link --project-ref <ref>` | N/A | É o comando que define o link. |

**O ponto crítico**: `supabase db diff -f <nome>` para declarative schemas opera 100% local (Docker + shadow DB). O `--linked` mudaria completamente o comportamento — diffaria contra o banco remoto em vez de contra os schema files.

---

### Workflow Correto para Declarative Schemas

```
# 1. Editar schemas → supabase/schemas/<schema>/<tipo>/<arquivo>.sql

# 2. Gerar migration (requer Docker)
supabase db diff -f <nome_descritivo>

# 3. Revisar migration gerada (⚠️ RLS, DML, views podem não ser capturados)
#    supabase/migrations/<timestamp>_<nome>.sql

# 4. Linkar ao projeto develop
supabase link --project-ref <dev-ref>

# 5. Aplicar (--dry-run antes recomendado)
supabase db push

# 6. Gerar tipos TS
supabase gen types typescript --linked > src/lib/database.types.ts
```

Para **caveats do migra** (DML, alter policy, view ownership): criar migration manual com `supabase migration new <nome>` e editar o arquivo.

---

### Steps

**Phase 1 — package.json**
1. Remover os 7 scripts `db:*` (`db:login`, `db:link`, `db:types`, `db:pull`, `db:push`, `db:diff`, `db:new`)

**Phase 2 — Documentação central**
2. Atualizar `AGENTS.md` — tabela de comandos DB com `supabase <command>` direto
3. Reescrever `docs/database/overview.md` — Setup Inicial, Comandos Frequentes, Workflow de Alteração (fix `db diff` sem `--linked`)
4. Atualizar `.agents/rules/database-changes.md` — lista de comandos no Zero Autonomy

**Phase 3 — Referências dispersas** *(parallel)*
5. `docs/ai-context/conventions.md` ~linha 87 — referências de CLI
6. `docs/guides/frontend-guide.md` ~linha 129 — Autonomia Zero
7. `docs/guides/shadcn.md` ~linha 615 — `db:types`
8. `docs/decisions/adr.md` ~linha 103 — referência `db:diff`
9. `README.md` ~linha 368 — referências de CLI
10. `docs/edge-functions/overview.md` — já usa `pnpm exec supabase`, padronizar com `supabase`

**Phase 4 — Verificar regra de declarative schemas**
11. `.agents/rules/declarative-database-schema.md` — já usa `supabase db diff -f` corretamente, verificar consistência geral

---

### Relevant Files

- `package.json` — remover 7 scripts `db:*`
- `AGENTS.md` — reescrever tabela de comandos DB
- `docs/database/overview.md` — principal reescrita (setup, comandos, workflow, troubleshooting)
- `.agents/rules/database-changes.md` — atualizar Zero Autonomy
- `docs/ai-context/conventions.md` — referências de CLI
- `docs/guides/frontend-guide.md` — Autonomia Zero
- `docs/guides/shadcn.md` — referência `db:types`
- `docs/decisions/adr.md` — referência `db:diff`
- `README.md` — referências de CLI
- `docs/edge-functions/overview.md` — padronizar
- `.agents/rules/declarative-database-schema.md` — verificar

---

### Verification

1. Buscar no projeto inteiro por `pnpm db:` e `pnpm run db:` — deve retornar **zero** resultados
2. Buscar por `npx supabase` — deve retornar **zero**
3. Confirmar que `docs/database/overview.md` documenta o workflow completo com declarative schemas e o ciclo dev→prod
4. Confirmar que `.agents/rules/database-changes.md` lista todos os comandos que a IA não deve executar autonomamente
5. `pnpm build` — garantir que nenhum script removido era referenciado no build

---

### Decisions

- **Padrão**: `supabase <command>` em toda documentação (idêntico aos docs oficiais). Nota que `pnpm exec supabase` funciona se não estiver global.
- **`--linked` explícito**: Recomendar para `db push`, `db pull`, `gen types`. **Nunca** para `db diff -f` no workflow declarativo.
- **Docker obrigatório para diff**: Documentar que `supabase db diff` requer Docker rodando.
- **Migrations manuais**: Documentar caveats do migra e quando usar `supabase migration new`.
- **Scope excluído**: CI/CD (GitHub Actions) não faz parte deste plano — evolução futura.

### Further Considerations

1. **`pnpm exec supabase` vs `supabase` global**: Na documentação, usar `supabase` direto (como os docs oficiais). Adicionar uma nota no setup sobre como garantir que o comando funcione: ou instalar globalmente, ou usar `pnpm exec supabase`. **Recomendação: `supabase` direto, com nota sobre `pnpm exec`.**
