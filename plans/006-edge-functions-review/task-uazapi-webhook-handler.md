# Task: Revisão — uazapi-webhook-handler

**Doc atual:** `docs/edge-functions/uazapi-webhook-handler.md`
**Código-fonte:** `supabase/functions/uazapi-webhook-handler/` (10 arquivos)
**Tipo de função:** Webhook Handler de Mensageria

---

## Problemas Identificados

1. **Frontmatter ausente** — não possui bloco YAML `---` com `title` e `description`
2. **Typos na descrição** — "processae" → "processa", "WhatsAp" → "WhatsApp" (copiado do evolution)
3. **Seção "Input" ausente** — não há seção formal documentando o formato da requisição (headers, body JSON do webhook da UAZAPI)
4. **Seção "Output" ausente** — não há seção formal documentando as respostas da função (sucesso e erro)
5. **Seção "Melhorias Implementadas" fora do padrão** — mesmo problema do evolution: parece changelog, não documentação de referência

---

## Pré-requisito Obrigatório

Antes de qualquer edição, **leia todos os arquivos da edge function**:

```
supabase/functions/uazapi-webhook-handler/
├── index.ts
├── handler.ts
├── messageHandler.ts
├── statusHandler.ts
├── uazapiApi.ts
├── mediaProcessor.ts
├── decryption.ts
├── storageHelper.ts
├── countryCodeHelper.ts
└── aiAgentHelper.ts
```

O código é a **fonte da verdade**. Toda seção do doc deve refletir o comportamento real. Se o doc atual descreve algo diferente do que o código faz, **corrija o doc**.

---

## O que deve ser feito

1. **Adicionar frontmatter** no topo do arquivo:
   ```yaml
   ---
   title: UAZAPI Webhook Handler
   description: Processa webhooks de mensagens e status da UAZAPI com suporte a mídia, descriptografia local e agentes de IA
   ---
   ```

2. **Corrigir typos** na descrição:
   - "processae" → "processa"
   - "WhatsAp" → "WhatsApp"

3. **Adicionar seção "Input"** entre Configuração e Output:
   - Headers esperados (se houver)
   - Exemplo JSON do payload que a UAZAPI envia para o webhook
   - Documentar os campos principais: `MessageType`, `BaseUrl`, `owner`, `token`, etc.
   - Conferir no `handler.ts` e `messageHandler.ts` quais campos são efetivamente lidos

4. **Adicionar seção "Output"** após Input:
   - Exemplo JSON de resposta de sucesso (200)
   - Exemplos de erro (400, 403, 500)
   - Conferir os status codes reais no código

5. **Reorganizar seção "Melhorias Implementadas"**:
   - Integrar informações técnicas relevantes nas seções adequadas (Fluxo, Notas)
   - Considerar remover ou converter em seção "Notas" enxuta
   - Não perder informações técnicas úteis

6. **Padronizar títulos das seções** — remover emojis para consistência

---

## O que NÃO fazer

- Não preservar texto do doc atual sem verificar se ainda corresponde ao código — o doc pode estar desatualizado
- Não inventar comportamentos ou payloads que não estão no código
- Não copiar input/output do evolution — UAZAPI tem formato de payload diferente
- Não remover seções inteiras sem antes verificar que o conteúdo está incorreto ou obsoleto

---

## Critério de Conclusão

- [ ] Todos os arquivos da edge function foram lidos antes de editar o doc
- [ ] Frontmatter YAML presente com `title` e `description`
- [ ] Typos corrigidos na descrição
- [ ] Fluxo de Processamento conferido e corrigido/completado conforme o código real
- [ ] Seção de Input presente com formato do webhook da UAZAPI, extraído do código
- [ ] Seção de Output presente com exemplos de sucesso e erro, extraídos do código
- [ ] Seção "Melhorias Implementadas" reorganizada ou integrada nas seções adequadas
- [ ] Títulos das seções sem emojis
- [ ] Estrutura de seções segue o padrão "Webhook Handler de Mensageria" definido no `implementation-plan.md`
