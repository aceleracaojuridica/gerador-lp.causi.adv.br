# Plan: User Session Context & Access Control (v2)

> **Revisão v2** — Incorpora correções identificadas na análise do codebase real e revisão de segurança
> via [Next.js Data Security Guide](https://nextjs.org/docs/app/guides/data-security).
> Veja o changelog de correções ao final deste documento.

## TL;DR

Implementar um sistema de contexto de sessão que carrega dados do usuário logado (user, account, role, subscription, plan limits/features, usage) uma vez no layout do servidor via RPC, distribui via React Context (Context API) para Client Components, e expõe hooks para verificações de permissão, feature gates, limites e status da assinatura. O servidor continua sendo a camada de proteção real (Server Actions + RLS), enquanto o cliente esconde UI e bloqueia interações proativamente.

### Princípios-chave

1. **Server-first para dados sensíveis** — autenticação e dados globais são resolvidos no servidor; a interface cliente recebe um snapshot e o distribui
2. **Context global = snapshot de UI** — não é fonte de verdade de segurança, é distribuição de dados para evitar prop drilling
3. **Queries específicas ficam na página** — métricas, tabelas, relatórios, listas paginadas NÃO entram no context global; ficam na página/módulo que usa
4. **Proxy só renova token** — o proxy/middleware cuida de cookies e renovação de sessão, não faz autorização de negócio
5. **Regras de billing/permissão centralizadas** — nunca espalhar lógica de permissão/billing por componentes de UI individuais; usar helpers centralizados
6. **DAL isolada no servidor** — `src/lib/session/` é uma Data Access Layer; módulos do DAL devem usar `import 'server-only'` para evitar exposição acidental ao client bundle

---

## Decisão Arquitetural: RPC vs Queries Diretas

**Decisão: Manter a RPC `get_current_user_details_v4` como fonte de dados. Não criar funções separadas para partial refetch.**

Justificativas:
- **Single round-trip** — A função faz 7 JOINs + 6 COUNTs em uma única chamada ao banco. Fazer 5+ queries separadas seria mais lento e mais complexo
- **Lógica complexa centralizada** — O cálculo de `effective_account_id` e `effective_role_id` (multi-account, super admin) está encapsulado no banco, evitando duplicação no app
- **RLS continua ativo** — A função usa `auth.uid()` e respeita as políticas
- **Já funciona** — A função é battle-tested no app antigo
- **Consistência** — Todos os dados vêm da mesma transação, sem race conditions entre queries separadas
- **Partial refetch desnecessário** — O único slice que muda com frequência (usage counts) é bem servido por `setSession()` otimista após mutations. Para os demais slices (subscription, role, features), `router.refresh()` é a resposta certa de qualquer forma e seria o custo mesmo com queries separadas

**O problema não é a RPC, é como ela é usada.** No app antigo, ela é chamada em toda page load. No Next.js, o layout é renderizado uma vez e preservado durante navegação client-side — então a RPC roda **uma vez por sessão efetiva**, não por page load.

### Quando não usar a RPC

Para **Server Actions que precisam validar limites antes de INSERT**, a RPC é excessiva. O banco tem triggers para alguns recursos (`validate_deal_insert_limit`, `validate_channel_insert_limit`, `validate_user_insert_limit`), mas **não para todos** (ex: sem trigger para agentes). O padrão é:
- **App verifica limites** via `isWithinLimit()` no client (UX: desabilitar botão) e `serverIsWithinLimit()` no Server Action (proteção real)
- **Triggers existentes** funcionam como última linha de defesa no banco — se existirem, rejeitam o INSERT
- **Se o trigger não existir** para um recurso, a verificação no Server Action é a proteção principal (junto com RLS)

---

## Modelo de 3 Camadas

```
Camada 1 — SERVIDOR (proteção real)
  ├─ RLS no Postgres (isolamento por account_id)
  ├─ Triggers de validação (limites quantitativos)
  ├─ Server Actions (re-verificam antes de operações sensíveis)
  └─ getSession() em Server Components (dados frescos)

Camada 2 — CONTEXTO (distribuição de dados)
  ├─ SessionProvider no layout (React Context)
  ├─ Dados carregados uma vez via RPC no Server Component
  └─ Persistem durante navegação client-side

Camada 3 — CLIENTE (UX proativa)
  ├─ useSession() — acesso aos dados da sessão
  ├─ useAccessControl() — hasPermission(), hasFeature(), isWithinLimit()
  └─ Componentes escondem/desabilitam UI baseado no contexto
```

**Raciocínio:** O servidor é a verdade absoluta. O cliente é otimista — mostra/esconde/bloqueia UI baseado em dados que vieram do servidor no layout. Se dados ficarem stale (raro), o Server Action recusa a operação e o cliente exibe o erro. Isso combina segurança (RLS + triggers) com UX responsiva (sem loading para verificações).

---

## Ciclo de Vida do Context

### Quando os dados são carregados
- O layout `(app)/layout.tsx` é um Server Component `async` que chama `getSession()` e passa o resultado ao `SessionProvider`
- Isso roda no **primeiro acesso** ou em qualquer **hard refresh** (F5, `window.location.reload()`)
- Navegação entre páginas dentro do route group **não** re-executa o layout (Partial Rendering do Next.js)

### Quando os dados são atualizados
| Cenário | Mecanismo | O que acontece |
|---------|-----------|----------------|
| **Troca de conta (SystemBar)** | Server Action `switchAccountAction(accountId)` → re-fetch via RPC → `setSession()` + `router.refresh()` | Context atualizado com dados da nova conta |
| **Edição de perfil** (nome, foto) | Após salvar → `setSession()` com dados locais atualizados | Reflete imediatamente no avatar/sidebar |
| **Criação de recurso** (deal, pessoa, canal) | Após INSERT com sucesso → incrementar `usage` localmente via `setSession()` | Contadores de usage atualizam sem round-trip |
| **Mudança de subscription** (raro, admin) | `router.refresh()` | Re-executa o layout server → nova RPC → novo snapshot |
| **Logout** | `logoutAction()` já implementado | Limpa session e redireciona para `/login` |

### `router.refresh()` vs `setSession()`
- **`router.refresh()`** — re-executa Server Components (incluindo layout), gerando novo snapshot via RPC. Garante dados 100% frescos do banco. Custo: round-trip.
- **`setSession()`** — atualiza React Context localmente, sem rede. Reflete mudanças imediatas na UI. Custo: zero. Risco: pode ficar desalinhado se a operação falhou no servidor.
- **Padrão recomendado**: operação no servidor (Server Action) → se sucesso, `setSession()` local → opcionalmente `router.refresh()` para garantia.

---

## Mapeamento de Chaves: Usage vs Limits

A RPC retorna campos com nomes distintos para usage e limits. A função `isWithinLimit(resource)` usa a tabela abaixo para mapear entre os dois:

| Recurso (argumento) | Chave em `usage` | Chave em `limits` | Origem |
|---------------------|-----------------|-------------------|--------|
| `deals` | `deals_count` | `max_contacts` | DB (`total_limits`) — campo chamado `max_contacts` mas limita deals |
| `users` | `users_count` | `max_users` | DB (`total_limits`) |
| `channels` | `channels_count` | `max_channels` | DB (`total_limits`) |
| `pipelines` | `pipelines_count` | `max_pipelines` | DB (`total_limits`) |
| `persons` | `persons_count` | hardcoded: `20_000` | App-level — sem limite de plano; teto fixo alto |

> `agents_count` existe no usage mas não tem limite definido — não entra em `isWithinLimit()`. Tags não têm count na RPC; limites hardcoded de tags requerem query separada quando necessário.

---

## Subscription Null — Tratamento Defensivo

A RPC filtra `s.status IN ('trial', 'active')`. O cronjob de lifecycle garante que ao cancelar/expirar uma assinatura, uma nova `free` ativa é criada imediatamente — portanto na prática a subscription **sempre** tem valor.

O campo `subscription` pode ser `null` apenas em edge cases de race condition (ex: conta recém-criada antes do primeiro cronjob rodar). O tratamento é:
- Subscription `null` → fallback para zero permissões de billing / sem features extras
- `subscriptionStatus` pode ser `'active' | 'trial' | null` (null = edge case, tratar como sem plano)
- **Não adicionar `'expired' | 'cancelled'` na union type** — esses estados nunca chegam via RPC

---

## Steps

### Phase 1: Pré-Requisitos

**1.1** Gerar `src/lib/database.types.ts` via Supabase CLI
- Comando: `supabase gen types typescript > src/lib/database.types.ts`
- Necessário para tipagem automática das queries e do retorno da RPC

**1.2** Criar `src/lib/session/types.ts` — tipos TypeScript para a sessão
- Definir interfaces baseadas **exatamente** no retorno da RPC `get_current_user_details_v4`:
  - `SessionUser` — `id`, `name`, `email`, `photo`, `status`, `slug`, `mainAccountId`, `mainRoleId`, `hasSharedAccounts`
  - `SessionAccount` — `id`, `name`, `status`
  - `SessionRole` — `id`, `name`, `slug`, `accessLevel`, `permissions: Record<string, string[]>`
  - `SessionSubscription` — `planName`, `planSlug`, `planId`, `status: 'active' | 'trial' | null`, `startDate`, `endDate`, `trialStartDate`, `trialEndDate`
  - `SessionUsage` — `personsCount`, `dealsCount`, `pipelinesCount`, `channelsCount`, `agentsCount`, `usersCount`
  - `PlanLimits` — `maxContacts`, `maxUsers`, `maxChannels`, `maxPipelines`
  - `PlanFeatures` — `tags`, `deals`, `tasks`, `agents`, `persons`, `channels`, `classroom`, `pipelines`, `conversations`, `organizations`, `classroomPremium` (todos `boolean | undefined`)
- Definir o tipo principal `Session` que agrupa tudo
- **Referência**: retorno da RPC em `supabase/schemas/public/functions/get_current_user_details_v4.sql`
- Os tipos são o DTO público — incluir apenas campos necessários para a UI, não expor internals do banco

### Phase 2: Data Access Layer no Servidor

**2.1** Criar `src/lib/session/get-session.ts` — função server-only
- **Primeira linha obrigatória**: `import 'server-only'` — impede import acidental em Client Components
- Função `getSession(accountId?: number): Promise<Session | null>`
- **Envolver com `cache()` do React** — deduplicar chamadas dentro da mesma árvore de render server-side
- Usa `createClient()` do server para chamar a RPC
- Chama `supabase.auth.getUser()` primeiro para validar autenticação com o servidor Auth (não `getClaims()` — aqui queremos validação real com round-trip)
- Se autenticado, chama `supabase.rpc('get_current_user_details_v4', { p_account_id: accountId ?? null })`
- **A RPC retorna `TABLE`, não um único registro** — usar `.maybeSingle()` após `.rpc()` para extrair o primeiro (e único esperado) resultado: `const { data, error } = await supabase.rpc(...).maybeSingle()`
- Mapeia o retorno da RPC (`snake_case`) para os tipos `Session` (`camelCase`) definidos em 1.2 — **mapear apenas os campos necessários**, não passar o objeto raw completo
- Retorna `null` se não autenticado, se a RPC falhar, ou se `.maybeSingle()` retornar `null`
- **Referência de implementação**: `src/lib/supabase/server.ts` (padrão `createClient()`)

**2.2** Criar `src/lib/session/server-checks.ts` — helpers server-side
- **Primeira linha obrigatória**: `import 'server-only'`
- `requireSession()`: chama `getSession()`, redireciona para `/login` se null (para Server Components)
- `requireSessionOrThrow()`: chama `getSession()`, throw `new Error('Unauthorized')` se null (para Server Actions)
- `serverHasPermission(session, resource, action)`: verifica permissão no servidor (`session.role.permissions[resource]?.includes(action)`)
- `serverHasFeature(session, feature)`: verifica feature gate no servidor (`session.features[feature] === true`)
- `serverIsWithinLimit(session, resource)`: verifica limite usando a tabela de mapeamento de chaves definida acima
- Estas funções são usadas em Server Components e Server Actions para proteção real — **não substituem RLS, são uma camada adicional de DX**

### Phase 3: Context & Hooks no Cliente

**3.1** Criar `src/lib/session/session-provider.tsx` — Provider client-side
- `"use client"` component
- Recebe `initialData: Session` via props (vem do Server Component pai — dados que nasceram no servidor)
- Armazena em React Context via `useState(initialData)`
- **Expõe `setSession`** no context — permite atualizações client-side futuras (ex: context switching, refresh após ação)
- Exporta `SessionContext`
- **Usar `useMemo`** para estabilizar o value do context e evitar re-renders desnecessários

**3.2** Criar `src/hooks/use-session.ts` — hook principal
- Consome `SessionContext`
- Retorna `{ user, account, role, subscription, usage, limits, features, setSession }`
- Throw error se usado fora do `SessionProvider` (DX safety)
- Propriedades derivadas computadas no hook:
  - `isAuthenticated: boolean` — sempre true quando dentro do provider (layout já protege)
  - `isSuperAdmin: boolean` — `role.accessLevel === 999`
  - `isTrial: boolean` — `subscription?.status === 'trial'`
  - `isActiveSubscription: boolean` — `subscription?.status === 'active' || subscription?.status === 'trial'`

**3.3** Criar `src/hooks/use-access-control.ts` — hook de verificações
- Consome `useSession()` internamente
- Retorna:
  - `hasPermission(resource, action)` — `session.role.permissions[resource]?.includes(action) ?? false`
  - `hasFeature(feature)` — `session.features[feature] === true`
  - `isWithinLimit(resource)` — usa tabela de mapeamento de chaves; retorna `true` se dentro do limite ou se o recurso não tem limite definido
  - `subscriptionStatus: 'active' | 'trial' | null`
  - `isActive: boolean` — shorthand para `subscriptionStatus !== null`
- **Referência de dados**:
  - Permissions: `docs/references/roles-and-permissions.md`
  - Features: `docs/references/plans-and-features.md`
  - Limits: `billing.subscriptions.total_limits` (via `PlanLimits` no context)

### Phase 4: Integração nos Layouts

**4.1** Atualizar `src/app/(app)/layout.tsx`
- Importar `getSession()` e `SessionProvider`
- Tornar o layout `async` (Server Component)
- Chamar `const session = await getSession()`
- Se `session` null, redirecionar para `/login` (proteção adicional além do proxy)
- Envolver children com `<SessionProvider initialData={session}>`
- O `SessionProvider` envolve o `AppLayout` (que é `"use client"`) — hierarquia válida: Server → Provider → Client

**4.2** Atualizar `src/app/(admin)/layout.tsx` — *paralelo com 4.1*
- Mesma abordagem com `getSession()`
- Verificar `session.role.accessLevel >= 150` (super admin + suporte) — redirecionar para `/dashboard` se não atender

**4.3** ~~Atualizar `src/app/(classroom)/layout.tsx`~~ — **fora do escopo desta implementação**
- Classroom será construído separadamente; o único `layout.tsx` existente em `(classroom)/cursos/layout.tsx` não é modificado

**4.4** Atualizar `src/provider.tsx` — **não modificar**
- `SessionProvider` fica nos layouts protegidos, não no root
- O root provider contém apenas `TooltipProvider` e `NuqsAdapter`, que são globais e não dependem de sessão

### Phase 5: Server Actions de Sessão

**5.1** Criar `src/lib/session/actions.ts` — Server Actions de sessão
- `"use server"` no topo do arquivo
- **`switchAccountAction(accountId: number)`**:
  - Validar input com Zod: `z.number().int().positive()`
  - Chamar `supabase.auth.getUser()` para autenticar — throw `'Unauthorized'` se falhar
  - Chamar `getSession(accountId)` e retornar o `Session` mapeado (DTO, não retorno bruto da RPC)
  - **IDOR protegido por design**: a RPC usa `auth.uid()` internamente e respeita RLS — se o usuário não tem acesso à conta, a RPC retorna `null`. Verificar explicitamente e throw `'Forbidden'` se resultado for null
  - Retornar apenas o objeto `Session` — não retornar campos internos do banco
- **`getUserAccountsAction(params?: { search?: string; page?: number; limit?: number })`**:
  - Validar input com Zod: `search` → `z.string().max(100).optional()`, `page` → `z.number().int().min(0).optional()`, `limit` → `z.number().int().min(1).max(50).optional()`
  - Chamar `supabase.auth.getUser()` para autenticar
  - **Branch por role**:
    - Usuário comum (`accessLevel < 999`): buscar `users_accounts` do usuário + conta principal — N pequeno, retorna tudo de uma vez
    - Super Admin (`accessLevel === 999`): buscar todas as contas com paginação (`limit` padrão: 20) e filtro por `search` — RLS full access permite ver tudo

### Phase 6: Atualizar Componentes com Dados Reais

**6.1** Renomear `src/components/admin-bar.tsx` → `src/components/system-bar.tsx`
- Componente renomeado de `AdminBar` para `SystemBar` — não é exclusivo de admins, usuários comuns também podem ver para trocar de conta
- Atualizar import em `src/components/app-layout.tsx`

**6.2** Atualizar `src/components/app-layout.tsx`
- Importar `SystemBar` (não mais `AdminBar`)
- Usar `useSession()` para obter `session`
- Lógica de exibição: `showSystemBar = session.user.hasSharedAccounts || session.role.accessLevel === 999`
  - Super Admin: `has_shared_accounts` é `false` (não tem linhas em `users_accounts`), mas deve ver a barra para trocar de conta — por isso o OR com `accessLevel`
  - Usuário comum: exibe apenas se tiver mais de uma conta disponível

**6.3** Atualizar `src/components/system-bar.tsx` (renomeado de `admin-bar.tsx`)
- Usar `useSession()` para conta atual como valor selecionado no `SearchableSelect`
- Usar `useAccessControl()` internamente para o branch de carregamento de contas
- Na montagem do componente, chamar `getUserAccountsAction()` para carregar a lista inicial:
  - Usuário comum: lista completa (N pequeno, uma chamada)
  - Super Admin: lista paginada com `limit: 20` — implementar infinite scroll no `SearchableSelect`; ao digitar, refazer a chamada com `search`
- Ao selecionar conta diferente: chamar `switchAccountAction(accountId)` → receber `Session` atualizada → `setSession()` + `router.refresh()`

**6.4** Atualizar `src/components/atoms/avatar-dropdown.tsx`
- Usar `useSession()` hook
- Substituir email hardcoded (`"webmaster@causi.com.br"`) por `session.user.email`
- Substituir avatar mock por `session.user.photo` como `src` do `AvatarImage`
- Condicionar itens pelo role:
  - "Administrar Cursos" visível apenas se `session.role.accessLevel >= 150` (admins do sistema)
  - "Debug" visível apenas se `session.role.accessLevel === 999` (super admin)

**6.5** Atualizar `src/components/app-sidebar.tsx`
- Usar `useSession()` para usage e limits; usar `useAccessControl()` para feature gates e permissões
- Substituir dados mock de usage ("136 de 5.000") por valores reais usando tabela de mapeamento:
  - Para "Oportunidades" (deals): `usage.dealsCount` vs `limits.maxContacts` (campo `max_contacts` do DB limita deals)
  - Para pessoas: `usage.personsCount` vs limite hardcoded `20_000`
- Condicionar itens de navegação:
  - "Agentes" visível só se `hasFeature('agents')`
  - "Cursos" visível se `hasFeature('classroom') || hasFeature('classroomPremium')`
  - "Canais" visível se `hasPermission('channels', 'read')`

### Phase 7: Barrel Export

**7.1** Criar `src/lib/session/index.ts` — barrel export
- Re-exporta: todos os types, `getSession`, `requireSession`, `requireSessionOrThrow`, `serverHasPermission`, `serverHasFeature`, `serverIsWithinLimit`
- Re-exporta: `SessionProvider`, `switchAccountAction`, `getUserAccountsAction`
- Os hooks ficam em `src/hooks/` seguindo a convenção do projeto — não re-exportar daqui

### Phase 8: Atualizar Documentação

**8.1** Atualizar `docs/architecture/overview.md`
- Atualizar a seção "Contexto de Sessão" com a implementação real: `SessionProvider`, `useSession()`, `useAccessControl()`
- Atualizar a referência a `lib/context/session-context.tsx` (exemplo genérico no doc) para `lib/session/`
- Documentar a distinção `getClaims()` (proxy) vs `getUser()` (getSession) nas seções relevantes

**8.2** Atualizar `docs/architecture/auth.md`
- Adicionar seção sobre o fluxo de carregamento da sessão: proxy → layout → RPC → Context
- Documentar o tradeoff de segurança: `getClaims()` valida JWT localmente (proxy — latência crítica), `getUser()` valida com servidor Auth (getSession — segurança crítica). Tokens revogados no Supabase Auth ainda passam pelo proxy até expirar o JWT; a proteção real vem de `getUser()` em `getSession()`

**8.3** Criar `docs/implementations/session-context.md`
- Documentação completa da implementação realizada:
  - Arquitetura de 3 camadas (servidor, context, cliente)
  - Estrutura de arquivos criados e modificados
  - API pública dos hooks (`useSession`, `useAccessControl`)
  - Mapeamento de chaves usage → limits
  - Ciclo de vida do context e quando cada mecanismo de update é usado
  - Regras de exibição da SystemBar
  - Estratégia de paginação para Super Admin no account switch
  - Decisões documentadas e justificativas

---

## Relevant Files

### Criar
- `src/lib/session/types.ts` — tipos TypeScript da sessão (DTO)
- `src/lib/session/get-session.ts` — fetch server-side via RPC (`server-only`)
- `src/lib/session/server-checks.ts` — helpers de verificação server-side (`server-only`)
- `src/lib/session/session-provider.tsx` — React Context provider
- `src/lib/session/actions.ts` — Server Actions (switch account, get user accounts)
- `src/lib/session/index.ts` — barrel exports
- `src/hooks/use-session.ts` — hook de acesso à sessão
- `src/hooks/use-access-control.ts` — hook de verificações
- `src/components/system-bar.tsx` — SystemBar (renomeada de admin-bar)
- `docs/implementations/session-context.md` — documentação da implementação

### Modificar
- `src/app/(app)/layout.tsx` — tornar async, adicionar `getSession()` + `SessionProvider`
- `src/app/(admin)/layout.tsx` — tornar async, adicionar `getSession()` + verificação super admin
- `src/components/app-layout.tsx` — importar `SystemBar`, lógica `showSystemBar`
- `src/components/atoms/avatar-dropdown.tsx` — usar `useSession()`, role gating nos itens
- `src/components/app-sidebar.tsx` — usar `useSession()` + `useAccessControl()`, usage real, nav condicional
- `docs/architecture/overview.md` — atualizar seção de sessão
- `docs/architecture/auth.md` — adicionar fluxo de sessão e tradeoff getClaims/getUser

### Remover
- `src/components/admin-bar.tsx` — substituído por `system-bar.tsx`

### Referência (não modificar)
- `supabase/schemas/public/functions/get_current_user_details_v4.sql` — retorno da RPC
- `src/lib/supabase/server.ts` — padrão `createClient()` para server
- `src/lib/supabase/client.ts` — padrão `createClient()` para browser
- `src/lib/supabase/proxy.ts` — lógica do middleware (já valida auth via `getClaims()`)
- `docs/references/roles-and-permissions.md` — estrutura de permissões
- `docs/references/plans-and-features.md` — estrutura de features e limites

---

## Verification

1. **Type safety**: `pnpm build` compila sem erros (TypeScript strict)
2. **Lint**: `pnpm lint` passa sem erros (Biome)
3. **Login flow**: Fazer login → `useSession()` retorna dados do usuário real (não mock)
4. **Avatar dropdown**: Mostra email e foto do usuário logado; "Administrar Cursos" e "Debug" aparecem apenas para roles corretos
5. **SystemBar — usuário comum com conta única**: barra não aparece (`hasSharedAccounts === false`)
6. **SystemBar — usuário com múltiplas contas**: barra aparece, lista as contas acessíveis
7. **SystemBar — Super Admin**: barra aparece, lista inicial com 20 contas, infinite scroll carrega mais, search filtra por nome
8. **Context switching**: Selecionar conta diferente na SystemBar → sidebar/avatar/usage atualizam para a nova conta
9. **Sidebar — usage**: Contadores reais (persons, channels, pipelines)
10. **Sidebar — feature gate**: Conta no plano Essencial não vê "Agentes" (`!hasFeature('agents')`)
11. **Sidebar — permissão**: Role `user` sem `channels.read` não vê "Canais"
12. **Permission check**: Role `user` não vê botão de deletar canal (`!hasPermission('channels', 'delete')`)
13. **Server protection**: Server Action de criação de deal rejeita se `!serverHasPermission(session, 'deals', 'create')`
14. **IDOR protection**: Chamar `switchAccountAction` com `accountId` de conta sem acesso retorna `'Forbidden'`
15. **Input validation**: `switchAccountAction` rejeita `accountId` inválido (string, negativo, etc.)
16. **Non-authenticated**: Acessar rota protegida sem login redireciona para `/login`
17. **Session refresh**: Após editar perfil, avatar/email atualizam sem reload

---

## Decisions

- **RPC mantida** como fonte de dados — single round-trip, lógica complexa centralizada, RLS ativo. Partial refetch via queries separadas descartado: o único slice de alta frequência (usage) é coberto por `setSession()` otimista; para os demais, `router.refresh()` é necessário de qualquer forma
- **Layout fetch** — dados carregam uma vez no Server Component do layout, não por page load. Next.js preserva layout durante client-side navigation
- **`server-only` obrigatório no DAL** — `get-session.ts` e `server-checks.ts` usam `import 'server-only'` como primeira linha. Impede exposição acidental ao client bundle e gera build error se violado
- **RPC retorna TABLE** — usar `.maybeSingle()` após `.rpc()` para extrair registro único. Sem isso, `data` seria um array
- **Session é DTO mapeado** — o objeto `Session` contém apenas campos necessários para a UI, com nomes em `camelCase`. O retorno bruto da RPC (snake_case, com campos internos) nunca chega ao client
- **SystemBar (não AdminBar)** — renomeada porque não é exclusiva de admins. Exibição condicional: `hasSharedAccounts || isSuperAdmin`. Super Admin não tem linhas em `users_accounts` então precisa do OR explícito
- **Super Admin na SystemBar** — lista paginada (20/página) com infinite scroll e search por nome de conta. Usuários comuns recebem lista completa em uma chamada (N pequeno via `users_accounts`)
- **Zod validation em Server Actions** — `switchAccountAction` e `getUserAccountsAction` validam todos os inputs do client com Zod antes de qualquer query
- **IDOR protegido por RPC + RLS** — `switchAccountAction` verifica que a RPC retornou resultado antes de retornar ao cliente. A RPC usa `auth.uid()` e RLS garante que usuários só acessam contas às quais têm direito
- **Context switching** — implementado na SystemBar com Server Action `switchAccountAction()`. Ao trocar de conta, re-fetch via RPC com novo `accountId`, atualiza context local e `router.refresh()`
- **Stale data tolerado** — dados de sessão podem ficar desatualizados durante a navegação. Server Actions **sempre** re-verificam no banco antes de operações sensíveis
- **`subscriptionStatus` simplificado** — `'active' | 'trial' | null`. Estados `'expired'` e `'cancelled'` nunca chegam via RPC (cronjob garante criação de plano `free` ativo ao expirar/cancelar). `null` é edge case de race condition, tratado como fallback sem plano
- **Zustand não necessário** — Context API é suficiente para o snapshot de sessão. Zustand seria para estado de UI interativo complexo (filtros, modais) — avaliar no futuro
- **getClaims() vs getUser()** — `getClaims()` valida JWT localmente (sem rede, usado no proxy onde latência é crítica). `getUser()` valida com o servidor Auth (com rede, usado em `getSession()` e Server Actions). **Tradeoff**: tokens revogados no Supabase Auth ainda passam pelo proxy até o JWT expirar naturalmente; a proteção real vem de `getUser()` em `getSession()`
- **Classroom fora do escopo** — módulo classroom será implementado separadamente. Nenhum layout de `(classroom)` é criado nesta implementação
- **SessionProvider nos layouts protegidos** — `(app)` e `(admin)` apenas. Root layout não inclui SessionProvider pois também serve rotas `(auth)` sem sessão

---

## Further Considerations

1. **Realtime updates**: Se a subscription mudar em tempo real (ex: admin muda o plano), o contexto fica stale até o próximo hard refresh. Implementar Supabase Realtime listener para `billing.subscriptions` no `SessionProvider`? **Recomendação**: não agora — mutations de subscription são raras e um `router.refresh()` resolve
2. **Cache do Next.js**: `'use cache'` ou `unstable_cache` para o resultado da RPC? Não viável — a RPC usa `auth.uid()` (por usuário), então cache compartilhado entre requests é inviável. `cache()` do React (per-request) é suficiente para deduplicar dentro do mesmo render
3. **Verificar RPC vs schema atual**: Antes de implementar, confirmar que os campos retornados pela `v4` correspondem ao schema atual do banco. Se houver divergência, criar `get_current_user_details_v5` via migration

---

## O que NÃO entra no context global

- Listas paginadas (deals, pessoas, conversas, tarefas)
- Métricas e relatórios de dashboard
- Tabelas grandes e dados de formulários
- Conteúdo de página/módulo específico
- Estado de UI interativo (filtros, modais, seleção)

**Regra**: context global para identidade/conta/permissões; query local para conteúdo da tela.

---

## Antipatterns a evitar

- Buscar `user/account/subscription` separadamente em toda página sem camada agregadora
- Colocar dados pesados no context global
- Tratar `localStorage` ou store client como fonte de verdade de permissões/billing
- Espalhar regras de billing/permissão por componentes de UI individuais (centralizar nos helpers)
- Usar `supabase.auth.getSession()` no servidor em vez de `getUser()` para validação real
- Tentar usar Zustand ou Context API como mecanismo reativo dentro de Server Components
- Passar o retorno bruto da RPC para o `SessionProvider` — sempre mapear para o DTO `Session`
- Omitir `import 'server-only'` nos módulos do DAL
- Confiar em `searchParams` ou inputs do client sem validação Zod em Server Actions

---

## Changelog v1 → v2

| # | Tipo | Correção |
|---|------|--------|
| 1 | **CRÍTICO** | `get-session.ts`: RPC retorna `TABLE` (array), não registro único. Usar `.maybeSingle()` após `.rpc()` |
| 2 | **CRÍTICO** | `get-session.ts` e `server-checks.ts`: adicionar `import 'server-only'` como primeira linha |
| 3 | **ESTRUTURAL** | Step 4.3 removido: `(classroom)/layout.tsx` não existe e classroom é out-of-scope |
| 4 | **LÓGICO** | Tabela explícita de mapeamento de chaves usage → limits para `isWithinLimit()` |
| 5 | **LÓGICO** | `subscriptionStatus`: simplificado para `'active' | 'trial' | null`; remover `'expired' | 'cancelled'` |
| 6 | **ORDERING** | `actions.ts` (5.2.1) reordenado: agora é Phase 5 (antes de modificar componentes que dependem dele) |
| 7 | **MISSING** | `app-layout.tsx` adicionado à lista "Modificar" com lógica `showSystemBar` |
| 8 | **RENAME** | `admin-bar.tsx` → `system-bar.tsx`, `AdminBar` → `SystemBar` |
| 9 | **LÓGICO** | Lógica de exibição da SystemBar: `hasSharedAccounts || isSuperAdmin` com justificativa |
| 10 | **NOVA FEATURE** | Super Admin na SystemBar: paginação (20/página) + infinite scroll + search por nome |
| 11 | **SEGURANÇA** | Zod validation obrigatória em `switchAccountAction` e `getUserAccountsAction` |
| 12 | **SEGURANÇA** | IDOR: documentar proteção via RPC + RLS; verificar null antes de retornar `Session` |
| 13 | **SEGURANÇA** | Return values: `switchAccountAction` retorna DTO mapeado, nunca retorno bruto da RPC |
| 14 | **SEGURANÇA** | Decisão documentada: tradeoff `getClaims()` (proxy) vs `getUser()` (getSession) — tokens revogados |
| 15 | **MINOR** | `avatar-dropdown.tsx`: role gating para "Administrar Cursos" (`accessLevel >= 150`) e "Debug" (`accessLevel === 999`) |
| 16 | **NOVA PHASE** | Phase 8 adicionada: atualizar docs relevantes + criar `docs/implementations/session-context.md` |

## Changelog v2 → v3

| # | Tipo | Correção |
|---|------|--------|
| 17 | **API RENAME** | `can()` → `hasPermission()` no hook `useAccessControl`; `serverCan()` → `serverHasPermission()` em `server-checks.ts` |
| 18 | **LÓGICO** | Correção na tabela de mapeamento: `max_contacts` limita **deals** (não persons); `deals_count` → `max_contacts` |
| 19 | **LÓGICO** | `persons` ganha limite hardcoded de app: `20_000` (sem entrada em `total_limits`) |
| 20 | **SCOPE** | Tags sem count na RPC — limites hardcoded de tags requerem query separada quando necessário (fora do escopo atual) |
