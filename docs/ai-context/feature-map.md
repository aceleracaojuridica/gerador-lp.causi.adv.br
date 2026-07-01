---
title: Feature Map (AI Context)
description: Mapeamento de features para tabelas, funções, views, triggers e edge functions
---

# Feature Map

Mapeamento de cada feature para as tabelas, funções RPC, views, triggers e edge functions envolvidas.

---

## CRM Kanban (Oportunidades)

| Tipo | Recursos |
|------|----------|
| **Tabelas** | `pipelines`, `pipeline_stages`, `deals`, `deals_tags`, `tags`, `persons` |
| **Funções** | `get_deals`, `get_deals_count`, `get_deals_by_stage`, `get_deals_won_lost`, `get_pipeline_and_tags`, `create_pipeline`, `update_pipeline` |
| **Views** | `deals_summary`, `pipeline_details`, `pipelines_summary`, `tags_summary` |
| **Triggers** | `check_pipeline_stage_compatibility`, `restrict_pipeline_stages_deletion`, `set_qualification_updated_at`, `deals_validate_insert_limit` |
| **Rotas** | `/oportunidades/[pipelineId]`, `/funis`, `/etiquetas` |

## Conversas (Inbox)

| Tipo | Recursos |
|------|----------|
| **Tabelas** | `conversations`, `messages`, `messages_queue`, `persons`, `channels`, `agents`, `conversation_ai_sessions` |
| **Funções** | `get_conversations`, `get_conversations_count`, `get_messages`, `get_messages_count`, `get_single_conversation`, `find_or_create_contact_flow_v2` |
| **Views** | `conversations_details` |
| **Triggers** | `trigger_update_last_message_at` |
| **Edge Functions** | `evolution-webhook-handler-v2`, `uazapi-webhook-handler`, `waha-webhook-handler` |
| **Rotas** | `/conversas/[conversationId]` |

## Contatos (Pessoas e Organizações)

| Tipo | Recursos |
|------|----------|
| **Tabelas** | `persons`, `person_phones`, `person_emails`, `person_identifiers`, `person_socials`, `organizations` |
| **Funções** | `create_person`, `update_person`, `find_or_create_contact_flow_v2` |
| **Views** | `persons_summary`, `persons_details`, `organizations_summary` |
| **Rotas** | `/pessoas`, `/organizacoes` |

## Tarefas

| Tipo | Recursos |
|------|----------|
| **Tabelas** | `tasks`, `deals` |
| **Views** | `tasks_summary` |
| **Rotas** | `/tarefas` |

## Canais (WhatsApp)

| Tipo | Recursos |
|------|----------|
| **Tabelas** | `channels`, `agents`, `pipelines` |
| **Views** | `channels_summary` |
| **Triggers** | `channel_update_trigger`, `channel_sync_on_update_delete`, `channel_identifier_update`, `channel_phone_update`, `channels_validate_insert_limit` |
| **Edge Functions** | `channel-sync-webhook` |
| **Rotas** | `/canais` |

## Assinaturas e Billing

| Tipo | Recursos |
|------|----------|
| **Tabelas** | `billing.plans`, `billing.plan_periods`, `billing.addons`, `billing.addon_prices`, `billing.subscriptions`, `billing.subscription_addons`, `billing.payments` |
| **Funções** | `account_has_no_subscription`, `get_current_user_plan_code`, `has_module_access`, `validate_deal_insert_limit`, `validate_channel_insert_limit`, `validate_user_insert_limit`, `sync_deals_limits_for_account`, `sync_channels_limits_for_account`, `sync_users_limits_for_account` |
| **Views** | `subscriptions_summary` |
| **Triggers** | `subscription_trial_trigger` |
| **Edge Functions** | `admin-subscriptions-handler`, `subscriptions-lifecycle-cron-v2` |
| **Rotas** | `/assinatura`, `/admin-contas` |

## Classroom (Educação)

| Tipo | Recursos |
|------|----------|
| **Tabelas** | `classroom.courses`, `classroom.modules`, `classroom.lessons`, `classroom.attachments`, `classroom.certificate_templates`, `classroom.user_certificates`, `classroom.user_progress` |
| **Funções** | `has_module_access`, `is_lesson_premium`, `is_course_premium`, `is_module_premium`, `ensure_single_default_template` |
| **Views** | `lessons_view` |
| **Triggers** | `trigger_ensure_single_default_template` |
| **Storage** | Bucket `classroom` (courses/, lessons/, attachments/, certificate_templates/, user_certificates/) |
| **Rotas** | `/cursos/admin`, `/cursos/[courseId]`, `/cursos/[courseId]/aulas/[lessonId]` *(planejado — páginas ainda não implementadas no frontend)* |

## Admin Panel (Super Admin)

| Tipo | Recursos |
|------|----------|
| **Tabelas** | `accounts`, `users`, `billing.subscriptions`, `billing.subscription_addons`, `channels` |
| **Funções** | `is_super_admin`, `get_current_user_details_v4` |
| **Views** | `accounts_summary_v2`, `subscriptions_summary` |
| **Edge Functions** | `admin-subscriptions-handler` |
| **Rotas** | `/admin-contas`, `/admin-contas/[accountId]`, `/admin-cursos`, `/admin-cursos/[courseId]/modulos`, `/admin-cursos/[courseId]/modulos/[moduleId]/aulas` *(grupo de rotas separado `(admin)/`)* |

## Autenticação e Usuários

| Tipo | Recursos |
|------|----------|
| **Tabelas** | `users`, `users_accounts`, `roles`, `account_invitations` |
| **Funções** | `is_user_in_account_or_shared`, `has_user_permission_in_account`, `is_super_admin`, `get_current_user_details_v4`, `create_account_invitation`, `is_valid_invite_for_user`, `is_valid_role_change`, `generate_slug` |
| **Views** | `user_details` |
| **Triggers** | `after_user_created`, `on_account_created`, `delete_auth_user_trigger`, `sync_last_sign_in_trigger`, `before_insert_accounts`, `before_insert_users` |
| **Rotas** | `/login`, `/cadastrar`, `/redefinir`, `/perfil`, `/seguranca`, `/escritorio`, `/usuarios` |

## Automações (IA e Follow-up)

| Tipo | Recursos |
|------|----------|
| **Tabelas** | `agents`, `conversation_ai_sessions`, `messages_queue` |
| **Views** | `agents_details`, `workflow_agents`, `workflow_conversations` |
| **Triggers** | `agent_insert_update_trigger`, `after_agent_insert` |
| **Edge Functions** | Webhooks encaminham para agentes via `aiAgentHelper` |
