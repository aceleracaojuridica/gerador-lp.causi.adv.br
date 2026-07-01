# Task: Revisão — channel-sync-webhook

**Doc atual:** `docs/edge-functions/channel-sync-webhook.md`
**Código-fonte:** `supabase/functions/channel-sync-webhook/index.ts`
**Tipo de função:** Webhook de DB (arquivo único, disparado por trigger do banco)

---

## Problemas Identificados

1. **Frontmatter ausente** — não possui bloco YAML `---` com `title` e `description`
2. **Configuração ausente** — não lista variáveis de ambiente necessárias
3. **Deploy ausente** — não inclui o comando de deploy
4. **Notas/Observações ausente** — não possui seção com informações adicionais (ex: qual trigger do banco dispara esta função, quais plataformas são suportadas além de evolution/uazapi)

---

## Pré-requisito Obrigatório

Antes de qualquer edição, **leia o arquivo da edge function**:

```
supabase/functions/channel-sync-webhook/index.ts
```

O código é a **fonte da verdade**. Toda seção do doc deve refletir o comportamento real. Se o doc atual descreve algo diferente do que o código faz, **corrija o doc**.

---

## O que deve ser feito

1. **Adicionar frontmatter** no topo do arquivo:
   ```yaml
   ---
   title: Channel Sync Webhook
   description: Webhook de banco de dados para sincronizar exclusão/inativação de canais com APIs externas
   ---
   ```

2. **Adicionar seção "Configuração"** após o fluxo de processamento:
   - Variáveis de ambiente: conferir no `index.ts` quais são usadas (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, etc.)
   - Identificar se há URLs de APIs externas configuradas como variáveis de ambiente ou extraídas do registro do canal

3. **Adicionar seção "Deploy"**:
   ```bash
   supabase functions deploy channel-sync-webhook
   ```

4. **Adicionar seção "Notas"** com informações relevantes:
   - Qual trigger do Supabase dispara esta função (tabela + evento)
   - Comportamento "fire-and-forget" — implicações (não há retry automático se a API externa falhar?)
   - Plataformas suportadas (o doc atual menciona evolution e uazapi — verificar se WAHA também é suportada no código)
   - Conferir contra o código-fonte

5. **Padronizar títulos das seções** — remover emojis dos headers para consistência

---

## O que NÃO fazer

- Não preservar texto do doc atual sem verificar se ainda corresponde ao código — o doc pode estar desatualizado
- Não inventar comportamentos ou plataformas suportadas que não estão no código
- Não remover seções inteiras sem antes verificar que o conteúdo está incorreto ou obsoleto

---

## Critério de Conclusão

- [ ] O arquivo `index.ts` foi lido antes de editar o doc
- [ ] Frontmatter YAML presente com `title` e `description`
- [ ] Fluxo de Processamento conferido e corrigido/completado conforme o código real
- [ ] Seção de Configuração presente com variáveis de ambiente extraídas do código
- [ ] Seção de Deploy com comando correto
- [ ] Seção de Notas com informações sobre trigger, comportamento e plataformas suportadas
- [ ] Estrutura de seções segue o padrão "Webhook de DB" definido no `implementation-plan.md`
