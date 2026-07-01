# Task: Revisão — subscriptions-lifecycle-cron-v2

**Doc atual:** `docs/edge-functions/subscriptions-lifecycle-cron-v2.md`
**Código-fonte:** `supabase/functions/subscriptions-lifecycle-cron-v2/index.ts`
**Tipo de função:** Cron Job (arquivo único)

---

## Problemas Identificados

1. **Frontmatter ausente** — não possui bloco YAML `---` com `title` e `description`
2. **Configuração ausente** — não lista variáveis de ambiente necessárias nem o cron schedule configurado
3. **Deploy ausente** — não inclui o comando de deploy
4. **Notas/Observações ausente** — não possui seção com informações adicionais (ex: período de carência de 3 dias, dependência de RPCs de sincronização, comportamento quando plano Free não existe)
5. **Typos no texto** — "exister" → "existir" (passo 3), "Exclui pesquisas" parece confuso (passo 4)

---

## Pré-requisito Obrigatório

Antes de qualquer edição, **leia o arquivo da edge function**:

```
supabase/functions/subscriptions-lifecycle-cron-v2/index.ts
```

O código é a **fonte da verdade**. Toda seção do doc deve refletir o comportamento real. Se o doc atual descreve algo diferente do que o código faz, **corrija o doc**.

---

## O que deve ser feito

1. **Adicionar frontmatter** no topo do arquivo:
   ```yaml
   ---
   title: Subscriptions Lifecycle Cron v2
   description: Cron job para processamento automático de expiração de trials e transições de assinaturas
   ---
   ```

2. **Corrigir typos**:
   - Passo 3: "exister" → "existir"
   - Passo 4: revisar a frase "Exclui pesquisas ao plano vitalício / free" — está confusa, provavelmente deveria ser "Exclui da pesquisa planos vitalícios/free" ou similar. Conferir contra o código

3. **Adicionar seção "Configuração"** após o fluxo de processamento:
   - Variáveis de ambiente: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (conferir no código)
   - **Cron schedule**: qual é a frequência configurada no pg_cron? Conferir em `supabase/config.toml` ou no código

4. **Adicionar seção "Deploy"**:
   ```bash
   supabase functions deploy subscriptions-lifecycle-cron-v2
   ```

5. **Adicionar seção "Notas"** com informações relevantes:
   - Período de carência (grace period) de 3 dias mencionado no fluxo
   - RPCs de sincronização chamadas ao final
   - Comportamento quando plano Free não existe no sistema
   - Como o cron é registrado (pg_cron no Supabase?)
   - Conferir contra o código-fonte

6. **Padronizar títulos das seções** — remover emojis dos headers para consistência

---

## O que NÃO fazer

- Não preservar texto do doc atual sem verificar se ainda corresponde ao código — o doc pode estar desatualizado
- Não inventar comportamentos, RPCs ou lógicas que não estão no código
- Não remover seções inteiras sem antes verificar que o conteúdo está incorreto ou obsoleto

---

## Critério de Conclusão

- [ ] O arquivo `index.ts` foi lido antes de editar o doc
- [ ] Frontmatter YAML presente com `title` e `description`
- [ ] Fluxo de Processamento conferido e corrigido/completado conforme o código real
- [ ] Typos corrigidos e frases confusas revisadas (conferidas contra o código)
- [ ] Seção de Configuração presente com variáveis de ambiente e cron schedule extraídos do código
- [ ] Seção de Deploy com comando correto
- [ ] Seção de Notas com informações sobre grace period, RPCs e comportamento de fallback
- [ ] Estrutura de seções segue o padrão "Cron Job" definido no `implementation-plan.md`
