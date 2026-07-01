---
title: Triggers do Banco de Dados
description: Resumo dos triggers — automações, invariantes e regras de negócio
source: supabase/schemas/public/triggers/, supabase/schemas/billing/triggers/, supabase/schemas/classroom/triggers/
---

# Triggers — Resumo

Os triggers automatizam invariantes (timestamps, sincronizações), reforçam regras de negócio e mantêm dados derivados.

> **Fonte**: Os arquivos SQL estão em:
> - [`supabase/schemas/public/triggers/`](../../supabase/schemas/public/triggers/)
> - [`supabase/schemas/billing/triggers/`](../../supabase/schemas/billing/triggers/)
> - [`supabase/schemas/classroom/triggers/`](../../supabase/schemas/classroom/triggers/)

---

## Schema `public`

### Agentes e Pipelines

| Trigger | Função Invocada | Arquivo | Descrição |
|---------|----------------|---------|-----------|
| Agent insert/update | `public.handle_agent_insert_update()` | [`agent_insert_update_trigger.sql`](../../supabase/schemas/public/triggers/agent_insert_update_trigger.sql) | Cria estágios `qualified`/`disqualified` no pipeline do canal se ainda não existirem ao inserir/atualizar agente |
| After agent insert | `public.create_conversation_for_new_agent()` | [`after_agent_insert.sql`](../../supabase/schemas/public/triggers/after_agent_insert.sql) | Cria automaticamente uma `conversation` associada ao novo agente |
| Channel update | `public.handle_channel_update()` | [`channel_update_trigger.sql`](../../supabase/schemas/public/triggers/channel_update_trigger.sql) | Ao mudar `pipeline_id` de um canal, cria estágios `qualified`/`disqualified` no novo pipeline (aplicado apenas se o canal possuir agentes) |
| Pipeline stage compatibility | `public.check_pipeline_stage_compatibility()` | [`check_pipeline_stage_compatibility_trigger.sql`](../../supabase/schemas/public/triggers/check_pipeline_stage_compatibility_trigger.sql) | Impede atribuir `pipeline_stage_id` que não pertence ao `pipeline_id` de um deal |
| Restrict pipeline stage deletion | `public.restrict_pipeline_stages_deletion()` | [`before_delete_pipeline_stages.sql`](../../supabase/schemas/public/triggers/before_delete_pipeline_stages.sql) | Bloqueia remoção de estágios `entry` e de `qualified`/`disqualified` com agente vinculado |

### Mensageria

| Trigger | Função Invocada | Arquivo | Descrição |
|---------|----------------|---------|-----------|
| Update last message at | `public.update_last_message_at()` | [`trigger_update_last_message_at.sql`](../../supabase/schemas/public/triggers/trigger_update_last_message_at.sql) | Atualiza `conversations.last_message_at` ao inserir mensagens |
| Channel identifier update | `public.update_channel_identifier_references()` | [`channel_identifier_update.sql`](../../supabase/schemas/public/triggers/channel_identifier_update.sql) | Ao alterar `identifier` de um canal, vincula `channel_id` em `conversations` e `agents` com o mesmo `identifier` |
| Channel phone update | `public.update_channel_references()` | [`channel_phone_update.sql`](../../supabase/schemas/public/triggers/channel_phone_update.sql) | Ao alterar `phone` de um canal, vincula `channel_id` em `conversations` e `agents` com o mesmo `phone` |

### Usuários e Convites

| Trigger | Função Invocada | Arquivo | Descrição |
|---------|----------------|---------|-----------|
| After user created | `public.update_invitation_status()` | [`after_user_created.sql`](../../supabase/schemas/public/triggers/after_user_created.sql) | Marca convite como `accepted` e sincroniza limites de usuários |
| Delete auth user | `public.delete_auth_user()` | [`delete_auth_user_trigger.sql`](../../supabase/schemas/public/triggers/delete_auth_user_trigger.sql) | Remove registro em `auth.users` ao deletar `public.users` |
| On account created | `public.update_user_account_id()` | [`on_account_created.sql`](../../supabase/schemas/public/triggers/on_account_created.sql) | Associa o criador da conta ao `account_id` recém-criado (apenas se o usuário ainda não tiver conta vinculada) |
| Sync last sign in | `public.sync_last_sign_in()` | [`sync_last_sign_in_trigger.sql`](../../supabase/schemas/public/triggers/sync_last_sign_in_trigger.sql) | Sincroniza `last_sign_in_at` entre `auth.users` e `public.users` |

### Slugs e Timestamps

| Trigger | Função Invocada | Arquivo | Descrição |
|---------|----------------|---------|-----------|
| Before insert accounts | `public.generate_slug()` | [`before_insert_accounts.sql`](../../supabase/schemas/public/triggers/before_insert_accounts.sql) | Gera slug único para contas |
| Before insert users | `public.generate_slug()` | [`before_insert_users.sql`](../../supabase/schemas/public/triggers/before_insert_users.sql) | Gera slug único para usuários |
| Before insert pipelines | `public.generate_slug()` | [`before_insert_pipelines.sql`](../../supabase/schemas/public/triggers/before_insert_pipelines.sql) | Gera slug único para pipelines |
| Set updated at | `public.update_updated_at_column()` | [`set_updated_at.sql`](../../supabase/schemas/public/triggers/set_updated_at.sql) | Popula `updated_at` automaticamente nas tabelas; **desativado em `conversations`** |
| Set updated by | `public.update_updated_by_column()` | [`set_updated_by.sql`](../../supabase/schemas/public/triggers/set_updated_by.sql) | Popula `updated_by` automaticamente em `deals`, `persons` e `tasks` |
| Set qualification updated at | `public.set_qualification_updated_at()` | [`set_qualification_updated_at.sql`](../../supabase/schemas/public/triggers/set_qualification_updated_at.sql) | Atualiza `qualification_updated_at` quando `qualification_status` muda em deals |

### Validação de Limites

| Trigger | Função Invocada | Arquivo | Descrição |
|---------|----------------|---------|-----------|
| Validate deal insert limit | `public.validate_deal_insert_limit()` | [`deals_validate_insert_limit_trigger.sql`](../../supabase/schemas/public/triggers/deals_validate_insert_limit_trigger.sql) | Bloqueia inserção de deals acima do limite do plano |
| Validate channel insert limit | `public.validate_channel_insert_limit()` | [`channels_validate_insert_limit_trigger.sql`](../../supabase/schemas/public/triggers/channels_validate_insert_limit_trigger.sql) | Bloqueia inserção de canais acima do limite |
| Validate user insert limit | `public.validate_user_insert_limit()` | [`users_validate_insert_limit_trigger.sql`](../../supabase/schemas/public/triggers/users_validate_insert_limit_trigger.sql) | Bloqueia inserção de usuários acima do limite (bypass para owner) |

### Sincronização de Limites (delete)

| Trigger | Função Invocada | Arquivo | Descrição |
|---------|----------------|---------|-----------|
| Deals sync on delete | `public.handle_deals_delete_batch()` | [`deals_sync_on_delete_trigger.sql`](../../supabase/schemas/public/triggers/deals_sync_on_delete_trigger.sql) | Sincroniza limites ao deletar deals (execução batch por statement) |
| Channels sync on delete | `public.handle_channels_delete_batch()` | [`channels_sync_on_delete_trigger.sql`](../../supabase/schemas/public/triggers/channels_sync_on_delete_trigger.sql) | Sincroniza limites ao deletar canais (execução batch por statement) |
| Users sync on delete | `public.handle_users_delete_batch()` | [`users_sync_on_delete_trigger.sql`](../../supabase/schemas/public/triggers/users_sync_on_delete_trigger.sql) | Sincroniza limites ao deletar usuários (execução batch por statement) |

### Webhooks e Notificações

| Trigger | Função Invocada | Arquivo | Descrição |
|---------|----------------|---------|-----------|
| Channel sync on update/delete | `supabase_functions.http_request()` | [`channel_sync_on_update_delete.sql`](../../supabase/schemas/public/triggers/channel_sync_on_update_delete.sql) | Chama a Edge Function `channel-sync-webhook` ao atualizar ou deletar um canal |
| n8n — users insert | `public.n8n_trigger_function_1c15fc96_e422_41b1_ad2f_95f6eb81a6a8()` | [`n8n_trigger_1c15fc96_e422_41b1_ad2f_95f6eb81a6a8.sql`](../../supabase/schemas/public/triggers/n8n_trigger_1c15fc96_e422_41b1_ad2f_95f6eb81a6a8.sql) | Emite `pg_notify` para o n8n ao inserir novo usuário em `public.users` |

---

## Schema `billing`

| Trigger | Função Invocada | Arquivo | Descrição |
|---------|----------------|---------|-----------|
| Subscription trial trigger | `public.update_account_trial_usage()` | [`subscription_trial_trigger.sql`](../../supabase/schemas/billing/triggers/subscription_trial_trigger.sql) | Marca `accounts.has_used_trial = true` ao criar assinatura ou atualizar status para `trial` |
| n8n — plans update | `public.n8n_trigger_function_1587982e_cf6b_44ee_a265_33d1f1562ecf()` | [`n8n_trigger_1587982e_cf6b_44ee_a265_33d1f1562ecf.sql`](../../supabase/schemas/public/triggers/n8n_trigger_1587982e_cf6b_44ee_a265_33d1f1562ecf.sql) | Emite `pg_notify` para o n8n ao atualizar um plano em `billing.plans` |

---

## Schema `classroom`

| Trigger | Função Invocada | Arquivo | Descrição |
|---------|----------------|---------|-----------|
| Ensure single default template | `classroom.ensure_single_default_template()` | [`trigger_ensure_single_default_template.sql`](../../supabase/schemas/classroom/triggers/trigger_ensure_single_default_template.sql) | Garante que apenas um template de certificado esteja marcado como padrão |

---

## Cuidados

- **SECURITY DEFINER**: Triggers que fazem updates cross-table usam `SECURITY DEFINER`. Revise privilégios do owner.
- **Migrations**: Ativar triggers em tabelas com dados existentes pode causar bloqueios ou violações de UNIQUE. Teste em staging primeiro.
- **Idempotência**: Triggers de criação de estágios detectam existência prévia para evitar duplicação.
- **Observabilidade**: Triggers registram NOTICES quando não conseguem executar (pipeline ausente, dados inconsistentes).
- **JWT hardcoded**: `channel_sync_on_update_delete.sql` contém um JWT de `anon_key` hardcoded na chamada `http_request`. Considere migrar para um Vault secret gerenciado.
