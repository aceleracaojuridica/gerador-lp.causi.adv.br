# Task: Revisão — evolution-webhook-handler-v2

**Doc atual:** `docs/edge-functions/evolution-webhook-handler-v2.md`
**Código-fonte:** `supabase/functions/evolution-webhook-handler-v2/` (9 arquivos)
**Tipo de função:** Webhook Handler de Mensageria

---

## Problemas Identificados

1. **Frontmatter ausente** — não possui bloco YAML `---` com `title` e `description`
2. **Typos na descrição** — "processae" → "processa", "WhatsAp" → "WhatsApp"
3. **Seção "Input" ausente** — não há seção formal documentando o formato da requisição (headers, body JSON do webhook da Evolution API)
4. **Seção "Output" ausente** — não há seção formal documentando as respostas da função (sucesso e erro)
5. **Seção "Melhorias Implementadas" fora do padrão** — parece changelog/release notes, não documentação de referência. Informações relevantes estão dispersas nesta seção em vez de incorporadas nas seções técnicas adequadas

---

## Pré-requisito Obrigatório

Antes de qualquer edição, **leia todos os arquivos da edge function**:

```
supabase/functions/evolution-webhook-handler-v2/
├── index.ts
├── handler.ts
├── messageHandler.ts
├── statusHandler.ts
├── evolutionApi.ts
├── mediaProcessor.ts
├── decryption.ts
├── storageHelper.ts
└── aiAgentHelper.ts
```

O código é a **fonte da verdade**. Toda seção do doc deve refletir o comportamento real. Se o doc atual descreve algo diferente do que o código faz, **corrija o doc**.

---

## O que deve ser feito

1. **Adicionar frontmatter** no topo do arquivo:
   ```yaml
   ---
   title: Evolution Webhook Handler v2
   description: Processa webhooks de mensagens e status da Evolution API com suporte a mídia, agentes de IA e detecção internacional
   ---
   ```

2. **Corrigir typos** na descrição:
   - "processae" → "processa"
   - "WhatsAp" → "WhatsApp"

3. **Adicionar seção "Input"** entre Configuração e Output:
   - Headers esperados (se houver autenticação)
   - Exemplo JSON do payload que a Evolution API envia para o webhook
   - Documentar os campos principais usados pela função
   - Conferir no `handler.ts` e `messageHandler.ts` quais campos são efetivamente lidos do body

4. **Adicionar seção "Output"** após Input:
   - Exemplo JSON de resposta de sucesso (200)
   - Exemplos de erro (400, 403, 500)
   - Conferir os status codes e formatos reais retornados no código

5. **Reorganizar seção "Melhorias Implementadas"**:
   - Extrair informações técnicas relevantes e integrá-las nas seções adequadas (ex: detalhes de performance no Fluxo, detalhes de segurança nas Notas)
   - Considerar remover a seção "Melhorias Implementadas" por completo ou convertê-la em uma seção "Notas" mais enxuta com os pontos-chave
   - **Atenção**: não perder informações técnicas úteis no processo — apenas realocar

6. **Padronizar títulos das seções** — remover emojis para consistência com o padrão

---

## O que NÃO fazer

- Não preservar texto do doc atual sem verificar se ainda corresponde ao código — o doc pode estar desatualizado
- Não inventar comportamentos que não estão no código
- Não remover seções inteiras sem antes verificar que o conteúdo está incorreto ou obsoleto

---

## Critério de Conclusão

- [ ] Todos os arquivos da edge function foram lidos antes de editar o doc
- [ ] Frontmatter YAML presente com `title` e `description`
- [ ] Typos corrigidos na descrição
- [ ] Fluxo de Processamento conferido e corrigido/completado conforme o código real
- [ ] Seção de Input presente com formato do webhook da Evolution API, extraído do código
- [ ] Seção de Output presente com exemplos de sucesso e erro, extraídos do código
- [ ] Seção "Melhorias Implementadas" reorganizada ou integrada nas seções adequadas
- [ ] Títulos das seções sem emojis
- [ ] Estrutura de seções segue o padrão "Webhook Handler de Mensageria" definido no `implementation-plan.md`
