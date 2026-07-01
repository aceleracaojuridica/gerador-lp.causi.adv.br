---
title: Views SQL
description: Views do banco — sumários, detalhamento e classroom com performance e segurança
source: supabase/schemas/public/views/, supabase/schemas/billing/views/, supabase/schemas/classroom/views/
---

# Views SQL — Resumo

Views abstraem consultas SQL complexas, joins e agregações para consumo direto pelo Supabase SDK (Data API) no frontend.

> **Fonte**: Os arquivos SQL estão em:
> - [`supabase/schemas/public/views/`](../../supabase/schemas/public/views/)
> - [`supabase/schemas/billing/views/`](../../supabase/schemas/billing/views/)
> - [`supabase/schemas/classroom/views/`](../../supabase/schemas/classroom/views/)

---

## Por que Views?

- **Performance**: Views executam agregações nativamente no PostgreSQL. Um `await supabase.from('deals_summary').select('*')` substitui múltiplas chamadas + processamento JS.
- **Economia**: Reduz latência, tamanho da resposta HTTP e complexidade do frontend.
- **Serverless/Edge**: Em cenários Serverless, views são a diferença entre 5 `Promise.all()` com cruzamentos JS e 1 chamada que entrega tudo pronto.

---

## Segurança (Security Invoker)

Toda view acessada por usuários autenticados **DEVE** usar `WITH (security_invoker = true)`. Isso garante que as políticas RLS do usuário autenticado sejam respeitadas.

```sql
CREATE VIEW minha_view WITH (security_invoker = true) AS ...
```

---

## Sumários (Agregações de KPIs/Contagens)

Usadas para tabelas, datagrids e KPIs em dashboards.

| View | Arquivo | Descrição |
|------|---------|-----------|
| `accounts_summary_v2` | [`accounts_summary_v2.sql`](../../supabase/schemas/public/views/accounts_summary_v2.sql) | Dados completos de contas com 7 contagens (persons, deals, conversations, pipelines, channels, agents, users), `owner_name` e objeto `subscription` completo (plano, preços, datas, status, limites) |
| `channels_summary` | [`channels_summary.sql`](../../supabase/schemas/public/views/channels_summary.sql) | Dados de canais enriquecidos com `pipeline_name`, `agent_id` e `agent_name` |
| `deals_summary` | [`deals_summary.sql`](../../supabase/schemas/public/views/deals_summary.sql) | Deals com owner, pessoa, stage, pipeline, canal, conversa, `last_message` (JSONB), `overdue_task` (JSONB), `new_messages` (count limitado a 10) e `tags` — usado no Kanban |
| `organizations_summary` | [`organizations_summary.sql`](../../supabase/schemas/public/views/organizations_summary.sql) | Organizações com contagem de contatos vinculados |
| `persons_summary` | [`persons_summary.sql`](../../supabase/schemas/public/views/persons_summary.sql) | Contatos com `primary_phone` (formatado sem `+`), `primary_email` e `organization_name` — usado em listas e datagrids |
| `pipelines_summary` | [`pipelines_summary.sql`](../../supabase/schemas/public/views/pipelines_summary.sql) | Métrica macro: total de deals por pipeline |
| `subscriptions_summary` | [`subscriptions_summary.sql`](../../supabase/schemas/billing/views/subscriptions_summary.sql) | Assinaturas com `plan_name`, `plan_period_name` e `plan_features` — painel admin |
| `tags_summary` | [`tags_summary.sql`](../../supabase/schemas/public/views/tags_summary.sql) | Etiquetas com contagem de uso |
| `tasks_summary` | [`tasks_summary.sql`](../../supabase/schemas/public/views/tasks_summary.sql) | Tarefas com `owner_name`, `deal_name`, `person_name`, `pipeline_name` e `pipeline_stage_name` — ordenação por `due_time` feita no cliente |
| `proxies_in_use` | [`proxies_in_use.sql`](../../supabase/schemas/public/views/proxies_in_use.sql) | `host` e `port` extraídos de `channels.config->proxy` — view interna sem `security_invoker` (**⚠️ não segue a convenção RLS**) |

---

## Detalhamento (Full Context para Páginas)

Views que fornecem dados completos para páginas específicas, evitando múltiplos joins no SDK.

| View | Arquivo | Descrição |
|------|---------|-----------|
| `agents_details` | [`agents_details.sql`](../../supabase/schemas/public/views/agents_details.sql) | Dados completos de agentes com `channel_name`, `channel_type`, `channel_status` e todas as conversas associadas (um registro por conversa) |
| `conversations_details` | [`conversations_details.sql`](../../supabase/schemas/public/views/conversations_details.sql) | Dados da página `/conversas` — mescla conversas, mensagens, contatos e canais em 1 chamada |
| `persons_details` | [`persons_details.sql`](../../supabase/schemas/public/views/persons_details.sql) | Visualização lateral completa: `emails` (JSONB array), `phones` (JSONB array com `full_phone`), `socials` (JSONB com facebook, instagram, linkedin, x, youtube) e `organization_name` |
| `pipeline_details` | [`pipeline_details.sql`](../../supabase/schemas/public/views/pipeline_details.sql) | Pipeline com `stages` (JSONB array), `channels` (JSONB array), `agents` (JSONB array) e `deal_count` — usado na página de configuração de pipelines |
| `user_details` | [`user_details.sql`](../../supabase/schemas/public/views/user_details.sql) | Dados do usuário com `account_name`, `account_currency`, `role_name` e `last_sign_in_at` — não inclui dados de assinatura |
| `workflow_agents` | [`workflow_agents.sql`](../../supabase/schemas/public/views/workflow_agents.sql) | View para automações/n8n — JSON plano para consumo externo |
| `workflow_conversations` | [`workflow_conversations.sql`](../../supabase/schemas/public/views/workflow_conversations.sql) | View para automações — conversas em formato plano |

---

## Classroom (LMS)

| View | Arquivo | Descrição |
|------|---------|-----------|
| `lessons_view` | [`lessons_view.sql`](../../supabase/schemas/classroom/views/lessons_view.sql) | Lista aulas ativas com controle de acesso via `has_module_access()`: retorna **0 linhas** para usuários sem `has_classroom`; retorna `NULL` em `content` e `video_url` para aulas premium (`is_lesson_premium`) quando o usuário não tem `has_classroom_premium`. Opera como `SECURITY DEFINER` (padrão — sem `security_invoker`) para acessar metadados mesmo quando RLS bloqueia `lessons` diretamente |

---

## Uso no Next.js

Views são consumidas pelo Supabase SDK como se fossem tabelas:

```typescript
// Exemplo: buscar dados do Kanban
const { data } = await supabase
  .from('deals_summary')
  .select('*')
  .eq('account_id', accountId)
```

---

## Manutenção

- **Renaming de colunas**: Se uma tabela base alterar o nome de uma coluna, a view deve ser recriada (`DROP VIEW` + `CREATE VIEW`), pois PostgreSQL bloqueia edições em tabelas com views dependentes.
- **Nomenclatura**: Use o nome da view no `supabase.from()` — o SDK trata como tabela virtual.
- **Performance**: Para views com alto volume, considere materializar (MATERIALIZED VIEW) se a latência for crítica.
