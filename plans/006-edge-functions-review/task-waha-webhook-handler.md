# Task: Revisão — waha-webhook-handler

**Doc atual:** `docs/edge-functions/waha-webhook-handler.md`
**Código-fonte:** `supabase/functions/waha-webhook-handler/` (10 arquivos)
**Tipo de função:** Webhook Handler de Mensageria

> **⚠️ Prioridade Alta** — Este é o doc mais incompleto do conjunto. O código-fonte possui 10 arquivos `.ts` (mesma complexidade que evolution/uazapi), mas a documentação tem ~40 linhas vs. ~180+ das outras funções de mensageria.

---

## Problemas Identificados

1. **Frontmatter ausente** — não possui bloco YAML `---` com `title` e `description`
2. **Estrutura de Arquivos ausente** — a função tem **10 arquivos** (`index.ts`, `handler.ts`, `messageHandler.ts`, `statusHandler.ts`, `wahaApi.ts`, `mediaProcessor.ts`, `decryption.ts`, `storageHelper.ts`, `countryCodeHelper.ts`, `aiAgentHelper.ts`) mas nenhum é documentado
3. **Fluxo de Processamento muito superficial** — 4 passos genéricos vs. 13+ passos detalhados nos handlers equivalentes (evolution, uazapi). Não descreve o fluxo de mensagem, criação de person/deal/conversation, processamento de mídia, etc.
4. **Configuração ausente** — não lista variáveis de ambiente nem origens autorizadas
5. **Output insuficiente** — menciona códigos de status (200, 400, 403, 405, 500) mas sem exemplos JSON
6. **Deploy ausente** — não inclui o comando de deploy
7. **Notas/Observações ausente** — nenhuma informação adicional
8. **Tipos de Mensagens Suportados ausente** — seção necessária para handler de mensageria
9. **Integração com Agentes de IA ausente** — seção necessária para handler de mensageria

---

## Pré-requisito Obrigatório

Antes de qualquer edição, **leia todos os arquivos da edge function**:

```
supabase/functions/waha-webhook-handler/
├── index.ts
├── handler.ts
├── messageHandler.ts
├── statusHandler.ts
├── wahaApi.ts
├── mediaProcessor.ts
├── decryption.ts
├── storageHelper.ts
├── countryCodeHelper.ts
└── aiAgentHelper.ts
```

O código é a **fonte da verdade**. Toda seção do doc deve refletir o comportamento real. Se o doc atual descreve algo diferente do que o código faz, **corrija o doc**.

---

## O que deve ser feito

> **Atenção**: Esta é a task mais extensa. Praticamente todas as seções precisam ser criadas ou expandidas. Cada seção deve ser escrita com base no código lido, não no doc atual.

1. **Adicionar frontmatter** no topo do arquivo:
   ```yaml
   ---
   title: WAHA Webhook Handler
   description: Processa webhooks de mensagens e status da WAHA (WhatsApp HTTP API) com suporte a mídia, agentes de IA e detecção internacional
   ---
   ```

2. **Adicionar seção "Estrutura de Arquivos"** — listar todos os 10 arquivos com descrição de cada um. Usar a estrutura do evolution/uazapi como referência de formato, mas conferir o conteúdo real de cada arquivo:
   - `index.ts` — entry point
   - `handler.ts` — roteamento e validação de origem
   - `messageHandler.ts` — processamento de mensagens
   - `statusHandler.ts` — processamento de status
   - `wahaApi.ts` — integração com API da WAHA
   - `mediaProcessor.ts` — processamento de mídia
   - `decryption.ts` — descriptografia
   - `storageHelper.ts` — operações de storage
   - `countryCodeHelper.ts` — tratamento de DDI internacional
   - `aiAgentHelper.ts` — integração com agentes de IA

3. **Expandir seção "Fluxo de Processamento"** significativamente:
   - Documentar fluxo de **Evento de Mensagem** com os passos detalhados (validação → canal → contatos ignorados → conversation → person/deal → duplicidade → mídia → inserção → pause → IA)
   - Documentar fluxo de **Evento de Status** separadamente
   - Usar evolution/uazapi como referência de nível de detalhe, mas **extrair a lógica real do código-fonte da WAHA**

4. **Adicionar seção "Configuração"**:
   - Variáveis de ambiente (conferir no `index.ts` / `handler.ts`)
   - Origens autorizadas (conferir a URL do WAHA no `handler.ts`)

5. **Expandir seção "Input"** — a tabela atual é boa, mas falta exemplo JSON completo do payload da WAHA

6. **Expandir seção "Output"** — adicionar exemplos JSON:
   - Sucesso (200)
   - Erros (400, 403, 405, 500) com body de cada um
   - Conferir no código os formatos reais retornados

7. **Adicionar seção "Tipos de Mensagens Suportados"**:
   - Conferir no `messageHandler.ts` quais tipos são suportados
   - Usar formato de lista similar ao evolution/uazapi

8. **Adicionar seção "Integração com Agentes de IA"**:
   - Conferir no `aiAgentHelper.ts` qual payload é enviado para bots
   - Documentar o formato JSON

9. **Adicionar seção "Deploy"**:
   ```bash
   supabase functions deploy waha-webhook-handler
   ```

10. **Adicionar seção "Notas"** com informações relevantes extraídas do código

11. **Padronizar títulos das seções** — remover emojis para consistência

---

## O que NÃO fazer

- **Não copiar texto do evolution ou uazapi** — a WAHA tem APIs e payloads diferentes; cada seção deve refletir o comportamento real do código
- Não inventar payloads ou fluxos — tudo deve vir do código-fonte
- Não preservar texto do doc atual sem verificar se ainda corresponde ao código
- Não adicionar seção "Melhorias Implementadas" — manter o padrão limpo proposto

---

## Critério de Conclusão

- [ ] Frontmatter YAML presente com `title` e `description`
- [ ] Seção de Estrutura de Arquivos com todos os 10 arquivos documentados
- [ ] Fluxo de Processamento detalhado para eventos de mensagem e status, verificado contra o código
- [ ] Seção de Configuração com variáveis de ambiente e origens autorizadas
- [ ] Seção de Input com tabela E exemplo JSON do webhook da WAHA
- [ ] Seção de Output com exemplos de sucesso e erro
- [ ] Seção de Tipos de Mensagens Suportados
- [ ] Seção de Integração com Agentes de IA com payload JSON
- [ ] Seção de Deploy com comando correto
- [ ] Seção de Notas com informações relevantes
- [ ] **Todas as seções conferidas contra o código-fonte real**
- [ ] Estrutura de seções segue o padrão "Webhook Handler de Mensageria" definido no `implementation-plan.md`
