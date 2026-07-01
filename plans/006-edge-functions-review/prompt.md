# Revisão da Documentação — Edge Functions

## Contexto

A pasta `docs/edge-functions/` documenta as seguintes Edge Functions do projeto:

- `admin-subscriptions-handler.md`
- `channel-sync-webhook.md`
- `evolution-webhook-handler-v2.md`
- `subscriptions-lifecycle-cron-v2.md`
- `uazapi-webhook-handler.md`
- `waha-webhook-handler.md`
- `overview.md` (índice geral)

## Tarefa 1 — Auditoria de Estrutura (faça agora)

Leia **todos** os arquivos acima e faça um diagnóstico comparativo de consistência. Para cada doc, verifique a presença ou ausência das seguintes seções:

| Seção | Descrição |
|-------|-----------|
| **Frontmatter** (`---`) | `title` e `description` em YAML |
| **Descrição** | Parágrafo curto explicando o que a função faz |
| **Estrutura de Arquivos** | Árvore de arquivos (somente funções modulares com múltiplos `.ts`) |
| **Fluxo de Processamento** | Passos numerados do ciclo de vida |
| **Configuração** | Variáveis de ambiente necessárias |
| **Input** | Formato da requisição (headers + body com tabela ou exemplo JSON) |
| **Output** | Formato da resposta (com exemplos JSON de sucesso e erro) |
| **Deploy** | Comando `supabase functions deploy <nome>` |
| **Notas / Observações** | Informações adicionais relevantes |

> **Nota:** Nem todas as seções são obrigatórias para todas as funções. Funções
> simples (ex: cron jobs, webhooks de banco) podem omitir "Estrutura de Arquivos".
> O critério é: a seção é relevante para aquela função? Se sim, está presente e bem
> preenchida?

Ao final da auditoria, registre em `plans/006-edge-functions-review/`:
- `implementation-plan.md`: o diagnóstico consolidado (tabela de presença/ausência por função) e o padrão proposto de seções para cada tipo de função (webhook handler, webhook de DB, cron job)
- `changelog.md`: vazio por enquanto, apenas com o cabeçalho

## Tarefa 2 — Criação de Tasks Individuais (faça agora, após a auditoria)

Com base no diagnóstico, crie um arquivo de task em `plans/006-edge-functions-review/` para **cada** edge function que precisar de revisão. Nomeie os arquivos como `task-<nome-da-funcao>.md`.

Cada arquivo de task deve conter:

1. **Nome da função** e link para o doc atual
2. **Problemas identificados** — lista objetiva das seções ausentes, inconsistências de conteúdo ou formatação incorreta encontradas na auditoria
3. **O que deve ser feito** — instruções claras e específicas para o agente que executará a task:
   - Quais seções adicionar (com o padrão esperado para aquele tipo de função)
   - Quais seções reorganizar ou corrigir
   - Indicação se o conteúdo precisa ser conferido contra o código-fonte real em `supabase/functions/<nome>/`
4. **O que NÃO fazer** — limites da task (ex: não alterar o conteúdo técnico sem verificar o código; não remover seções que existem e estão corretas)
5. **Critério de conclusão** — como saber que a revisão está "done"

> Crie tasks apenas para funções que de fato precisam de trabalho. Se um doc já
> estiver bem estruturado e consistente com o padrão, não crie task para ele.

## Regras Gerais

- Não edite os docs das edge functions ainda — apenas planeje
- Não crie tasks genéricas; cada task deve ser executável de forma independente em uma janela de chat separada
- Use português (pt-BR) em todos os arquivos