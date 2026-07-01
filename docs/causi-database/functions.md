---
title: Funções SQL (RPC e Helpers)
description: Resumo das funções SQL do banco — helpers de RLS, agregadores, fluxos de criação, triggers
source: supabase/schemas/public/functions/, supabase/schemas/billing/functions/, supabase/schemas/classroom/functions/
---

# Funções SQL — Resumo

As funções encapsulam regras de negócio, checks de autorização (RLS helpers), agregações para UI, fluxos complexos de criação de entidades e handlers de triggers.

> **Fonte**: Os arquivos SQL estão em:
> - [`supabase/schemas/public/functions/`](../../supabase/schemas/public/functions/)
> - [`supabase/schemas/billing/functions/`](../../supabase/schemas/billing/functions/)
> - [`supabase/schemas/classroom/functions/`](../../supabase/schemas/classroom/functions/)

---

## Helpers de Autorização (RLS)

Funções usadas pelas políticas de RLS para verificar permissões.

| Função | Arquivo | Descrição |
|--------|---------|-----------|
| `is_user_in_account_or_shared(account_id, user_id)` | [`is_user_in_account_or_shared.sql`](../../supabase/schemas/public/functions/is_user_in_account_or_shared.sql) | Verifica associação direta (`users.account_id`) ou via `users_accounts` (conta compartilhada) |
| `has_user_permission_in_account(user_id, account_id, resource, action)` | [`has_user_permission_in_account.sql`](../../supabase/schemas/public/functions/has_user_permission_in_account.sql) | Checa permissão granular por recurso/ação via `roles.permissions` |
| `has_user_permission(user_id, resource, action)` | [`has_user_permission.sql`](../../supabase/schemas/public/functions/has_user_permission.sql) | Versão simplificada para conta principal |
| `has_module_access(user_id, module_name)` | [`has_module_access.sql`](../../supabase/schemas/public/functions/has_module_access.sql) | Valida se a assinatura ativa permite uso de um módulo (ex: `classroom`) |
| `is_super_admin(user_id)` | [`is_super_admin.sql`](../../supabase/schemas/public/functions/is_super_admin.sql) | Detecta role `super_admin` via slug (não id fixo) |
| `is_user_in_account(account_id, user_id)` | [`is_user_in_account.sql`](../../supabase/schemas/public/functions/is_user_in_account.sql) | Verifica associação direta com conta via `users.account_id` |
| `is_user_logged_in()` | [`is_user_logged_in.sql`](../../supabase/schemas/public/functions/is_user_logged_in.sql) | Verifica se o usuário está autenticado (`auth.uid() IS NOT NULL`) |
| `is_valid_invite_for_user(...)` | [`is_valid_invite_for_user.sql`](../../supabase/schemas/public/functions/is_valid_invite_for_user.sql) | Valida convite pendente e não expirado para o e-mail do usuário |
| `is_valid_role_change(...)` | [`is_valid_role_change.sql`](../../supabase/schemas/public/functions/is_valid_role_change.sql) | Valida se a mudança de role é permitida com base em `access_level` |
| `get_user_access_level(user_id)` | [`get_user_access_level.sql`](../../supabase/schemas/public/functions/get_user_access_level.sql) | Retorna `access_level` (smallint) da role do usuário |
| `get_user_account_id(user_id)` | [`get_user_account_id.sql`](../../supabase/schemas/public/functions/get_user_account_id.sql) | Retorna `account_id` principal do usuário |
| `get_user_role_for_account(user_id)` | [`get_user_role_for_account.sql`](../../supabase/schemas/public/functions/get_user_role_for_account.sql) | Retorna role do usuário em uma conta |
| `get_current_user_plan_code()` | [`get_current_user_plan_code.sql`](../../supabase/schemas/public/functions/get_current_user_plan_code.sql) | Retorna `plan_code` dos metadados do usuário autenticado (`auth.users.raw_user_meta_data`) |

## Funções Agregadoras (UI / RPC)

Funções otimizadas para consumo direto pelo frontend via Supabase SDK (RPC).

| Função | Arquivo | Descrição |
|--------|---------|-----------|
| `get_current_user_details_v4(account_id)` | [`get_current_user_details_v4.sql`](../../supabase/schemas/public/functions/get_current_user_details_v4.sql) | Dados completos do usuário, conta, limites de assinatura e permissões — usada no carregamento de página |
| `get_conversations(...)` | [`get_conversations.sql`](../../supabase/schemas/public/functions/get_conversations.sql) | Lista paginada de conversas com filtros (status, canal, atribuição) |
| `get_conversations_count(...)` | [`get_conversations_count.sql`](../../supabase/schemas/public/functions/get_conversations_count.sql) | Contagem de conversas por tipo (own, unassigned, all) |
| `get_conversations_by_id(account_id, conversations)` | [`get_conversations_by_id.sql`](../../supabase/schemas/public/functions/get_conversations_by_id.sql) | Retorna conversas de uma lista de IDs (usada para sincronização em tempo real) |
| `get_conversation_by_deal(deals)` | [`get_conversation_by_deal.sql`](../../supabase/schemas/public/functions/get_conversation_by_deal.sql) | Retorna conversas associadas a um deal_id |
| `get_single_conversation(conversations)` | [`get_single_conversation.sql`](../../supabase/schemas/public/functions/get_single_conversation.sql) | Retorna uma única conversa por ID via `conversations_details` |
| `get_deals(...)` | [`get_deals.sql`](../../supabase/schemas/public/functions/get_deals.sql) | Lista de deals com filtros e ordenação |
| `get_deals_count(...)` | [`get_deals_count.sql`](../../supabase/schemas/public/functions/get_deals_count.sql) | Contagem de deals por estágio do pipeline |
| `get_deals_by_stage(...)` | [`get_deals_by_stage.sql`](../../supabase/schemas/public/functions/get_deals_by_stage.sql) | Deals agrupados por estágio (visão Kanban) |
| `get_deals_by_id(pipeline_id, deals)` | [`get_deals_by_id.sql`](../../supabase/schemas/public/functions/get_deals_by_id.sql) | Retorna deals de uma lista de IDs (usada para sincronização em tempo real) |
| `get_single_deal(deals)` | [`get_single_deal.sql`](../../supabase/schemas/public/functions/get_single_deal.sql) | Retorna um único deal por ID via `deals_summary` |
| `get_deals_won_lost(...)` | [`get_deals_won_lost.sql`](../../supabase/schemas/public/functions/get_deals_won_lost.sql) | Lista de deals ganhos e perdidos (union entre estágios won/lost) |
| `get_deals_won_lost_count(...)` | [`get_deals_won_lost_count.sql`](../../supabase/schemas/public/functions/get_deals_won_lost_count.sql) | Contagem de deals ganhos e perdidos |
| `get_messages(...)` | [`get_messages.sql`](../../supabase/schemas/public/functions/get_messages.sql) | Lista paginada de mensagens de uma conversa |
| `get_messages_count(...)` | [`get_messages_count.sql`](../../supabase/schemas/public/functions/get_messages_count.sql) | Contagem de mensagens de uma conversa |
| `get_messages_by_id(conversation_id, messages)` | [`get_messages_by_id.sql`](../../supabase/schemas/public/functions/get_messages_by_id.sql) | Retorna mensagens de uma lista de IDs (usada para sincronização em tempo real) |
| `get_pipeline_and_tags(...)` | [`get_pipeline_and_tags.sql`](../../supabase/schemas/public/functions/get_pipeline_and_tags.sql) | Pipeline com estágios e tags associadas |
| `get_user_shared_account(account_id)` | [`get_user_shared_account.sql`](../../supabase/schemas/public/functions/get_user_shared_account.sql) | Retorna registro de `users_accounts` do usuário atual para uma conta compartilhada |
| `get_lid_conversations(account_id, channel_id)` | [`get_lid_conversations.sql`](../../supabase/schemas/public/functions/get_lid_conversations.sql) | Lista conversas com `reply_to` que parecem ser LIDs do WhatsApp (usada para migração JID→LID) |

## Fluxos de Criação e Onboarding

| Função | Arquivo | Descrição |
|--------|---------|-----------|
| `complete_user_registration_v2(...)` | [`complete_user_registration_v2.sql`](../../supabase/schemas/public/functions/complete_user_registration_v2.sql) | Onboarding do usuário autenticado: cria `user`, `account`, `subscription` e `pipeline` em uma transação |
| `admin_complete_user_registration(...)` | [`admin_complete_user_registration.sql`](../../supabase/schemas/public/functions/admin_complete_user_registration.sql) | Versão admin do onboarding — requer `is_super_admin()`; cria `user`, `account` e `pipeline` para outro usuário |
| `create_user_from_invitation(token, password)` | [`create_user_from_invitation.sql`](../../supabase/schemas/public/functions/create_user_from_invitation.sql) | `SECURITY DEFINER`: valida token de convite, cria `auth.users` + `public.users` e marca convite como aceito |
| `find_or_create_contact_flow_v2(...)` | [`find_or_create_contact_flow_v2.sql`](../../supabase/schemas/public/functions/find_or_create_contact_flow_v2.sql) | Localiza ou cria `person` (via JID/LID ou phone), `deal` e `conversation` a partir de webhook — com advisory lock para evitar race conditions |
| `find_or_create_contact_flow(...)` | [`find_or_create_contact_flow.sql`](../../supabase/schemas/public/functions/find_or_create_contact_flow.sql) | ⚠️ Versão v1 (deprecated) — sem suporte a JID/LID; manter para compatibilidade |
| `create_person(...)` | [`create_person.sql`](../../supabase/schemas/public/functions/create_person.sql) | Cria `person` + telefones, e-mails e socials a partir de JSON |
| `update_person(...)` | [`update_person.sql`](../../supabase/schemas/public/functions/update_person.sql) | Atualiza `person` e subregistros (phones, emails, socials) com diff aplicado |
| `create_pipeline(...)` | [`create_pipeline.sql`](../../supabase/schemas/public/functions/create_pipeline.sql) | Cria pipeline com estágios em batch; estágio de menor `order` recebe `type = 'entry'` |
| `update_pipeline(...)` | [`update_pipeline.sql`](../../supabase/schemas/public/functions/update_pipeline.sql) | Atualiza pipeline e estágios (insert/update/delete) |
| `create_account_invitation(...)` | [`create_account_invitation.sql`](../../supabase/schemas/public/functions/create_account_invitation.sql) | Cria convite ou renova convite expirado; rejeita duplicatas ativas |

## Funções de Sincronização de Limites (RPC)

Funções chamadas por triggers ou código server-side para bloquear/desbloquear registros conforme a assinatura.

| Função | Arquivo | Descrição |
|--------|---------|-----------|
| `sync_deals_limits_for_account(account_id)` | [`sync_deals_limits_for_account.sql`](../../supabase/schemas/public/functions/sync_deals_limits_for_account.sql) | Bloqueia/desbloqueia deals ativos conforme `max_contacts` da assinatura; retorna contadores |
| `sync_channels_limits_for_account(account_id)` | [`sync_channels_limits_for_account.sql`](../../supabase/schemas/public/functions/sync_channels_limits_for_account.sql) | Bloqueia/desbloqueia canais conforme `max_channels` da assinatura |
| `sync_users_limits_for_account(account_id)` | [`sync_users_limits_for_account.sql`](../../supabase/schemas/public/functions/sync_users_limits_for_account.sql) | Bloqueia/desbloqueia usuários conforme `max_users` da assinatura |

## Funções Utilitárias (RPC)

| Função | Arquivo | Descrição |
|--------|---------|-----------|
| `update_person_photo(person_id, photo_url)` | [`update_person_photo.sql`](../../supabase/schemas/public/functions/update_person_photo.sql) | Atualiza `photo` de uma person via RPC (`SECURITY DEFINER`) |
| `update_persons_summary_view()` | [`update_persons_summary_view.sql`](../../supabase/schemas/public/functions/update_persons_summary_view.sql) | Recria a view `persons_summary` (DROP + CREATE); chamada por migrações ou admin |
| `get_complete_schema()` | [`get_complete_schema.sql`](../../supabase/schemas/public/functions/get_complete_schema.sql) | Retorna schema completo do banco como JSONB — uso em introspection/debug |

## Funções de Trigger (Handlers)

Funções com `RETURNS trigger` associadas a triggers nas tabelas. Não são chamadas via RPC.

### Integridade e Validação

| Função | Arquivo | Descrição |
|--------|---------|-----------|
| `check_pipeline_stage_compatibility()` | [`check_pipeline_stage_compatibility.sql`](../../supabase/schemas/public/functions/check_pipeline_stage_compatibility.sql) | BEFORE INSERT/UPDATE em `deals`: garante que `pipeline_stage_id` pertence ao `pipeline_id` informado |
| `restrict_pipeline_stages_deletion()` | [`restrict_pipeline_stages_deletion.sql`](../../supabase/schemas/public/functions/restrict_pipeline_stages_deletion.sql) | BEFORE DELETE em `pipeline_stages`: bloqueia remoção de estágios `entry` e de `qualified`/`disqualified` com agente vinculado |
| `validate_deal_insert_limit()` | [`validate_deal_insert_limit.sql`](../../supabase/schemas/public/functions/validate_deal_insert_limit.sql) | BEFORE INSERT em `deals`: bloqueia inserção quando limite `max_contacts` da assinatura é atingido |
| `validate_channel_insert_limit()` | [`validate_channel_insert_limit.sql`](../../supabase/schemas/public/functions/validate_channel_insert_limit.sql) | BEFORE INSERT em `channels`: bloqueia inserção quando limite `max_channels` da assinatura é atingido |
| `validate_user_insert_limit()` | [`validate_user_insert_limit.sql`](../../supabase/schemas/public/functions/validate_user_insert_limit.sql) | BEFORE INSERT em `users`: bloqueia inserção quando limite `max_users` é atingido (bypass para owner) |

### Sincronização e Atualização

| Função | Arquivo | Descrição |
|--------|---------|-----------|
| `generate_slug()` | [`generate_slug.sql`](../../supabase/schemas/public/functions/generate_slug.sql) | BEFORE INSERT em `accounts` e `users`: gera `slug` único a partir de `name` com sufixo numérico incremental |
| `update_updated_at_column()` | [`update_updated_at_column.sql`](../../supabase/schemas/public/functions/update_updated_at_column.sql) | BEFORE UPDATE (genérico): define `updated_at = now()` |
| `update_updated_by_column()` | [`update_updated_by_column.sql`](../../supabase/schemas/public/functions/update_updated_by_column.sql) | BEFORE UPDATE (genérico): define `updated_by = auth.uid()` |
| `update_last_message_at()` | [`update_last_message_at.sql`](../../supabase/schemas/public/functions/update_last_message_at.sql) | AFTER INSERT em `messages`: atualiza `last_message_at` da conversation |
| `set_qualification_updated_at()` | [`set_qualification_updated_at.sql`](../../supabase/schemas/public/functions/set_qualification_updated_at.sql) | BEFORE UPDATE em `deals`: atualiza `qualification_updated_at` somente quando `qualification_status` muda |
| `sync_last_sign_in()` | [`sync_last_sign_in.sql`](../../supabase/schemas/public/functions/sync_last_sign_in.sql) | AFTER UPDATE em `auth.users`: espelha `last_sign_in_at` para `public.users` |
| `update_user_account_id()` | [`update_user_account_id.sql`](../../supabase/schemas/public/functions/update_user_account_id.sql) | AFTER INSERT em `accounts`: vincula `account_id` ao criador da conta se ele ainda não tiver conta associada |
| `update_account_trial_usage()` | [`update_account_trial_usage.sql`](../../supabase/schemas/public/functions/update_account_trial_usage.sql) | AFTER INSERT/UPDATE em `billing.subscriptions`: marca `accounts.has_used_trial = true` quando status = `trial` |
| `update_invitation_status()` | [`update_invitation_status.sql`](../../supabase/schemas/public/functions/update_invitation_status.sql) | AFTER INSERT em `public.users`: marca convite pendente como `accepted` e chama `sync_users_limits_for_account` |
| `update_channel_references()` | [`update_channel_references.sql`](../../supabase/schemas/public/functions/update_channel_references.sql) | AFTER INSERT em `channels`: vincula `channel_id` em `conversations` e `agents` que tenham o mesmo `phone` |
| `update_channel_identifier_references()` | [`update_channel_identifier_references.sql`](../../supabase/schemas/public/functions/update_channel_identifier_references.sql) | AFTER INSERT em `channels`: vincula `channel_id` em `conversations` e `agents` que tenham o mesmo `identifier` |
| `delete_auth_user()` | [`delete_auth_user.sql`](../../supabase/schemas/public/functions/delete_auth_user.sql) | AFTER DELETE em `public.users`: remove o registro correspondente em `auth.users` |

### Lógica de Agentes e Limits Batch

| Função | Arquivo | Descrição |
|--------|---------|-----------|
| `create_conversation_for_new_agent()` | [`create_conversation_for_new_agent.sql`](../../supabase/schemas/public/functions/create_conversation_for_new_agent.sql) | AFTER INSERT em `agents`: cria automaticamente uma `conversation` associada ao novo agente |
| `handle_agent_insert_update()` | [`handle_agent_insert_update.sql`](../../supabase/schemas/public/functions/handle_agent_insert_update.sql) | AFTER INSERT/UPDATE em `agents`: cria estágios `qualified` e `disqualified` no pipeline do canal se ainda não existirem |
| `handle_channel_update()` | [`handle_channel_update.sql`](../../supabase/schemas/public/functions/handle_channel_update.sql) | AFTER UPDATE em `channels`: ao mudar `pipeline_id`, cria estágios `qualified`/`disqualified` no novo pipeline (se canal tiver agentes) |
| `handle_deals_delete_batch()` | [`handle_deals_delete_batch.sql`](../../supabase/schemas/public/functions/handle_deals_delete_batch.sql) | AFTER DELETE em `deals` (bulk): chama `sync_deals_limits_for_account` para cada conta afetada |
| `handle_channels_delete_batch()` | [`handle_channels_delete_batch.sql`](../../supabase/schemas/public/functions/handle_channels_delete_batch.sql) | AFTER DELETE em `channels` (bulk): chama `sync_channels_limits_for_account` para cada conta afetada |
| `handle_users_delete_batch()` | [`handle_users_delete_batch.sql`](../../supabase/schemas/public/functions/handle_users_delete_batch.sql) | AFTER DELETE em `users` (bulk): chama `sync_users_limits_for_account` para cada conta afetada |

### Notificações n8n

| Função | Arquivo | Descrição |
|--------|---------|-----------|
| `n8n_trigger_function_1587982e_cf6b_44ee_a265_33d1f1562ecf()` | [`n8n_trigger_function_1587982e...sql`](../../supabase/schemas/public/functions/n8n_trigger_function_1587982e_cf6b_44ee_a265_33d1f1562ecf.sql) | Trigger: emite `pg_notify` no canal n8n correspondente com `row_to_json(NEW)` |
| `n8n_trigger_function_1c15fc96_e422_41b1_ad2f_95f6eb81a6a8()` | [`n8n_trigger_function_1c15fc96...sql`](../../supabase/schemas/public/functions/n8n_trigger_function_1c15fc96_e422_41b1_ad2f_95f6eb81a6a8.sql) | Trigger: emite `pg_notify` no canal n8n correspondente com `row_to_json(NEW)` |

## Funções do Billing

| Função | Arquivo | Descrição |
|--------|---------|-----------|
| `account_has_no_subscription(account_id)` | [`account_has_no_subscription.sql`](../../supabase/schemas/billing/functions/account_has_no_subscription.sql) | Retorna `true` se a conta não possui nenhuma assinatura em `billing.subscriptions` |

## Funções do Classroom

| Função | Arquivo | Descrição |
|--------|---------|-----------|
| `is_lesson_premium(lesson_id)` | [`is_lesson_premium.sql`](../../supabase/schemas/classroom/functions/is_lesson_premium.sql) | Verifica se a aula pertence a um curso premium (JOIN lessons → modules → courses) |
| `is_course_premium(course_id)` | [`is_course_premium.sql`](../../supabase/schemas/classroom/functions/is_course_premium.sql) | Verifica se o curso é premium via `courses.is_premium` |
| `is_module_premium(module_id)` | [`is_module_premium.sql`](../../supabase/schemas/classroom/functions/is_module_premium.sql) | Verifica se o módulo pertence a um curso premium (JOIN modules → courses) |
| `ensure_single_default_template()` | [`ensure_single_default_template.sql`](../../supabase/schemas/classroom/functions/ensure_single_default_template.sql) | Trigger AFTER INSERT/UPDATE em `certificate_templates`: garante que apenas um template pode ter `is_default = true` |

---

## Cuidados

- **SECURITY DEFINER**: Muitas funções usam `SECURITY DEFINER` para permitir operações que o usuário não teria acesso direto. Revise o owner da função antes de conceder permissões.
- **Trigger vs RPC**: Funções com `RETURNS trigger` são handlers de trigger — não podem ser chamadas via RPC. Funções de sincronização de limites (`sync_*`) são RPC e podem ser chamadas pelo servidor.
- **Performance**: Funções que retornam grandes conjuntos devem ser marcadas `STABLE`/`IMMUTABLE` quando aplicável.
- **Testes**: Nunca execute comandos de banco automaticamente — sempre solicite revisão manual do desenvolvedor.
