---
title: Schema Public (Operacional & Core)
description: Detalhamento das 24 tabelas do schema public — Core, CRM e Comunicação
source: supabase/schemas/public/tables/
---

# Schema `public` — Operacional & Core

O schema `public` abriga o núcleo operacional do Causi, organizado em três camadas lógicas.

> **Fonte**: Os arquivos SQL de cada tabela estão em [`supabase/schemas/public/tables/`](../../supabase/schemas/public/tables/).

---

## Visão Geral

O schema possui **24 tabelas** distribuídas em 3 camadas + 1 tabela de sistema:

1. **Core & Identidade** — Multi-tenancy e autenticação (`accounts`, `users`, `roles`, etc.)
2. **CRM & Vendas** — Dados de negócio (`deals`, `persons`, `pipelines`, `tasks`, etc.)
3. **Comunicação & IA** — Mensageria e agentes (`channels`, `conversations`, `messages`, `agents`, etc.)

A entidade `accounts` é a raiz do isolamento: quase todas as tabelas operacionais possuem `account_id` direto ou derivado da entidade pai.

---

## 1. Core & Identidade

### `accounts`

Unidade central de isolamento de dados. Representa uma empresa cliente (escritório de advocacia) do Causi.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | `bigint` (identity) | PK |
| `name` | `text NOT NULL` | Nome do escritório |
| `slug` | `text NOT NULL UNIQUE` | Identificador único (gerado via trigger) |
| `status` | `text` | `'active'` ou `'inactive'` (default: `'active'`) |
| `created_by_user_id` | `uuid` | FK → `auth.users(id)` — criador inicial |
| `currency` | `text` | Moeda (default: `'brl'`) |
| `address`, `address_complement`, `address_number`, `city`, `state`, `zip_code` | `text` | Endereço para faturamento |
| `cnpj` | `text` | CNPJ (opcional) |
| `phone` | `text` | Telefone principal |
| `phone_details` | `jsonb` | Detalhes do telefone: `{ number, formatted, country_code }` |
| `email` | `text` | E-mail da conta |
| `asaas_customer_id` | `text` | ID do cliente no gateway Asaas |
| `has_used_trial` | `boolean NOT NULL` | Flag para impedir uso duplo de trial (default: `false`) |

### `users`

Membros humanos do sistema. Estende `auth.users` do Supabase Auth com metadados adicionais.

> **Não confundir** com `persons` (contatos externos/leads).

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | `uuid` | PK — espelha `auth.users(id)` (default: `auth.uid()`) |
| `name` | `text` | Nome do usuário |
| `email` | `varchar NOT NULL` | E-mail do usuário |
| `slug` | `text NOT NULL UNIQUE` | Identificador único (gerado via trigger) |
| `photo` | `text` | URL da foto de perfil |
| `status` | `text NOT NULL` | `'active'`, `'inactive'` ou `'blocked'` (default: `'active'`) |
| `account_id` | `bigint` | FK → `accounts(id)` — conta **principal** do usuário |
| `role_id` | `bigint` | FK → `roles(id)` — papel na conta principal |
| `created_by_user_id` | `uuid` | Quem criou este usuário |
| `last_sign_in_at` | `timestamptz` | Último login (sincronizado via trigger com `auth.users`) |

**Regra crítica — conta principal vs. acesso adicional:**
- `users.account_id` define a conta **principal** do usuário
- A tabela `users_accounts` existe **exclusivamente** para conceder acesso a contas **adicionais**
- Para saber quais contas um usuário acessa, consulte **ambos**: `users.account_id` E `users_accounts WHERE user_id = ?`

### `users_accounts`

Mapeamento N:M para acesso a contas **adicionais** (compartilhadas). Não é usado para a conta principal do usuário.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | `bigint` (identity) | PK |
| `user_id` | `uuid NOT NULL` | FK → `users(id)` |
| `account_id` | `bigint NOT NULL` | FK → `accounts(id)` — conta adicional |
| `role_id` | `bigint NOT NULL` | FK → `roles(id)` — papel nessa conta |
| `granted_by_user_id` | `uuid` | FK → `users(id)` — quem concedeu o acesso |

### `roles`

Definição de papéis e permissões. Valores reais documentados em [roles-and-permissions.md](../references/roles-and-permissions.md).

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | `bigint` (identity) | PK |
| `name` | `text NOT NULL UNIQUE` | Nome descritivo (ex: "Proprietário") |
| `slug` | `text NOT NULL UNIQUE` | Identificador (ex: `owner`) |
| `access_level` | `smallint` | Hierarquia numérica para verificações rápidas |
| `permissions` | `jsonb` | Objeto `{"recurso": ["create","read","update","delete"]}` |
| `description` | `text` | Descrição opcional |

### `account_invitations`

Convites para novos usuários ingressarem em uma conta existente.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | `bigint` (identity) | PK |
| `email` | `varchar NOT NULL` | E-mail do convidado |
| `name` | `text NOT NULL` | Nome do convidado |
| `token` | `text NOT NULL UNIQUE` | Token único para aceitar convite |
| `status` | `text NOT NULL` | `'pending'`, `'accepted'` ou `'expired'` |
| `expires_at` | `timestamptz NOT NULL` | Data de expiração |
| `account_id` | `bigint NOT NULL` | FK → `accounts(id)` |
| `role_id` | `bigint NOT NULL` | FK → `roles(id)` — papel a ser atribuído |
| `account_name` | `text` | Nome da conta (desnormalizado para e-mail) |
| `photo` | `text` | Foto do convidado (opcional) |

---

## 2. CRM & Vendas

### `persons`

Contatos externos (leads, clientes). Pertencem a uma conta via `account_id`.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | `bigint` (identity) | PK |
| `name` | `text NOT NULL` | Nome do contato |
| `photo` | `text` | URL da foto |
| `occupation` | `text` | Profissão |
| `state`, `city`, `address` | `text` | Localização |
| `additional_info` | `text` | Informações adicionais |
| `organization_id` | `bigint` | FK → `organizations(id)` |
| `account_id` | `bigint NOT NULL` | FK → `accounts(id)` |
| `created_by_user_id` | `uuid` | FK → `users(id)` |
| `updated_by` | `uuid` | FK → `users(id)` |

> Telefones, e-mails, identificadores de canal e redes sociais ficam em tabelas auxiliares vinculadas a `persons`. RLS deriva o `account_id` via join com `persons`.

### `person_phones`

Telefones de um contato. Um `person` pode ter vários registros; um deles pode ser marcado como principal.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | `bigint` (identity) | PK |
| `created_at` | `timestamptz NOT NULL` | Data de criação (default: `now()`) |
| `updated_at` | `timestamptz NOT NULL` | Data de atualização (default: `now()`, trigger `set_updated_at`) |
| `phone` | `text NOT NULL` | Número sem código do país |
| `country_code` | `text NOT NULL` | Código do país (ex: `55`) |
| `full_phone` | `text NOT NULL` | Número completo (código + número) |
| `label` | `text` | Rótulo opcional (ex: "Celular", "Trabalho") |
| `is_primary` | `boolean NOT NULL` | Telefone principal do contato (default: `false`) |
| `person_id` | `bigint NOT NULL` | FK → `persons(id)` — `ON DELETE CASCADE` |

### `person_emails`

E-mails de um contato. Um `person` pode ter vários registros; um deles pode ser marcado como principal.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | `bigint` (identity) | PK |
| `created_at` | `timestamptz NOT NULL` | Data de criação (default: `now()`) |
| `updated_at` | `timestamptz NOT NULL` | Data de atualização (default: `now()`, trigger `set_updated_at`) |
| `label` | `text NOT NULL` | Rótulo (ex: "Pessoal", "Trabalho") |
| `email` | `text NOT NULL` | Endereço de e-mail |
| `person_id` | `bigint NOT NULL` | FK → `persons(id)` — `ON DELETE CASCADE` |
| `is_primary` | `boolean NOT NULL` | E-mail principal do contato (default: `false`) |

### `person_identifiers`

Identificadores de canal por contato e conta. Usada para resolver o mesmo `person` em WhatsApp (JID/LID), Instagram, Telegram, etc., com unicidade por tenant.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | `bigint` (identity) | PK |
| `created_at` | `timestamptz NOT NULL` | Data de criação (default: `now()`) |
| `updated_at` | `timestamptz NOT NULL` | Data de atualização (default: `now()`, trigger `set_updated_at`) |
| `account_id` | `bigint NOT NULL` | FK → `accounts(id)` — `ON DELETE CASCADE` |
| `person_id` | `bigint NOT NULL` | FK → `persons(id)` — `ON DELETE CASCADE` |
| `channel_type` | `text NOT NULL` | Canal: `'whatsapp'`, `'instagram'`, `'telegram'` ou `'email'` (CHECK) |
| `identifier_type` | `text NOT NULL` | Tipo: `'jid'`, `'lid'`, `'phone'`, `'email'`, `'username'` ou `'user_id'` (CHECK) |
| `identifier` | `text NOT NULL` | Valor do identificador no canal |
| `is_primary` | `boolean NOT NULL` | Identificador principal para aquele par canal/tipo (default: `false`) |

**Constraints:**

- `valid_channel_type`: `channel_type` ∈ `whatsapp`, `instagram`, `telegram`, `email`
- `valid_identifier_type`: `identifier_type` ∈ `jid`, `lid`, `phone`, `email`, `username`, `user_id`
- `person_identifiers_unique_per_account`: UNIQUE `(account_id, channel_type, identifier_type, identifier)`

> **RLS**: políticas usam `account_id` diretamente (não derivam só de `persons`). Busca primária em `find_or_create_contact_flow_v2`.

### `person_socials`

Perfis em redes sociais de um contato. Relação **1:1** com `persons` (um registro por pessoa).

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | `bigint` (identity) | PK |
| `created_at` | `timestamptz NOT NULL` | Data de criação (default: `now()`) |
| `updated_at` | `timestamptz NOT NULL` | Data de atualização (default: `now()`, trigger `set_updated_at`) |
| `person_id` | `bigint NOT NULL UNIQUE` | FK → `persons(id)` — `ON DELETE CASCADE` |
| `facebook` | `text` | URL ou handle do Facebook |
| `instagram` | `text` | URL ou handle do Instagram |
| `linkedin` | `text` | URL ou handle do LinkedIn |
| `x` | `text` | URL ou handle do X (Twitter) |
| `youtube` | `text` | URL ou handle do YouTube |

### `organizations`

Empresas/escritórios aos quais contatos podem ser vinculados.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | `bigint` (identity) | PK |
| `name` | `text NOT NULL` | Nome da organização |
| `cnpj` | `text` | CNPJ |
| `state`, `city`, `address` | `text` | Localização |
| `additional_info` | `text` | Informações adicionais |
| `account_id` | `bigint NOT NULL` | FK → `accounts(id)` |
| `created_by_user_id` | `uuid` | FK → `users(id)` |

### `pipelines`

Funis de vendas configuráveis por conta.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | `bigint` (identity) | PK |
| `name` | `text NOT NULL` | Nome do funil |
| `slug` | `text NOT NULL UNIQUE` | Slug único (gerado via trigger) |
| `account_id` | `bigint NOT NULL` | FK → `accounts(id)` |
| `created_by_user_id` | `uuid` | FK → `users(id)` |
| `owner_user_id` | `uuid` | FK → `auth.users(id)` |

### `pipeline_stages`

Estágios (colunas) de um pipeline.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | `bigint` (identity) | PK |
| `name` | `text NOT NULL` | Nome do estágio |
| `order` | `real` | Posição de ordenação |
| `color` | `text NOT NULL` | Cor visual |
| `type` | `text` | Tipo especial: `'entry'`, `'qualified'`, `'disqualified'` (nullable) |
| `pipeline_id` | `bigint NOT NULL` | FK → `pipelines(id)` |

### `deals`

Oportunidades de negócio (cards do Kanban).

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | `bigint` (identity) | PK |
| `name` | `text NOT NULL` | Nome do deal |
| `value` | `numeric` | Valor estimado |
| `order` | `real` | Posição no estágio |
| `status` | `text NOT NULL` | `'open'`, `'won'` ou `'lost'` (default: `'open'`) |
| `origin` | `text` | Origem do lead |
| `won_time` | `timestamptz` | Data de fechamento (ganho) |
| `lost_time` | `timestamptz` | Data de perda |
| `lost_reason` | `text` | Motivo de perda |
| `person_id` | `bigint NOT NULL` | FK → `persons(id)` |
| `pipeline_stage_id` | `bigint NOT NULL` | FK → `pipeline_stages(id)` |
| `pipeline_id` | `bigint NOT NULL` | FK → `pipelines(id)` |
| `account_id` | `bigint NOT NULL` | FK → `accounts(id)` |
| `owner_user_id` | `uuid` | FK → `users(id)` — responsável |
| `created_by_user_id` | `uuid` | FK → `users(id)` |
| `updated_by` | `uuid` | FK → `users(id)` |
| `is_active` | `boolean NOT NULL` | Controle de visibilidade (default: `true`) |
| `blocked_at` | `timestamptz` | Data de bloqueio (limite de contatos) |
| `blocked_reason` | `text` | Motivo do bloqueio |
| `additional_info` | `text` | Informações adicionais |
| `qualification_status` | `text` | `'qualified'`, `'disqualified'` ou `'review'` |
| `qualification_updated_at` | `timestamptz` | Data da última qualificação |
| `qualification_updated_by` | `uuid` | FK → `users(id)` |

### `deals_tags`

Relacionamento N:M entre deals e tags. PK composta: `(deal_id, tag_id)`.

### `tags`

Etiquetas para categorização de deals.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | `bigint` (identity) | PK |
| `name` | `text NOT NULL` | Nome da tag |
| `color` | `text` | Cor visual |
| `account_id` | `bigint NOT NULL` | FK → `accounts(id)` |

### `tasks`

Tarefas vinculadas a deals e organizadas por prazo.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | `bigint` (identity) | PK |
| `name` | `text NOT NULL` | Título da tarefa |
| `description` | `text` | Descrição |
| `status` | `text` | Status (valores livres, ainda não padronizado) |
| `due_time` | `timestamptz` | Prazo |
| `finished_at` | `timestamptz` | Data de conclusão |
| `deal_id` | `bigint` | FK → `deals(id)` |
| `owner_user_id` | `uuid NOT NULL` | FK → `users(id)` — responsável |
| `updated_by` | `uuid` | FK → `users(id)` |
| `account_id` | `bigint` | FK → `accounts(id)` |

---

## 3. Comunicação & IA

### `channels`

Instâncias de WhatsApp (ou outro canal de mensageria) conectadas a uma conta.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | `bigint` (identity) | PK |
| `name` | `text NOT NULL` | Nome do canal |
| `type` | `channel_types (enum)` | Tipo: `whatsapp`, `evolution`, `instagram`, `uazapi`, `waha` |
| `status` | `text` | `'close'`, `'connecting'`, `'open'`, `'refused'` |
| `phone` | `text` | Número de telefone |
| `identifier` | `text` | Identificador único da instância |
| `pipeline_id` | `bigint` | FK → `pipelines(id)` — pipeline padrão |
| `account_id` | `bigint NOT NULL` | FK → `accounts(id)` |
| `created_by_user_id` | `uuid` | FK → `users(id)` |
| `config` | `jsonb` | Configurações específicas do provedor |
| `connected_at` | `timestamptz` | Data de conexão |
| `is_active` | `boolean NOT NULL` | Controle de ativação (default: `true`) |
| `ignored_contacts` | `text[]` | Contatos ignorados |
| `last_disconnected_at` | `timestamptz` | Data da última desconexão |
| `last_disconnected_reason` | `text` | Motivo da desconexão |

> **Nota**: A coluna `identifier` foi criada para substituir `phone` pois o identificador de canal e contato pode variar dependendo do tipo de canal (ex: Instagram não tem número de telefone). No entanto, a coluna antiga ainda é mantida para retrocompatibilidade, mas a nova coluna `identifier` é a principal a ser utilizada.

### `conversations`

Conversas entre contatos e a conta, originadas nos canais de mensageria.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | `bigint` (identity) | PK |
| `status` | `text NOT NULL` | `'in_progress'`, `'finished'`, `'follow_up'`, `'in_review'`, `'error'` (default: `'in_progress'`) |
| `channel_id` | `bigint` | FK → `channels(id)` |
| `person_id` | `bigint` | FK → `persons(id)` |
| `deal_id` | `bigint` | FK → `deals(id)` (nullable) |
| `agent_id` | `bigint` | FK → `agents(id)` |
| `account_id` | `bigint NOT NULL` | FK → `accounts(id)` |
| `created_by_user_id` | `uuid` | FK → `users(id)` |
| `last_message_at` | `timestamptz` | Última mensagem (atualizado via trigger) |
| `reply_to` | `text` | Identificador de resposta |
| `viewed_at` | `timestamptz` | Data de visualização |
| `channel_phone` | `text` | Telefone do canal (desnormalizado) |
| `channel_type` | `channel_types (enum)` | Tipo do canal (desnormalizado) |
| `channel_identifier` | `text` | Identificador do canal (desnormalizado) |
| `contact_identifier` | `text` | Identificador do contato |
| `follow_up_count` | `smallint` | Contador de follow-ups (default: `0`) |
| `is_paused` | `boolean NOT NULL` | Conversa pausada — IA não age (default: `false`) |
| `intent` | `text` | Intenção detectada pela IA |
| `summary` | `text` | Resumo gerado pela IA |

> **Nota**: As colunas `channel_identifier` e `contact_identifier` foram criadas para substituir `channel_phone` e `reply_to` respectivamente, pois o identificador de canal e contato pode variar dependendo do tipo de canal (ex: Instagram não tem número de telefone). No entanto, as colunas antigas ainda são mantidas para retrocompatibilidade, mas as novas colunas são as principais a serem utilizadas.

### `messages`

Mensagens individuais dentro de conversas.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | `bigint` (identity) | PK |
| `content` | `jsonb` | Conteúdo da mensagem (estrutura varia por tipo) |
| `direction` | `text NOT NULL` | `'incoming'`, `'outgoing'`, `'internal'` |
| `type` | `message_types (enum)` | `text`, `audio`, `image`, `video`, `document`, `contact`, `sticker`, `reaction`, `unknown`, `system` |
| `sender_type` | `text NOT NULL` | Tipo do remetente: `'agent'`, `'channel'`, `'person'`, `'system'`, `'user'` |
| `sender_id` | `text` | ID do remetente |
| `reaction` | `text` | Reação à mensagem |
| `viewed_at` | `timestamptz` | Data de visualização |
| `replied_to_message_id` | `text` | ID da mensagem respondida |
| `conversation_id` | `bigint NOT NULL` | FK → `conversations(id)` |
| `api_message_id` | `text` | ID da mensagem na API externa |

> **Nota**: A coluna `reaction` não está sendo utilizada atualmente. As reações são armazenadas como message_type `reaction` com o conteúdo da reação no campo `content`, e é relacionada com a mensagem alvo da reação através da coluna `replied_to_message_id`.

Estrutura do campo `content` da tabela `messages`:

```json
{
  "text": "Mensagem de texto",
  "audio": "URL do áudio",
  "image": "URL da imagem",
  "video": "URL do vídeo",
  "document": "URL do documento",
  "sticker": "URL da figurinha",
  "reaction": "Reação a mensagem",
  // Campos para media
  "caption": "Legenda da mensagem", // Imagem, Video, Documento
  "width": 400, // Imagem, Sticker, Video
  "height": 300, // Imagem, Sticker, Video
  "duration": 100, // Audio, Video (segundos)
  "fileLength": 100, // Imagem, Sticker, Audio, Video, Documento (bytes)
  "pageCount": 5, // Documento
  "fileName": "Nome do arquivo", // Documento
  "isGif": true // Video
}
```

### `messages_queue`

Fila temporária de mensagens para agrupamento e processamento pela IA. Esta tabela é utilizada exclusivamente pelo N8N — as Edge Functions enviam requisições para workflows N8N, que inserem registros nesta tabela via Supabase Node.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | `bigint` (identity) | PK |
| `message_id` | `text NOT NULL` | ID da mensagem |
| `conversation_id` | `bigint NOT NULL` | ID da conversa |

### `agents`

Agentes de IA configurados para automatizar conversas.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | `bigint` (identity) | PK |
| `name` | `text` | Nome do agente |
| `ai_name` | `text` | Nome do assistente de IA |
| `ai_model` | `text` | Modelo de IA: `'openai'`, `'grok'` ou `'gemini'` (default: `'openai'`) |
| `engine` | `text` | Engine de processamento: `'n8n'` |
| `instructions` | `text` | Instruções do agente |
| `about_instructions` | `text` | Instruções sobre o escritório (contexto para IA) |
| `status` | `text` | `'active'` ou `'inactive'` |
| `channel_id` | `bigint` | FK → `channels(id)` |
| `channel_phone` | `text` | Telefone do canal (desnormalizado) |
| `channel_identifier` | `text` | Identificador do canal (desnormalizado) |
| `webhook_url` | `text` | URL de webhook (N8N) |
| `account_id` | `bigint` | FK → `accounts(id)` |
| `office_hours_start` | `timetz` | Início do horário de atendimento (para follow-ups) |
| `office_hours_end` | `timetz` | Fim do horário de atendimento (para follow-ups) |
| `office_week_days` | `jsonb` | Dias da semana de atendimento (para follow-ups) |
| `follow_up_limit` | `smallint` | Limite de follow-ups (max: 10) |
| `follow_up_interval` | `smallint` | Intervalo (em minutos) entre follow-ups (min: 30) |

> **Nota**: A coluna `channel_identifier` foi criada para substituir `channel_phone`.

### `conversation_ai_sessions`

Sessão de IA vinculada a uma conversa (1:1 via UNIQUE em `conversation_id`).

> **Nota**: Esta tabela ainda não está sendo utilizada ativamente no sistema.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | `bigint` (identity) | PK |
| `conversation_id` | `bigint NOT NULL UNIQUE` | FK → `conversations(id)` |
| `agent_id` | `bigint` | FK → `agents(id)` |
| `ai_stage` | `text` | Estágio: `entry`, `identifying_intent`, `qualifying`, `scheduling`, `qualified`, `disqualified`, `review` |
| `ai_status` | `text` | Status: `active`, `waiting`, `follow_up`, `paused`, `error`, `completed` |
| `qualification_status` | `text` | `'qualified'`, `'disqualified'` ou `'review'` |
| `qualification_updated_at` | `timestamptz` | Data da atualização |
| `qualification_reason` | `text` | Motivo da qualificação |
| `greeting_sent` | `boolean` | Saudação enviada? |
| `intent` | `text` | Intenção detectada |
| `summary` | `text` | Resumo |
| `questions_answered` | `jsonb` | Perguntas respondidas |
| `ai_added_tags` | `bigint[]` | IDs de tags adicionadas pela IA |
| `follow_up_count` | `smallint` | Contador de follow-ups (default: `0`) |
| `last_follow_up_at` | `timestamptz` | Data do último follow-up |
| `waiting_until` | `timestamptz` | Aguardando até |
| `waiting_reason` | `text` | Motivo da espera |
| `error_message` | `text` | Mensagem de erro |
| `ended_at` | `timestamptz` | Data de encerramento |

---

## 4. Sistema

### `debug_logs`

Logs de debug para troubleshooting.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | `bigint` (identity) | PK |
| `type` | `text NOT NULL` | Tipo do log |
| `content` | `jsonb NOT NULL` | Conteúdo do log |
| `created_by_user_id` | `uuid` | Quem gerou o log |

---

## Relacionamentos Chave

```
accounts ─────────────┬── users (account_id)
                      ├── persons (account_id)
                      ├── organizations (account_id)
                      ├── pipelines (account_id)
                      ├── deals (account_id)
                      ├── channels (account_id)
                      ├── conversations (account_id)
                      ├── tags (account_id)
                      ├── tasks (account_id)
                      └── agents (account_id)

persons ──────────────┬── person_phones
                      ├── person_emails
                      ├── person_identifiers
                      ├── person_socials
                      └── deals (person_id)

pipelines ────────────┬── pipeline_stages (pipeline_id)
                      ├── deals (pipeline_id)
                      └── channels (pipeline_id)

conversations ────────┬── messages (conversation_id)
                      ├── messages_queue (conversation_id)
                      └── conversation_ai_sessions (conversation_id, UNIQUE)

deals ────────────────── deals_tags ── tags
```

> A notação `parent ─── child (fk_column)` indica que a coluna `fk_column` está na tabela filho e aponta para o pai.

---

## Arquivos Fonte

> Tabelas: [`supabase/schemas/public/tables/`](../../supabase/schemas/public/tables/)
> Funções: [`supabase/schemas/public/functions/`](../../supabase/schemas/public/functions/)
> Triggers: [`supabase/schemas/public/triggers/`](../../supabase/schemas/public/triggers/)
> RLS: [`supabase/schemas/public/rls/`](../../supabase/schemas/public/rls/)
> Views: [`supabase/schemas/public/views/`](../../supabase/schemas/public/views/)
> Constraints: [`supabase/schemas/public/constraints/`](../../supabase/schemas/public/constraints/)
> Indexes: [`supabase/schemas/public/indexes/`](../../supabase/schemas/public/indexes/)
