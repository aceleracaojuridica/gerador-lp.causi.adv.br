# Revisão da Documentação — Edge Functions

## Diagnóstico Consolidado

Auditoria comparativa dos 7 arquivos em `docs/edge-functions/`. A coluna indica presença (✅), ausência (❌), parcial (⚠️) ou não-aplicável (N/A) de cada seção.

| Seção | overview | admin-subs | channel-sync | evolution-v2 | subs-cron-v2 | uazapi | waha |
|---|---|---|---|---|---|---|---|
| **Frontmatter** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Descrição** | ✅ | ✅ | ✅ | ✅¹ | ✅ | ✅¹ | ✅ |
| **Estrutura de Arquivos** | N/A | N/A | N/A | ✅ | N/A | ✅ | ❌² |
| **Fluxo de Processamento** | N/A | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️³ |
| **Configuração** | N/A | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ |
| **Input** | N/A | ✅ | ✅ | ❌⁴ | ✅⁵ | ❌⁴ | ✅ |
| **Output** | N/A | ⚠️⁶ | ✅ | ❌⁴ | ✅ | ❌⁴ | ⚠️⁷ |
| **Deploy** | ✅ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ |
| **Notas** | N/A | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ |

### Notas da tabela

1. Typos na descrição: "processae" → "processa", "WhatsAp" → "WhatsApp"
2. WAHA possui **10 arquivos-fonte** (mesma complexidade que evolution/uazapi) mas não documenta a estrutura
3. Fluxo do WAHA muito superficial (~40 linhas) comparado a evolution/uazapi (~180+ linhas cada), apesar de complexidade similar
4. Evolution e UAZAPI não possuem seções formais de Input/Output (formato de requisição/resposta do webhook)
5. Minimal mas adequado para cron job (ativação sem body)
6. Apenas exemplo de sucesso; falta exemplo de erro
7. Mencionado brevemente, sem exemplos JSON

---

## Observações Gerais

- **`overview.md`** — único doc com frontmatter YAML. Bem estruturado como índice. **Não precisa de revisão.**
- **`evolution-v2` e `uazapi`** — detalhados em fluxo e melhorias, mas faltam seções formais de Input/Output. A seção "Melhorias Implementadas" parece changelog/release notes, não documentação de referência.
- **`waha`** — **o mais incompleto**. Mesma estrutura de código (10 arquivos `.ts`) que evolution/uazapi, mas doc com ~40 linhas vs. ~180+ das outras.
- **Todos os docs exceto `overview.md`** — faltam frontmatter YAML (`title`, `description`).

### Diretórios no código-fonte (`supabase/functions/`)

| Função | Arquivos | Tipo |
|---|---|---|
| `admin-subscriptions-handler` | 1 (`index.ts`) | Admin Handler |
| `channel-sync-webhook` | 1 (`index.ts`) | Webhook de DB |
| `evolution-webhook-handler-v2` | 9 arquivos | Webhook Handler de Mensageria |
| `subscriptions-lifecycle-cron-v2` | 1 (`index.ts`) | Cron Job |
| `uazapi-webhook-handler` | 10 arquivos | Webhook Handler de Mensageria |
| `waha-webhook-handler` | 10 arquivos | Webhook Handler de Mensageria |

---

## Padrão Proposto por Tipo de Função

### Webhook Handler de Mensageria (evolution, uazapi, waha)

1. **Frontmatter** (`title`, `description`)
2. **Descrição** — parágrafo curto explicando o propósito
3. **Estrutura de Arquivos** — árvore com descrição de cada arquivo `.ts`
4. **Fluxo de Processamento** — passos numerados para evento de mensagem + evento de status
5. **Configuração** — variáveis de ambiente + origens autorizadas
6. **Input** — headers + body com exemplo JSON do webhook do provedor
7. **Output** — exemplos JSON de sucesso e erro
8. **Tipos de Mensagens Suportados** — lista com status de suporte
9. **Integração com Agentes de IA** — payloads enviados para bots
10. **Deploy** — comando `supabase functions deploy <nome>`
11. **Notas** — observações técnicas relevantes

### Webhook de DB (channel-sync)

1. **Frontmatter** (`title`, `description`)
2. **Descrição**
3. **Fluxo de Processamento**
4. **Configuração** — variáveis de ambiente
5. **Input** — payload do database trigger
6. **Output**
7. **Deploy**
8. **Notas**

### Admin Handler (admin-subscriptions)

1. **Frontmatter** (`title`, `description`)
2. **Descrição**
3. **Fluxo de Processamento**
4. **Configuração** — variáveis de ambiente
5. **Input** — headers + body com tabela de campos
6. **Output** — exemplos JSON de sucesso e erro
7. **Deploy**
8. **Notas**

### Cron Job (subscriptions-lifecycle)

1. **Frontmatter** (`title`, `description`)
2. **Descrição**
3. **Fluxo de Processamento** — schedule + passos executados
4. **Configuração** — variáveis de ambiente + cron schedule
5. **Input** — acionamento automático (minimal)
6. **Output** — relatório sintético
7. **Deploy**
8. **Notas**

---

## Tasks Criadas

| Task | Função | Prioridade | Motivo |
|---|---|---|---|
| `task-waha-webhook-handler.md` | waha-webhook-handler | Alta | Doc mais incompleto; precisa de verificação contra código-fonte |
| `task-admin-subscriptions-handler.md` | admin-subscriptions-handler | Média | Faltam 4 seções (frontmatter, config, deploy, notas) + output incompleto |
| `task-channel-sync-webhook.md` | channel-sync-webhook | Média | Faltam 4 seções (frontmatter, config, deploy, notas) |
| `task-subscriptions-lifecycle-cron-v2.md` | subscriptions-lifecycle-cron-v2 | Média | Faltam 4 seções + typos |
| `task-evolution-webhook-handler-v2.md` | evolution-webhook-handler-v2 | Média | Faltam frontmatter, Input/Output formais. Reorganizar seção "Melhorias" |
| `task-uazapi-webhook-handler.md` | uazapi-webhook-handler | Média | Faltam frontmatter, Input/Output formais. Corrigir typos |
