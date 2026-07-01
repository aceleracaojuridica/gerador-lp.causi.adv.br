---
title: RLS (Row-Level Security)
description: Resumo das políticas de segurança por linha — padrões, funções e exceções
source: supabase/schemas/public/rls/, supabase/schemas/billing/rls/, supabase/schemas/classroom/rls/, supabase/schemas/storage/rls/
---

# RLS (Row-Level Security) — Resumo

Todas as tabelas operacionais possuem políticas de RLS baseadas em `account_id` e permissões da role do usuário.

> **Fonte**: Os arquivos SQL estão em:
> - [`supabase/schemas/public/rls/`](../../supabase/schemas/public/rls/)
> - [`supabase/schemas/billing/rls/`](../../supabase/schemas/billing/rls/)
> - [`supabase/schemas/classroom/rls/`](../../supabase/schemas/classroom/rls/)
> - [`supabase/schemas/storage/rls/`](../../supabase/schemas/storage/rls/)

---

## Padrões Principais

### Funções Recorrentes

| Função | Uso |
|--------|-----|
| `is_user_in_account_or_shared(account_id, auth.uid())` | Valida associação do usuário à conta (principal ou compartilhada) |
| `has_user_permission_in_account(uid, account_id, resource, action)` | Verifica permissão específica (`read/create/update/delete`) no account |
| `has_module_access(uid, module_name)` | Controla acesso por módulos (ex: `classroom`, `classroom_premium`) |
| `is_super_admin(uid)` | Detecta super admins para bypass cross-account |

### Padrão Account-Centric

A maioria das tabelas segue o padrão:
1. **SELECT**: Permitido se o usuário pertence à conta (`is_user_in_account_or_shared`) e tem permissão de leitura
2. **INSERT**: Permitido com checagem de permissão `create` + validações adicionais
3. **UPDATE**: Permitido com checagem de permissão `update`
4. **DELETE**: Permitido para usuários com permissão `delete` no recurso correspondente via `has_user_permission_in_account()`, além de super admins via política `Full access`

### Tabelas de Acesso Restrito (service_role / sem policy)

Algumas tabelas têm RLS habilitado mas **sem policies para `authenticated`**, bloqueando totalmente o acesso pelo client:

| Tabela | Acesso | Observação |
|--------|--------|------------|
| `conversation_ai_sessions` | Nenhum (apenas service_role) | RLS ativo, zero policies definidas |
| `messages_queue` | `service_role` full access | Fila interna de envio; client não acessa |

### Tabelas com Acesso Público ou Semi-aberto

| Tabela | Regra |
|--------|-------|
| `roles` | SELECT aberto para todos (`USING true`), sem políticas de escrita |
| `debug_logs` | SELECT próprios registros (ou `IS NULL`); INSERT aberto para `authenticated` e `anon` |

### Super Admin Bypass

Muitas tabelas possuem uma política `Full access <table>` que permite acesso total a super admins (`is_super_admin(auth.uid())`). Este padrão é replicado em todas as tabelas account-scoped.

---

## Resumo por Domínio

### Billing

| Tabela | Leitura | Escrita |
|--------|---------|---------|
| `billing.plans` | Autenticados | Super admin |
| `billing.plan_periods` | Autenticados | Super admin |
| `billing.addons` | Autenticados | Super admin |
| `billing.addon_prices` | Autenticados | Super admin |
| `billing.subscriptions` | Via `is_user_in_account_or_shared(account_id)` | INSERT direto por authenticated com constraints (sem assinatura ativa + plan_id permitido) + super admin |
| `billing.subscription_addons` | Nenhuma (apenas super admin) | Sem policy SELECT para `authenticated`; acesso exclusivo via super admin |
| `billing.payments` | Via subquery em `subscriptions` (`is_user_in_account_or_shared`) | Super admin |

**Regras de negócio embutidas**: RLS de `subscriptions` evita que uma conta crie mais de uma assinatura ativa (`account_has_no_subscription`); INSERT permite apenas `plan_id = 1` (plano gratuito) ou planos promocionais com código secreto válido nos metadados do usuário (`get_current_user_plan_code()`). `subscription_addons` não possui policy para `authenticated` — leitura e escrita exclusivas via super admin.

### Core / Public

| Tabela | Política |
|--------|----------|
| `accounts`, `users`, `users_accounts` | Verificação de pertencimento à conta + permissões por recurso |
| `persons`, `person_emails`, `person_phones`, `person_identifiers`, `person_socials` | Account-centric + permissões granulares (`person_identifiers` tem `account_id` direto; demais fazem JOIN em `persons`) |
| `deals`, `deals_tags`, `pipelines`, `pipeline_stages`, `tags`, `tasks` | Account-centric + permissões + checagem de `is_active` em `channels` e `deals` (UPDATE) |
| `organizations` | Account-centric + permissões |
| `channels`, `conversations`, `messages` | Account-centric via `account_id` (`messages` e `deals_tags` e `pipeline_stages` sem `account_id` direto — usam subquery/JOIN) |
| `account_invitations` | Fluxo via token de convite (header `x-invite-token`) + expiração + associação à conta |
| `agents` | Account-centric + permissões por recurso + super admin |

**Regras especiais**: `users` tem regras complexas para auto-registro, criação por convite e criação por usuários da mesma conta com role válida.

### Classroom / Learning

| Tabela | Política |
|--------|----------|
| `courses`, `modules`, `lessons`, `attachments` | `has_module_access(uid, 'classroom')` + `classroom_premium` para conteúdo premium |
| `certificate_templates` | Leitura com `has_module_access`; escrita super admin |
| `user_progress`, `user_certificates` | Próprio usuário apenas (View/Insert/Update own) |

### Storage

Políticas em `storage.objects` filtrando por `bucket_id`:
- `classroom`: SELECT via `has_module_access('classroom') OR has_module_access('classroom_premium')`; gerenciamento (ALL) exclusivo via `is_super_admin`
- `media`: SELECT e UPDATE/DELETE exclusivos para `is_super_admin`; INSERT aberto para qualquer `authenticated` (sem validação de `account_id`)

---

## Observações Importantes

- A maioria das tabelas **permite DELETE** para usuários com a permissão `delete` no recurso correspondente, verificada via `has_user_permission_in_account()`. Super admins possuem acesso total via política `Full access`.
- `account_id` **deve ser incluído** em todas as queries (para multi-account users), mesmo com RLS ativo — RLS sozinho não é suficiente para isolamento quando um usuário acessa múltiplas contas.
- Billing contém restrições de negócio embutidas nas políticas (`subscriptions`): limite de uma assinatura ativa por conta e validação do tipo de plano permitido no fluxo público. `subscription_addons` não expõe dados para `authenticated` — acesso somente via super admin ou service_role.
- O bucket `media` em Storage **não isola por `account_id`**: INSERT é aberto para qualquer `authenticated` e SELECT/UPDATE/DELETE são restritos a super admin. Se isolamento por conta for necessário, a policy precisa ser revisada.
- `users` tem as regras mais complexas: auto-registro, criação via convite, criação por membros da conta, validações de role e associação.
- `conversation_ai_sessions` e `messages_queue` são inacessíveis para `authenticated` no client — operam exclusivamente via service_role (Edge Functions).

---

## Referência por Tabela

Para ver a implementação completa de cada política, consulte os arquivos SQL individuais:

**Public**: [`account_invitations.sql`](../../supabase/schemas/public/rls/account_invitations.sql), [`accounts.sql`](../../supabase/schemas/public/rls/accounts.sql), [`agents.sql`](../../supabase/schemas/public/rls/agents.sql), [`channels.sql`](../../supabase/schemas/public/rls/channels.sql), [`conversation_ai_sessions.sql`](../../supabase/schemas/public/rls/conversation_ai_sessions.sql), [`conversations.sql`](../../supabase/schemas/public/rls/conversations.sql), [`deals.sql`](../../supabase/schemas/public/rls/deals.sql), [`deals_tags.sql`](../../supabase/schemas/public/rls/deals_tags.sql), [`debug_logs.sql`](../../supabase/schemas/public/rls/debug_logs.sql), [`messages.sql`](../../supabase/schemas/public/rls/messages.sql), [`messages_queue.sql`](../../supabase/schemas/public/rls/messages_queue.sql), [`organizations.sql`](../../supabase/schemas/public/rls/organizations.sql), [`person_emails.sql`](../../supabase/schemas/public/rls/person_emails.sql), [`person_identifiers.sql`](../../supabase/schemas/public/rls/person_identifiers.sql), [`person_phones.sql`](../../supabase/schemas/public/rls/person_phones.sql), [`person_socials.sql`](../../supabase/schemas/public/rls/person_socials.sql), [`persons.sql`](../../supabase/schemas/public/rls/persons.sql), [`pipeline_stages.sql`](../../supabase/schemas/public/rls/pipeline_stages.sql), [`pipelines.sql`](../../supabase/schemas/public/rls/pipelines.sql), [`roles.sql`](../../supabase/schemas/public/rls/roles.sql), [`tags.sql`](../../supabase/schemas/public/rls/tags.sql), [`tasks.sql`](../../supabase/schemas/public/rls/tasks.sql), [`users.sql`](../../supabase/schemas/public/rls/users.sql), [`users_accounts.sql`](../../supabase/schemas/public/rls/users_accounts.sql)

**Billing**: [`addon_prices.sql`](../../supabase/schemas/billing/rls/addon_prices.sql), [`addons.sql`](../../supabase/schemas/billing/rls/addons.sql), [`payments.sql`](../../supabase/schemas/billing/rls/payments.sql), [`plan_periods.sql`](../../supabase/schemas/billing/rls/plan_periods.sql), [`plans.sql`](../../supabase/schemas/billing/rls/plans.sql), [`subscription_addons.sql`](../../supabase/schemas/billing/rls/subscription_addons.sql), [`subscriptions.sql`](../../supabase/schemas/billing/rls/subscriptions.sql)

**Classroom**: [`attachments.sql`](../../supabase/schemas/classroom/rls/attachments.sql), [`certificate_templates.sql`](../../supabase/schemas/classroom/rls/certificate_templates.sql), [`courses.sql`](../../supabase/schemas/classroom/rls/courses.sql), [`lessons.sql`](../../supabase/schemas/classroom/rls/lessons.sql), [`modules.sql`](../../supabase/schemas/classroom/rls/modules.sql), [`user_certificates.sql`](../../supabase/schemas/classroom/rls/user_certificates.sql), [`user_progress.sql`](../../supabase/schemas/classroom/rls/user_progress.sql)

**Storage**: [`all.sql`](../../supabase/schemas/storage/rls/all.sql)
