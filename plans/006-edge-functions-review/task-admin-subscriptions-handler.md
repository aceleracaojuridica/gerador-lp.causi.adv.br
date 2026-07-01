# Task: Revisão — admin-subscriptions-handler

**Doc atual:** `docs/edge-functions/admin-subscriptions-handler.md`
**Código-fonte:** `supabase/functions/admin-subscriptions-handler/index.ts`
**Tipo de função:** Admin Handler (arquivo único)

---

## Problemas Identificados

1. **Frontmatter ausente** — não possui bloco YAML `---` com `title` e `description`
2. **Configuração ausente** — não lista variáveis de ambiente necessárias (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`)
3. **Deploy ausente** — não inclui o comando de deploy
4. **Output incompleto** — possui apenas exemplo de sucesso; falta exemplo de resposta de erro (401, 403, etc.)
5. **Notas/Observações ausente** — não possui seção com informações adicionais relevantes (ex: dependência da RPC `is_super_admin`, RPCs de sincronização chamadas)

---

## Pré-requisito Obrigatório

Antes de qualquer edição, **leia o arquivo da edge function**:

```
supabase/functions/admin-subscriptions-handler/index.ts
```

O código é a **fonte da verdade**. Toda seção do doc deve refletir o comportamento real. Se o doc atual descreve algo diferente do que o código faz, **corrija o doc**.

---

## O que deve ser feito

1. **Adicionar frontmatter** no topo do arquivo:
   ```yaml
   ---
   title: Admin Subscriptions Handler
   description: Edge Function para gerenciamento administrativo de assinaturas e adicionais
   ---
   ```

2. **Adicionar seção "Configuração"** após o fluxo de processamento:
   - Variáveis de ambiente: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
   - Conferir no código-fonte se há outras variáveis

3. **Completar seção "Output"** — adicionar exemplos de resposta de erro:
   - `401` (token inválido)
   - `403` (não é super admin)
   - `400` (campos obrigatórios ausentes)
   - `404` (plano/conta não encontrado)
   - Conferir os status reais retornados no `index.ts`

4. **Adicionar seção "Deploy"**:
   ```bash
   supabase functions deploy admin-subscriptions-handler
   ```

5. **Adicionar seção "Notas"** com informações relevantes:
   - Dependência da RPC `is_super_admin`
   - RPCs de sincronização chamadas (`sync_deals_limits_for_account`, etc.)
   - Comportamento ao criar nova assinatura (cancela as outras ativas)
   - Conferir contra o código-fonte para capturar detalhes adicionais

6. **Padronizar títulos das seções** — remover emojis dos headers se decidido pelo padrão (manter consistência com o que for definido para todo o conjunto)

---

## O que NÃO fazer

- Não preservar texto do doc atual sem verificar se ainda corresponde ao código — o doc pode estar desatualizado
- Não inventar comportamentos, campos ou status codes que não estão no código
- Não remover seções inteiras sem antes verificar que o conteúdo está incorreto ou obsoleto

---

## Critério de Conclusão

- [ ] O arquivo `index.ts` foi lido antes de editar o doc
- [ ] Frontmatter YAML presente com `title` e `description`
- [ ] Fluxo de Processamento conferido e corrigido/completado conforme o código real
- [ ] Seção de Configuração presente com variáveis de ambiente extraídas do código
- [ ] Seção de Output com exemplos de sucesso E erro, extraídos do código
- [ ] Seção de Deploy com comando correto
- [ ] Seção de Notas com informações relevantes extraídas do código-fonte
- [ ] Estrutura de seções segue o padrão "Admin Handler" definido no `implementation-plan.md`
