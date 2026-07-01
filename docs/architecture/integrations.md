---
title: Integrações Externas
description: Provedores de WhatsApp (Evolution, UAZAPI, WAHA, Meta), fluxo de webhooks, envio de mensagens
---

# Integrações Externas

O Causi integra com provedores que abstraem a API do WhatsApp e Instagram para recepção e envio de mensagens.

---

## Provedores

O Causi não gerencia instâncias WhatsApp diretamente. Cada canal (`channels`) é conectado a um provedor externo que gerencia a sessão do WhatsApp.

| Provedor | Protocolo | Canal | Edge Function |
|----------|-----------|-------|--------------|
| Evolution API | REST + Webhook | WhatsApp (multi-device) | [`evolution-webhook-handler-v2`](../edge-functions/evolution-webhook-handler-v2.md) |
| UazAPI | REST + Webhook | WhatsApp (multi-device) | [`uazapi-webhook-handler`](../edge-functions/uazapi-webhook-handler.md) |
| WAHA | REST + Webhook | WhatsApp | [`waha-webhook-handler`](../edge-functions/waha-webhook-handler.md) |
| WhatsApp Cloud API | REST + Webhook | WhatsApp Business | Não implementado |
| Instagram API | REST + Webhook | Instagram | Não implementado |

Os provedores são identificados pelo enum `channel_types`: `evolution`, `uazapi`, `waha`, `whatsapp`, `instagram`.

**Observação:**
- WAHA não está sendo utilizado.
- Evolution GO é uma versão mais recente e escalável da Evolution API, mas ainda não foi integrada.
- WhatsApp Cloud API e Instagram API são integrações planejadas, mas ainda não implementadas.

---

## Recepção de Mensagens (Webhooks)

Mensagens são recebidas via webhooks nos endpoints das Edge Functions:

```
POST https://<project-ref>.supabase.co/functions/v1/evolution-webhook-handler-v2
POST https://<project-ref>.supabase.co/functions/v1/uazapi-webhook-handler
POST https://<project-ref>.supabase.co/functions/v1/waha-webhook-handler
```

### Fluxo de processamento

1. **Receber** payload do provedor
2. **Validar** assinatura/token de autenticação
3. **Normalizar** payload para modelo interno (`messages`, `conversations`)
4. **Identificar** `account_id` e canal via `channels.identifier` e `channels.config` (JSONB com o token/apikey do provedor)
5. **Localizar ou criar** contato via `person_identifiers` (JID/LID) — função `find_or_create_contact_flow_v2`
6. **Persistir** mensagem em `messages` e trigger atualiza `conversations.last_message_at`
7. **Acionar IA** — Edge Function envia requisição para endpoint N8N, que ativa workflow de Agente de IA com informações da conta, conversa e mensagem. O N8N cria a fila de mensagens em `messages_queue` via Supabase Node para agrupamento e processamento
8. **Notificar** frontend via Supabase Realtime

---

## Envio de Mensagens

```
POST /api/messages/send
Body: { conversation_id, content }
```

1. Resolver canal da conversa (`channels` via `conversations.channel_id`)
2. Selecionar cliente HTTP do provedor correto
3. Enviar mensagem via REST do provedor
4. Persistir mensagem em `messages` com `direction = 'outgoing'`

---

## Sincronização de Canais

Ao deletar ou inativar um canal no Causi:
- Edge Function [`channel-sync-webhook`](../edge-functions/channel-sync-webhook.md) notifica a API externa para desligar a instância
- Trigger `channel_sync_on_update_delete` dispara a sincronização

---

## Integrações de IA

Os agentes de IA do Causi são orquestrados via workflows N8N, acionados por requisições das Edge Functions.

| Integração | Uso | Fluxo |
|------------|-----|-------|
| **N8N** | Orquestração de workflows de IA | Edge Function → requisição HTTP para N8N → N8N recebe contexto (account, conversa, mensagem) → Agente IA processa → resposta via API do provedor WhatsApp |
| **OpenAI** | Transcrição de áudio | Requisição direta para API da OpenAI (Whisper) para transcrever mensagens de áudio |
| **Modelos de IA** | Qualificação e resposta | Configurável por agente via campo `agents.ai_model`: `openai`, `grok` ou `gemini` |

### Fluxo do Agente de IA

1. Edge Function persiste a mensagem recebida
2. Se o agente está ativo e a conversa não está pausada, envia requisição para endpoint N8N
3. N8N recebe payload com `agent_id`, `channel_id`, `account_id`, `conversation_id`, `message_id`
4. N8N registra em `messages_queue` para agrupamento (~40s para contexto completo)
5. Agente de IA processa o lote, qualifica, adiciona tags, move estágio e responde
6. Resposta enviada via API REST do provedor WhatsApp

---

## Credenciais e Segurança

- Configurações do provedor armazenadas em `channels.config` (jsonb)
- Segredos de webhook via variáveis de ambiente (Supabase Edge Functions Secrets), nunca hardcoded
- Edge Functions usam `SERVICE_ROLE_KEY` para bypass de RLS ao processar webhooks
- Edge Functions verificam origem da requisição e método HTTP para validar autenticidade

---

## Edge Functions Relacionadas

| Edge Function | Descrição |
|---------------|-----------|
| [`admin-subscriptions-handler`](../edge-functions/admin-subscriptions-handler.md) | Gerenciamento de assinaturas |
| [`channel-sync-webhook`](../edge-functions/channel-sync-webhook.md) | Sincronização de canais |
| [`evolution-webhook-handler-v2`](../edge-functions/evolution-webhook-handler-v2.md) | Webhooks Evolution API |
| [`subscriptions-lifecycle-cron-v2`](../edge-functions/subscriptions-lifecycle-cron-v2.md) | Cron de billing |
| [`uazapi-webhook-handler`](../edge-functions/uazapi-webhook-handler.md) | Webhooks UAZAPI |
| [`waha-webhook-handler`](../edge-functions/waha-webhook-handler.md) | Webhooks WAHA |

> Detalhes de cada Edge Function na pasta [edge-functions/](../edge-functions/).
