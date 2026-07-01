---
title: Guia Completo — Alterando Permissoes, Limites e Usage
description: Passo a passo detalhado para alterar permissoes, features, limites e contadores de usage no banco, na RPC de sessao e na aplicacao
---

# Guia Completo — Alterando Permissoes, Limites e Usage

Este guia explica, em detalhe, **como alterar permissoes, features, limites e usage** na aplicacao Causi sem quebrar a coerencia entre:

1. **Banco de dados**: fonte de verdade
2. **RLS, triggers e funcoes SQL**: enforcement real
3. **RPC de sessao**: snapshot enviado para a aplicacao
4. **App Next.js**: guardas server-side e bloqueios visuais client-side

O objetivo deste documento e evitar um erro comum: alterar apenas a interface ou apenas o banco e deixar o sistema inconsistente.

---

## Quando usar este guia

Use este documento quando voce precisar:

- Dar ou remover uma permissao de uma role
- Criar uma nova acao de permissao, como `export` ou `archive`
- Criar um novo recurso no JSON de permissoes, como `reports`
- Habilitar ou desabilitar uma feature por plano
- Alterar limites quantitativos de um plano, como `max_users` ou `max_channels`
- Entender por que a UI mostra um limite ou permissao diferente do banco
- Adicionar um novo contador ao snapshot de `usage`
- Corrigir divergencias entre RLS, sessao e frontend

---

## Leitura recomendada antes de alterar

Antes de qualquer mudanca, leia estes documentos na ordem abaixo:

1. [docs/implementations/session-context.md](../implementations/session-context.md)
2. [docs/implementations/auth.md](../implementations/auth.md)
3. [docs/references/roles-and-permissions.md](../references/roles-and-permissions.md)
4. [docs/references/plans-and-features.md](../references/plans-and-features.md)
5. [docs/database/overview.md](../database/overview.md)
6. [docs/features/subscriptions.md](../features/subscriptions.md)

Esses documentos cobrem, respectivamente:

- O fluxo da sessao do app
- O fluxo de autenticacao e autorizacao
- O catalogo atual de roles e permissoes
- O catalogo atual de planos, features e limites
- O workflow correto de alteracao do banco com Supabase CLI
- As regras de negocio de billing

---

## Resumo executivo

### Regra de ouro

**Permissao, limite e usage nao vivem em um unico lugar.**

Quase toda mudanca passa por mais de uma camada:

| O que voce quer mudar | Fonte principal | Camadas que precisam ser revisadas |
|---|---|---|
| Permissao de uma role | `public.roles.permissions` | RLS, RPC de sessao, checks no app |
| Feature por plano | `billing.plans.features` | UI, hooks `hasFeature`, possiveis guards server-side |
| Limite base de um plano | `billing.plans.base_limits` | `subscriptions.total_limits`, triggers/sync, app |
| Limite efetivo de uma conta | `billing.subscriptions.total_limits` | triggers/sync, app |
| Contador de usage | RPC `get_current_user_details_v4` | tipos TS, UI, checks |
| Novo tipo de limite | banco + app | triggers, sync, types, checks client/server |

### Regra de seguranca

**A fonte de verdade e sempre o banco.**

- O client-side so esconde/bloqueia UI
- O server-side do app faz guardas de navegacao e UX
- Quem realmente autoriza ou bloqueia operacoes de dados e o **RLS + trigger/funcoes SQL**

Se houver divergencia entre UI e banco, o banco deve prevalecer.

---

## Conceitos importantes

Antes do passo a passo, diferencie estes quatro conceitos:

### 1. Permissao

Permissao responde: **"a role pode executar qual acao sobre qual recurso?"**

Exemplos:

- `users -> ["read", "update", "delete"]`
- `channels -> ["read"]`
- `users -> ["update:own"]`

No projeto, isso mora em `public.roles.permissions` e e refletido em:

- [roles-and-permissions.md](../references/roles-and-permissions.md)
- `session.role.permissions` dentro do DTO `Session`

### 2. Feature

Feature responde: **"o plano habilita este modulo/capacidade?"**

Exemplos:

- `agents: true`
- `classroom: true`
- `channels: false`

No projeto, isso vem de `billing.plans.features` e chega em `session.features`.

### 3. Limite

Limite responde: **"qual e a quantidade maxima permitida?"**

Exemplos:

- `max_users`
- `max_channels`
- `max_contacts`
- `max_pipelines`

No projeto:

- o catalogo base do plano mora em `billing.plans.base_limits`
- o valor efetivo da conta mora em `billing.subscriptions.total_limits`

### 4. Usage

Usage responde: **"quanto esta sendo usado agora?"**

Exemplos:

- `users_count`
- `channels_count`
- `deals_count`
- `persons_count`

No projeto, `usage` nao vem de uma tabela pronta. Ele e **calculado na RPC** `public.get_current_user_details_v4`.

---

## Mapa da arquitetura

Se voce alterar algo, normalmente ele percorre este caminho:

```text
Banco (roles / plans / subscriptions / tabelas operacionais)
  ->
RLS / triggers / funcoes SQL
  ->
RPC get_current_user_details_v4
  ->
mapRpcToSession()
  ->
SessionProvider
  ->
useSession() / useAccessControl() / server-checks.ts
```

### Arquivos mais importantes

#### Banco

- `supabase/schemas/public/tables/roles.sql`
- `supabase/schemas/billing/tables/plans.sql`
- `supabase/schemas/billing/tables/subscriptions.sql`
- `supabase/schemas/public/functions/get_current_user_details_v4.sql`
- `supabase/schemas/public/functions/has_user_permission_in_account.sql`
- `supabase/schemas/public/functions/validate_user_insert_limit.sql`
- `supabase/schemas/public/functions/validate_channel_insert_limit.sql`
- `supabase/schemas/public/functions/validate_deal_insert_limit.sql`
- `supabase/schemas/public/functions/sync_users_limits_for_account.sql`
- `supabase/schemas/public/functions/sync_channels_limits_for_account.sql`
- `supabase/schemas/public/functions/sync_deals_limits_for_account.sql`
- `supabase/schemas/public/rls/users.sql`

#### App

- `src/lib/session/types.ts`
- `src/lib/session/get-session.ts`
- `src/lib/session/server-checks.ts`
- `src/hooks/use-access-control.ts`
- `src/components/session-provider.tsx`

---

## Workflow correto para mudancas no banco

Este projeto usa **schema declarativo** em `supabase/schemas/`.

### O que isso significa na pratica

- Mudancas estruturais de schema devem ser feitas nos arquivos `.sql` em `supabase/schemas/`
- Depois disso, a migration deve ser gerada com `supabase db diff -f <nome>`
- Mudancas de **dados** como `insert`, `update` e `delete` nao sao capturadas por `db diff`
- Para DML, voce precisa criar uma migration manual com `supabase migration new <nome>`

### Importante

Nao edite migrations antigas manualmente para "encaixar" uma nova mudanca. O fluxo correto e:

1. ajustar `supabase/schemas/` quando for schema
2. gerar migration por diff
3. criar migration manual separada quando for DML ou caveat do diff

> Consulte [docs/database/overview.md](../database/overview.md) para o workflow declarativo completo.

### Comandos que o desenvolvedor deve rodar manualmente

Estes comandos sao os que normalmente entram no processo. Eles estao aqui como referencia operacional:

```bash
supabase db diff -f <nome_descritivo>
supabase migration new <nome_descritivo>
supabase db push --dry-run
supabase db push
supabase gen types typescript > src/lib/database.types.ts
```

### Quando usar cada um

| Situacao | Acao correta |
|---|---|
| Alterou tabela, funcao, trigger, view, constraint ou arquivo em `supabase/schemas/` | `supabase db diff -f <nome>` |
| Precisa atualizar dados de `public.roles` ou `billing.plans` | `supabase migration new <nome>` com SQL manual |
| Alterou schema que afeta tipos do Supabase | regenerar `src/lib/database.types.ts` |

---

## Parte 1 — Como alterar permissoes

## Onde a permissao nasce

No estado atual do projeto, a permissao nasce em:

- `public.roles.permissions`

Ela e usada em tres lugares principais:

1. **Banco / RLS**: via `public.has_user_permission_in_account(...)`
2. **RPC de sessao**: `get_current_user_details_v4` retorna `r.permissions AS role_permissions`
3. **App**:
   - `serverHasPermission()` em `src/lib/session/server-checks.ts`
   - `hasPermission()` em `src/hooks/use-access-control.ts`

### Fluxo real

```text
public.roles.permissions
  ->
has_user_permission_in_account()
  ->
RLS autoriza ou bloqueia

public.roles.permissions
  ->
get_current_user_details_v4
  ->
session.role.permissions
  ->
hasPermission() / serverHasPermission()
```

---

## Cenario A — Alterar uma permissao existente de uma role

Exemplo: dar `create` em `channels` para a role `user`.

### Passo 1: confirmar o estado atual

Consulte:

- [docs/references/roles-and-permissions.md](../references/roles-and-permissions.md)

Isso ajuda a validar o JSON atual antes de propor a mudanca.

### Passo 2: alterar os dados da role

A estrutura da tabela esta em `supabase/schemas/public/tables/roles.sql`, mas o que voce esta mudando aqui nao e o schema da tabela e sim o **conteudo do campo `permissions`**.

Portanto, isto e uma alteracao de **DML**.

Na pratica:

1. crie uma migration manual com `supabase migration new <nome>`
2. nela, adicione um `update public.roles set permissions = ... where slug = ...`

### Passo 3: revisar RLS da entidade afetada

Se voce mudou uma permissao de `channels`, `users`, `deals` ou outro recurso, revise as policies relacionadas.

Exemplo:

- `users` usa `public.has_user_permission_in_account(..., 'users', 'read')`
- `users` tambem usa a acao especial `update:own`

Arquivo de referencia:

- [docs/database/rls.md](../database/rls.md)
- `supabase/schemas/public/rls/users.sql`

### Passo 4: validar impacto na sessao

Como a RPC `get_current_user_details_v4` simplesmente devolve `r.permissions`, em geral nao e necessario mudar a RPC para alterar uma permissao existente.

Mas voce deve lembrar:

- a nova permissao so aparecera no `session.role.permissions` depois de novo request / refresh
- o `SessionProvider` trabalha com snapshot; ele nao "escuta" alteracoes do banco em tempo real

### Passo 5: revisar consumo no app

Procure por checks como:

```ts
hasPermission("channels", "create")
serverHasPermission(session, "channels", "create")
```

Se a UI nunca checa essa permissao, a mudanca existira no banco, mas talvez nao tenha efeito visual no app.

### Passo 6: atualizar documentacao de referencia

Se a mudanca e intencional e duradoura, atualize:

- [docs/references/roles-and-permissions.md](../references/roles-and-permissions.md)

Esse documento funciona como espelho da configuracao real.

---

## Cenario B — Criar uma nova acao de permissao

Exemplo: criar `export` em `deals`.

Este caso exige mais cuidado que o cenario anterior.

### O que precisa ser revisado

1. JSON da role em `public.roles.permissions`
2. Policies/RLS ou logica server que vao respeitar a nova acao
3. UI que vai consultar essa nova acao
4. Eventual documentacao de referencia

### Perguntas que voce deve responder antes

- Essa acao sera apenas visual no app ou tambem vai proteger escrita/leitura no banco?
- Ela representa uma operacao real de CRUD, ou uma capacidade da interface?
- O enforcement real sera no banco, em Route Handler, em Server Action, ou apenas na UI?

### Exemplo de risco

Se voce criar `deals -> ["export"]` no JSON da role, mas nao existir nenhum ponto no sistema consultando `hasPermission("deals", "export")`, a permissao nao tera efeito pratico.

Se existir UI consultando isso, mas o endpoint que exporta dados nao validar no server, a permissao vira apenas cosmetica.

### Recomendacao

Para novas acoes:

1. defina a acao na role
2. valide onde o app usa essa acao
3. se a operacao tocar dados sensiveis, implemente o enforcement server-side correspondente

---

## Cenario C — Criar um novo recurso no sistema de permissoes

Exemplo: adicionar `reports`.

Aqui voce esta criando uma nova chave no JSON:

```json
{
  "reports": ["read", "export"]
}
```

### Checklist completo

1. atualizar os dados em `public.roles.permissions`
2. criar ou revisar policies/funcoes que usarao `resource = 'reports'`
3. garantir que a UI use `hasPermission("reports", "...")`
4. revisar se a feature deveria existir tambem em `billing.plans.features`
5. atualizar [docs/references/roles-and-permissions.md](../references/roles-and-permissions.md)

### Observacao importante

Nem todo recurso de permissao precisa ser tambem uma feature de plano.

Mas, na pratica:

- **permissao** costuma responder "qual role pode usar"
- **feature** costuma responder "o plano habilita esse modulo"

Em muitos cenarios, voce precisa dos dois:

- o plano habilita `reports`
- e a role pode `read` ou `export`

---

## Parte 2 — Como alterar features por plano

## Onde a feature nasce

As features nascem em:

- `billing.plans.features`

Elas sao projetadas no app assim:

```text
billing.plans.features
  ->
get_current_user_details_v4
  ->
plan_features
  ->
mapRpcToSession()
  ->
session.features
  ->
hasFeature() / serverHasFeature()
```

### Quando mudar feature e nao permissao

Altere **feature** quando a pergunta for:

- "Esse plano deve ou nao ter acesso ao modulo de agentes?"
- "O plano Essencial deve enxergar classroom premium?"

Altere **permissao** quando a pergunta for:

- "Dentro da conta, qual role pode editar isso?"

### Como alterar

Assim como permissoes de role, isso normalmente e **DML** sobre os dados dos planos.

Na pratica:

1. criar migration manual
2. atualizar o JSON `features` dos planos afetados
3. revisar a UI que usa `hasFeature()`
4. atualizar [docs/references/plans-and-features.md](../references/plans-and-features.md)

### Observacao

Se uma feature nova tambem precisa aparecer em `session.features`, a RPC ja devolve `p.features` inteira como `plan_features`. Em geral, nao e necessario alterar a RPC para chaves novas dentro do JSON.

Mas voce pode precisar:

- atualizar tipagem local se quiser autocomplete especifico
- atualizar componentes que exibem listas de features

---

## Parte 3 — Como alterar limites

## Entenda a diferenca entre `base_limits` e `total_limits`

### `billing.plans.base_limits`

Este e o limite base do catalogo do plano.

Exemplo:

```json
{
  "max_users": 3,
  "max_channels": 1,
  "max_contacts": 2500,
  "max_pipelines": 20
}
```

### `billing.subscriptions.total_limits`

Este e o limite efetivo da conta naquele momento, ja considerando addons.

Exemplo:

```json
{
  "max_users": 5,
  "max_channels": 2,
  "max_contacts": 3500,
  "max_pipelines": 20
}
```

### Regra pratica

- Se voce quer mudar o **catalogo do plano**, mexa em `billing.plans.base_limits`
- Se voce quer mudar o **limite efetivo de uma conta**, mexa em `billing.subscriptions.total_limits`

---

## Cenario D — Alterar o limite base de um plano

Exemplo: mudar `max_users` do plano `pro` de 3 para 5.

### Passo 1: confirmar o valor atual

Consulte:

- [docs/references/plans-and-features.md](../references/plans-and-features.md)

### Passo 2: alterar o dado do plano

Como `base_limits` e um valor de dado do catalogo, isso e **DML**.

Voce precisara de migration manual para atualizar a linha do plano correspondente em `billing.plans`.

### Passo 3: decidir o que fazer com assinaturas ja existentes

Este ponto e crucial.

Alterar `billing.plans.base_limits` **nao garante automaticamente** que as assinaturas antigas em `billing.subscriptions.total_limits` sejam recalculadas.

Voce precisa decidir:

1. a mudanca vale so para novas assinaturas?
2. a mudanca vale tambem para assinaturas ativas?

Se a mudanca vale para assinaturas ativas, sera necessario:

- atualizar `billing.subscriptions.total_limits` das contas afetadas
- possivelmente rodar funcoes de sincronizacao como:
  - `public.sync_users_limits_for_account(...)`
  - `public.sync_channels_limits_for_account(...)`
  - `public.sync_deals_limits_for_account(...)`

### Passo 4: revisar triggers e sincronizacao

Os limites com enforcement explicito no banco hoje incluem:

- usuarios: `validate_user_insert_limit()`
- canais: `validate_channel_insert_limit()`
- deals/contatos: `validate_deal_insert_limit()`

Esses validadores leem `subscriptions.total_limits`, nao `billing.plans.base_limits`.

Por isso, a cadeia correta e:

```text
base_limits do plano
  ->
recalculo de total_limits da assinatura
  ->
triggers e RPC passam a refletir o novo valor
```

### Passo 5: validar efeito no app

O app recebe limites pela RPC em:

- `get_current_user_details_v4 -> s.total_limits AS plan_limits`

e depois usa:

- `src/lib/session/get-session.ts`
- `src/lib/session/server-checks.ts`
- `src/hooks/use-access-control.ts`

Se o nome da chave permanecer o mesmo, muitas vezes nenhuma mudanca adicional no app sera necessaria.

Se voce trocar a chave, por exemplo de `max_contacts` para `max_deals`, entao sera necessario ajustar a aplicacao tambem.

---

## Cenario E — Alterar o limite efetivo de uma conta especifica

Exemplo: conceder um aumento temporario de `max_channels` para uma conta.

### O que mudar

Neste caso, a alteracao e em:

- `billing.subscriptions.total_limits`

e nao no catalogo do plano.

### Quando isso faz sentido

- excecao comercial
- migracao de cliente legado
- correcoes pontuais
- concessao administrativa sem alterar o plano inteiro

### O que revisar depois

- se o limite aumentou, talvez haja itens bloqueados que precisem ser liberados
- se o limite diminuiu, talvez itens precisem ser bloqueados

As funcoes de sincronizacao existem justamente para esse ajuste de estado.

### Atencao

Sem sincronizacao posterior, voce pode acabar com situacoes como:

- `total_limits.max_users = 3`, mas 5 usuarios continuam ativos
- `total_limits.max_channels = 1`, mas 3 canais continuam ativos

---

## Cenario F — Criar um novo tipo de limite

Exemplo: adicionar `max_agents`.

Este e um dos cenarios mais sensiveis, porque ele toca **banco, RPC, tipos e checks**.

### Passo 1: definir onde o limite vai morar

Voce provavelmente precisara incluir a nova chave em:

- `billing.plans.base_limits`
- `billing.subscriptions.total_limits`

### Passo 2: decidir como o sistema vai bloquear excesso

Hoje o projeto tem enforcement de limite no banco para:

- users
- channels
- deals

Se `agents` passar a ter limite real, o ideal e criar:

- uma funcao de validacao no estilo `validate_agent_insert_limit()`
- opcionalmente uma funcao de sincronizacao no estilo `sync_agents_limits_for_account()`
- trigger correspondente

### Passo 3: revisar a RPC de sessao

Para `plan_limits`, a RPC ja devolve `s.total_limits` inteiro. Portanto, a nova chave `max_agents` tende a atravessar automaticamente no JSON.

Para `usage`, talvez voce nao precise mudar nada porque `agents_count` ja existe no `account_usage`.

Mas confira:

- `supabase/schemas/public/functions/get_current_user_details_v4.sql`

### Passo 4: atualizar tipos TypeScript

Revise:

- `src/lib/session/types.ts`

Especialmente:

- `SessionLimits`
- `SessionUsage` se o novo limite depender de novo contador

### Passo 5: atualizar checks no app

Hoje o recurso `agents` usa **proxy temporario**:

- `agents` compara `agents_count` contra `max_channels`

Isso aparece em:

- `src/lib/session/server-checks.ts`
- `src/hooks/use-access-control.ts`

Ao criar `max_agents`, voce deve trocar o mapeamento nesses dois arquivos.

### Passo 6: atualizar a documentacao

Revise:

- [docs/references/plans-and-features.md](../references/plans-and-features.md)
- [docs/implementations/session-context.md](../implementations/session-context.md)

Em especial a tabela "Tabela de Mapeamento de Limites".

---

## Parte 4 — Como alterar usage

## Onde `usage` nasce

`usage` nao vem direto de `billing`. Ele e calculado na CTE `usage_data` dentro da funcao:

- `supabase/schemas/public/functions/get_current_user_details_v4.sql`

Atualmente, a RPC calcula:

- `persons_count`
- `deals_count`
- `pipelines_count`
- `channels_count`
- `agents_count`
- `users_count`

Depois monta o JSON `account_usage`.

### Regra importante

Se voce quer alterar **como o uso e contado**, voce deve alterar a RPC, nao apenas o frontend.

---

## Cenario G — Ajustar a forma como um contador e calculado

Exemplo: `users_count` deveria considerar apenas usuarios `active`.

### O que fazer

1. alterar a query correspondente em `usage_data`
2. revisar se a mudanca tambem precisa acontecer nos triggers/funcoes de enforcement
3. validar UI que exibe esses contadores

### Por que isso importa

Se a UI contar uma coisa e o trigger contar outra, o usuario vera:

- "voce ainda tem espaco"

mas o banco bloqueara a criacao. Isso gera UX confusa.

O ideal e alinhar:

- contagem de `usage` na RPC
- contagem usada pelo trigger/funcao de bloqueio

---

## Cenario H — Adicionar um novo contador ao snapshot de sessao

Exemplo: `messages_count`.

### Passo a passo

1. adicionar a contagem em `usage_data` dentro de `get_current_user_details_v4.sql`
2. incluir a chave no `jsonb_build_object(...) AS account_usage`
3. atualizar `src/lib/session/types.ts`
4. revisar `mapRpcToSession()` em `src/lib/session/get-session.ts`
5. atualizar componentes que consomem `session.usage`
6. atualizar documentacao da sessao

### Quando isso pede regeneracao de tipos

Se a assinatura SQL ou tipos gerados do Supabase forem afetados, regenere:

```bash
supabase gen types typescript > src/lib/database.types.ts
```

---

## Pontos de atencao especificos do projeto

Estes sao os detalhes mais importantes que costumam causar erro.

### 1. `deals` usa `max_contacts`

No estado atual:

- `deals_count` e comparado com `max_contacts`
- os triggers de deals tambem usam `max_contacts`

Ou seja, o nome "contacts" no billing esta servindo como teto para deals/oportunidades.

Nao altere isso sem revisar:

- `validate_deal_insert_limit.sql`
- `sync_deals_limits_for_account.sql`
- `src/lib/session/server-checks.ts`
- `src/hooks/use-access-control.ts`
- [docs/implementations/session-context.md](../implementations/session-context.md)

### 2. `agents` usa `max_channels` como proxy temporario

No app atual:

- `agents_count` e comparado contra `max_channels`

Isso significa que **nao existe ainda um limite dedicado de agentes** plenamente modelado.

Se voce mexer em `agents`, revise explicitamente esse proxy.

### 3. `persons` esta hardcoded em `20_000`

No estado atual:

- `persons` nao depende de `billing.subscriptions.total_limits`
- o teto esta hardcoded na aplicacao

Isso significa que:

- o banco nao parece impor esse mesmo limite por trigger dedicado
- o valor pode divergir da regra comercial real se nao for tratado com cuidado

Se quiser transformar `persons` em limite real de plano, sera necessario modelar isso no banco e tirar o hardcode do app.

### 4. Os checks de limite estao duplicados em client e server

Hoje existe duplicacao entre:

- `src/lib/session/server-checks.ts`
- `src/hooks/use-access-control.ts`

Sempre que mudar o mapeamento de um limite, revise os dois arquivos.

Caso contrario, voce pode gerar cenarios como:

- o botao aparece no client, mas a pagina server bloqueia
- o client bloqueia, mas o server permitiria

### 5. O client-side nao e enforcement real

`useAccessControl()` ajuda na UX, mas nao protege dados sozinho.

A seguranca real esta em:

- RLS
- triggers/funcoes SQL
- validacoes server-side

Nunca trate `hasPermission()`, `hasFeature()` ou `isWithinLimit()` no client como barreira de seguranca suficiente.

### 6. Mudancas de dados nao aparecem no `db diff`

Se voce alterou:

- JSON de permissoes de roles
- JSON de features
- JSON de `base_limits`
- JSON de `total_limits`

isso e DML. `supabase db diff` nao vai gerar migration automaticamente para voce.

Use migration manual para os dados.

---

## Como validar que a mudanca ficou correta

A validacao precisa ser feita em camadas.

### Validacao 1 — Banco

Confirme:

- a role/plano/assinatura foi alterado corretamente
- a policy ou trigger relevante continua coerente
- a conta de teste possui os dados esperados

### Validacao 2 — Sessao

Confirme que o snapshot de sessao refletiu a mudanca:

- `session.role.permissions`
- `session.features`
- `session.limits`
- `session.usage`

Voce pode usar a rota/pagina de debug, quando aplicavel, ou inspecionar o comportamento de telas que consomem o contexto.

### Validacao 3 — Server checks

Confirme o comportamento em paginas que usam:

- `requireSession()`
- `serverHasPermission()`
- `serverHasFeature()`
- `serverIsWithinLimit()`

### Validacao 4 — Client checks

Confirme o comportamento visual em componentes que usam:

- `useSession()`
- `useAccessControl()`

### Validacao 5 — Enforcements de escrita

Tente a operacao real:

- criar usuario
- criar canal
- criar deal

O objetivo e confirmar que:

- a UI sinaliza corretamente
- o server responde corretamente
- o banco bloqueia ou permite corretamente

---

## Checklist por tipo de alteracao

## Checklist — Permissao

- revisar [docs/references/roles-and-permissions.md](../references/roles-and-permissions.md)
- alterar dados de `public.roles.permissions`
- revisar RLS/funcoes que usam o recurso/acao
- revisar checks `hasPermission()` e `serverHasPermission()`
- validar com usuario/role reais
- atualizar documentacao de referencia

## Checklist — Feature

- revisar [docs/references/plans-and-features.md](../references/plans-and-features.md)
- alterar `billing.plans.features`
- revisar componentes que usam `hasFeature()`
- revisar se a feature exige guard server-side adicional
- atualizar documentacao de referencia

## Checklist — Limite existente

- decidir se a mudanca e no catalogo do plano ou na assinatura da conta
- alterar `base_limits` ou `total_limits`
- revisar triggers e funcoes `sync_*`
- revisar `serverIsWithinLimit()` e `isWithinLimit()`
- testar operacao real de criacao
- atualizar documentacao

## Checklist — Novo limite

- modelar chave em `base_limits` e `total_limits`
- criar enforcement de banco se necessario
- revisar RPC e `usage`
- atualizar `src/lib/session/types.ts`
- atualizar `server-checks.ts` e `use-access-control.ts`
- atualizar documentacao de implementacao e referencias

## Checklist — Usage

- alterar `get_current_user_details_v4.sql`
- revisar coerencia com triggers/funcoes de limite
- atualizar tipos TS
- revisar UI que usa `session.usage`
- testar com dados reais

---

## Onde cada tipo de mudanca costuma terminar

Esta tabela ajuda a saber quando a mudanca esta de fato completa.

| Mudanca | Banco | RPC | App | Docs |
|---|---|---|---|---|
| Ajustar permissao existente | sim | normalmente nao | talvez | sim |
| Nova acao de permissao | sim | normalmente nao | sim | sim |
| Novo recurso de permissao | sim | normalmente nao | sim | sim |
| Ajustar feature existente | sim | normalmente nao | talvez | sim |
| Ajustar limite base | sim | nao necessariamente | talvez | sim |
| Ajustar `total_limits` | sim | nao necessariamente | talvez | sim |
| Novo tipo de limite | sim | talvez | sim | sim |
| Novo contador de usage | sim | sim | sim | sim |

---

## Erros comuns

### Alterar so a UI

Exemplo:

- mudar `useAccessControl()` e esquecer trigger/RLS

Resultado:

- a interface parece certa
- o banco continua com a regra antiga

### Alterar so o banco

Exemplo:

- mudar `public.roles.permissions` e esquecer componentes que checam strings especificas

Resultado:

- o banco permite
- a UI continua escondendo a funcionalidade

### Alterar `base_limits` e esquecer `total_limits`

Resultado:

- novas assinaturas funcionam
- contas antigas continuam com teto antigo

### Criar chave nova e esquecer tipos

Resultado:

- dados chegam no JSON
- TypeScript nao conhece a chave
- componentes ficam sem autocomplete ou com casts improvisados

### Nao revisar o mapeamento duplicado de limites

Resultado:

- client e server passam a discordar

---

## Recomendacoes arquiteturais

Se voce for mexer com frequencia nessa area, estas melhorias estruturais valem a pena:

### 1. Extrair a logica pura de acesso para modulo compartilhado

Hoje os checks de limite vivem duplicados entre client e server.

Uma melhora natural e centralizar funcoes puras baseadas em `Session`, por exemplo:

- `checkPermission(session, resource, action)`
- `checkFeature(session, feature)`
- `checkLimit(session, resource)`

Assim, `useAccessControl()` e `server-checks.ts` passam a delegar para a mesma regra.

### 2. Validar `plan_limits`, `plan_features` e `account_usage` com Zod

Hoje `mapRpcToSession()` usa `as unknown as ...` para converter JSONs da RPC.

Funciona, mas e fragil se o contrato da RPC mudar.

Se essa camada ficar mais critica, vale usar schemas Zod para validar o payload da RPC antes de montar o DTO `Session`.

### 3. Reduzir hardcodes temporarios

Prioridades evidentes:

- parar de usar `max_channels` como proxy para `agents`
- decidir se `persons` deve ou nao virar limite real de billing

---

## Documentos relacionados

- [docs/implementations/session-context.md](../implementations/session-context.md)
- [docs/implementations/auth.md](../implementations/auth.md)
- [docs/references/roles-and-permissions.md](../references/roles-and-permissions.md)
- [docs/references/plans-and-features.md](../references/plans-and-features.md)
- [docs/database/overview.md](../database/overview.md)
- [docs/features/subscriptions.md](../features/subscriptions.md)

---

## Resposta curta para consulta rapida

Se voce estiver com pressa, a versao curta e:

1. descubra se a mudanca e **permissao**, **feature**, **limite** ou **usage**
2. altere a **fonte de verdade no banco**
3. revise a **RPC de sessao** se o contrato enviado ao app mudar
4. revise os **checks do app** em `server-checks.ts` e `use-access-control.ts`
5. valide o **enforcement real** em RLS, trigger ou funcao SQL
6. atualize a **documentacao de referencia**

Se qualquer uma dessas camadas for ignorada, ha alto risco de inconsistencias.
