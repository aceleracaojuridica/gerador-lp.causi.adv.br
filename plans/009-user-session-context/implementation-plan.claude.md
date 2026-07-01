# Plan: User Session Context & Access Control

## TL;DR

Implementar um sistema de contexto de sessão que carrega dados do usuário logado (user, account, role, subscription, plan limits/features, usage) uma vez no layout do servidor via RPC, distribui via React Context (Context API) para Client Components, e expõe hooks para verificações de permissão, feature gates, limites e status da assinatura. O servidor continua sendo a camada de proteção real (Server Actions + RLS), enquanto o cliente esconde UI e bloqueia interações proativamente.

### Princípios-chave

1. **Server-first para dados sensíveis** — autenticação e dados globais são resolvidos no servidor; a interface cliente recebe um snapshot e o distribui
2. **Context global = snapshot de UI** — não é fonte de verdade de segurança, é distribuição de dados para evitar prop drilling
3. **Queries específicas ficam na página** — métricas, tabelas, relatórios, listas paginadas NÃO entram no context global; ficam na página/módulo que usa
4. **Proxy só renova token** — o proxy/middleware cuida de cookies e renovação de sessão, não faz autorização de negócio
5. **Regras de billing/permissão centralizadas** — nunca espalhar lógica de permissão/billing por componentes de UI individuais; usar helpers centralizados

---

## Decisão Arquitetural: RPC vs Queries Diretas

**Recomendação: Manter a RPC `get_current_user_details_v4` (ou versão atualizada) como fonte de dados.**

Justificativas:
- **Single round-trip** — A função faz 7 JOINs + 6 COUNTs em uma única chamada ao banco. Fazer 5+ queries separadas do Next.js seria mais lento e mais complexo
- **Lógica complexa centralizada** — O cálculo de `effective_account_id` e `effective_role_id` (multi-account, super admin) está encapsulado no banco, evitando duplicação no app
- **RLS continua ativo** — A função usa `auth.uid()` e respeita as políticas
- **Já funciona** — A função é battle-tested no app antigo
- **Consistência** — Todos os dados vêm da mesma transação, sem race conditions entre queries separadas

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
  ├─ useAccessControl() — can(), hasFeature(), isWithinLimit()
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
| **Troca de conta (AdminBar)** | Server Action `switchAccountAction(accountId)` → re-fetch via RPC → `setSession()` + `router.refresh()` | Context atualizado com dados da nova conta |
| **Edição de perfil** (nome, foto) | Após salvar → `setSession()` com dados locais atualizados | Reflete imediatamente no avatar/sidebar |
| **Criação de recurso** (deal, pessoa, canal) | Após INSERT → incrementar `usage` localmente via `setSession()` | Contadores de usage atualizam sem round-trip |
| **Mudança de subscription** (raro, admin) | `router.refresh()` | Re-executa o layout server → nova RPC → novo snapshot |
| **Logout** | `logoutAction()` já implementado | Limpa session e redireciona para `/login` |

### `router.refresh()` vs `setSession()`
- **`router.refresh()`** — re-executa Server Components (incluindo layout), gerando novo snapshot via RPC. Garante dados 100% frescos do banco. Custo: round-trip.
- **`setSession()`** — atualiza React Context localmente, sem rede. Reflete mudanças imediatas na UI. Custo: zero. Risco: pode ficar desalinhado se a operação falhou no servidor.
- **Padrão recomendado**: para ações que alteram dados da sessão, fazer a operação no servidor (Server Action) → se sucesso, `setSession()` local → opcionalmente `router.refresh()` para garantia.

---

## Steps

### Phase 1: Pré-Requisitos

**1.1** Gerar `src/lib/database.types.ts` via Supabase CLI
- Comando: `supabase gen types typescript > src/lib/database.types.ts`
- Necessário para tipagem automática das queries e do retorno da RPC

**1.2** Criar `src/lib/session/types.ts` — tipos TypeScript para a sessão
- Definir interfaces: `SessionUser`, `SessionAccount`, `SessionRole`, `SessionSubscription`, `SessionUsage`, `PlanLimits`, `PlanFeatures`
- Definir o tipo principal `Session` que agrupa tudo
- Tipo `Permission` para o formato `{"resource": ["create","read","update","delete"]}`
- Esses tipos devem ser compatíveis com o retorno da RPC `get_current_user_details_v4`
- **Referência**: retorno da RPC em `supabase/schemas/public/functions/get_current_user_details_v4.sql`

### Phase 2: Data Fetching no Servidor

**2.1** Criar `src/lib/session/get-session.ts` — função server-only
- Função `getSession(accountId?: number): Promise<Session | null>`
- **Envolver com `cache()` do React** — deduplicar chamadas dentro da mesma árvore de render server-side (se layout e um Server Component filho ambos chamarem `getSession()`, a RPC roda só uma vez)
- Usa `createClient()` do server para chamar a RPC
- Chama `supabase.auth.getUser()` primeiro para validar autenticação (não `getClaims()` — aqui queremos validação real)
- Se autenticado, chama `supabase.rpc('get_current_user_details_v4', { p_account_id: accountId })`
- Mapeia o retorno da RPC para os tipos `Session` definidos em 1.2
- Retorna `null` se não autenticado ou se a RPC falhar
- **Referência de implementação**: `src/lib/supabase/server.ts` (padrão `createClient()`)

**2.2** Criar `src/lib/session/server-checks.ts` — helpers server-side
- `requireSession()`: chama `getSession()`, redireciona para `/login` se null (para Server Components)
- `requireSessionOrThrow()`: chama `getSession()`, throw error se null (para Server Actions)
- `serverCan(session, resource, action)`: verifica permissão no servidor
- `serverHasFeature(session, feature)`: verifica feature gate no servidor
- `serverIsWithinLimit(session, resource)`: verifica limite no servidor
- Estas funções são usadas em Server Components e Server Actions para proteção real

### Phase 3: Context & Hooks no Cliente

**3.1** Criar `src/lib/session/session-provider.tsx` — Provider client-side  
- `"use client"` component
- Recebe `initialData: Session` via props (vem do Server Component pai — dados que nasceram no servidor)
- Armazena em React Context via `useState(initialData)`
- **Expõe `setSession`** no context — permite atualizações client-side futuras (ex: context switching, refresh após ação)
- Exporta `SessionContext`
- Aceita `accountId` opcional (prepara para context switching futuro)
- **Não faz fetch** — apenas distribui o snapshot que veio do servidor
- **Usar `useMemo`** para estabilizar o value do context e evitar re-renders desnecessários

**3.2** Criar `src/hooks/use-session.ts` — hook principal
- Consome `SessionContext`
- Retorna `{ user, account, role, subscription, usage, limits, features, isLoading }`
- Throw error se usado fora do `SessionProvider` (DX safety)
- Propriedades derivadas: `isAuthenticated`, `isSuperAdmin`, `isTrial`, `isActiveSubscription`

**3.3** Criar `src/hooks/use-access-control.ts` — hook de verificações
- Consome `useSession()` internamente
- Retorna:
  - `can(resource, action)` — verifica permissão do role (`role.permissions[resource]?.includes(action)`)
  - `hasFeature(feature)` — verifica se o plano inclui a feature (`features[feature] === true`)
  - `isWithinLimit(resource)` — compara usage vs limits (`usage[resource] < limits[resource]`)
  - `subscriptionStatus` — 'active' | 'trial' | 'expired' | 'cancelled'
  - `isActive` — shorthand para subscription ativa ou trial
- **Referência de dados**:
  - Permissions: `{ deals: ["create","read","update","delete"], ... }` (de `docs/references/roles-and-permissions.md`)
  - Features: `{ tags: true, deals: true, agents: false, ... }` (de `docs/references/plans-and-features.md`)
  - Limits: `{ max_contacts: 1000, max_users: 1, ... }` (de `billing.subscriptions.total_limits`)

### Phase 4: Integração nos Layouts

**4.1** Atualizar `src/app/(app)/layout.tsx`
- Importar `getSession()` e `SessionProvider`
- Tornar o layout `async` (Server Component)
- Chamar `const session = await getSession()`
- Envolver children com `<SessionProvider session={session}>`
- Se session null, redirecionar para `/login` (proteção adicional ao proxy)

**4.2** Atualizar `src/app/(admin)/layout.tsx` — *paralelo com 4.1*
- Mesma abordagem, mas pode incluir verificação de `isSuperAdmin`
- Se não super admin, redirecionar para `/dashboard` ou mostrar 403

**4.3** Atualizar `src/app/(classroom)/layout.tsx` — *paralelo com 4.1*
- Mesma abordagem de SessionProvider
- Verificação de feature `classroom` ou `classroom_premium`

**4.4** Atualizar `src/provider.tsx`
- **Não adicionar SessionProvider aqui** — ele deve ficar nos layouts protegidos, não no root
- O root layout envolve `(auth)` também, onde não há sessão

### Phase 5: Atualizar Componentes com Dados Reais

**5.1** Atualizar `src/components/atoms/avatar-dropdown.tsx`
- Substituir email hardcoded (`"webmaster@causi.com.br"`) por `session.user.email`
- Substituir avatar mock por `session.user.photo`
- Usar `useSession()` hook
- **Referência**: `src/components/atoms/avatar-dropdown.tsx` linhas 74-75

**5.2** Atualizar `src/components/admin-bar.tsx`
- Substituir array `accounts` hardcoded por dados reais do hook `useSession()`
- Mostrar a conta atual de `session.account` como valor selecionado
- Se `session.hasSharedAccounts` é true, buscar a lista de contas acessíveis na montagem (via Server Action `getUserAccountsAction()`)
- A conta principal (`session.user.mainAccountId`) sempre aparece na lista
- Ao selecionar conta diferente: chamar Server Action `switchAccountAction(accountId)` que re-fetcha via RPC com o novo `accountId`, retorna `Session` atualizada → `setSession()` + `router.refresh()`
- **Referência**: `src/components/admin-bar.tsx` linhas 23-29 (array mock), `get_current_user_details_v4.sql` param `p_account_id`

**5.2.1** Criar `src/lib/session/actions.ts` — Server Actions de sessão
- `switchAccountAction(accountId: number)`: chama `getSession(accountId)` e retorna o novo `Session`
- `getUserAccountsAction()`: busca contas acessíveis do usuário (conta principal + `users_accounts`)
- Ambas validam autenticação via `supabase.auth.getUser()` antes de qualquer query

**5.3** Atualizar `src/components/app-sidebar.tsx`
- Substituir dados mock de usage ("136 de 5.000") por `session.usage`/`session.limits`
- Condicionar itens de navegação baseado em `hasFeature()`:
  - "Agentes" visível só se `hasFeature('agents')`
  - "Cursos" visível se `hasFeature('classroom')` ou `hasFeature('classroom_premium')`
- Condicionar por permissão: esconder "Canais" se `!can('channels', 'read')`

### Phase 6: Barrel Export & Documentação

**6.1** Criar `src/lib/session/index.ts` — barrel export
- Re-exporta: types, `getSession`, `requireSession`, `requireSessionOrThrow`, server checks
- Re-exporta: `SessionProvider`
- Os hooks ficam em `src/hooks/` seguindo a convenção do projeto

---

## Relevant Files

### Criar
- `src/lib/session/types.ts` — tipos TypeScript da sessão
- `src/lib/session/get-session.ts` — fetch server-side via RPC
- `src/lib/session/server-checks.ts` — helpers de verificação server-side
- `src/lib/session/session-provider.tsx` — React Context provider
- `src/lib/session/actions.ts` — Server Actions (switch account, get user accounts)
- `src/lib/session/index.ts` — barrel exports
- `src/hooks/use-session.ts` — hook de acesso à sessão
- `src/hooks/use-access-control.ts` — hook de verificações

### Modificar
- `src/app/(app)/layout.tsx` — adicionar SessionProvider com dados do servidor
- `src/app/(admin)/layout.tsx` — adicionar SessionProvider + verificação super admin
- `src/app/(classroom)/layout.tsx` — adicionar SessionProvider (se existir layout)
- `src/components/atoms/avatar-dropdown.tsx` — substituir dados mock por useSession()
- `src/components/admin-bar.tsx` — substituir accounts mock por dados reais
- `src/components/app-sidebar.tsx` — substituir usage mock + condicionar nav items

### Referência (não modificar)
- `supabase/schemas/public/functions/get_current_user_details_v4.sql` — retorno da RPC
- `src/lib/supabase/server.ts` — padrão `createClient()` para server
- `src/lib/supabase/client.ts` — padrão `createClient()` para browser
- `src/lib/supabase/proxy.ts` — lógica do middleware (já valida auth)
- `docs/references/roles-and-permissions.md` — estrutura de permissões
- `docs/references/plans-and-features.md` — estrutura de features e limites

---

## Verification

1. **Type safety**: `pnpm build` compila sem erros (TypeScript strict)
2. **Lint**: `pnpm lint` passa sem erros (Biome)
3. **Login flow**: Fazer login → verificar que `useSession()` retorna dados do usuário real
4. **Avatar dropdown**: Mostra email e foto do usuário logado (não mock)
5. **Admin bar**: Mostra nome da conta atual e lista de contas acessíveis no select
6. **Context switching**: Selecionar outra conta no AdminBar → sidebar/avatar/dados atualizam para a nova conta
7. **Sidebar**: 
   - Usage mostra contadores reais
   - Nav items condicionados por features do plano
8. **Permission check**: Um usuário com role `user` não deve ver botão de deletar canais (`!can('channels', 'delete')`)
9. **Feature gate**: Conta no plano Essential não deve ver "Agentes" na sidebar (`!hasFeature('agents')`)
10. **Server protection**: Server Action de criação de deal rejeita se `!serverCan(session, 'deals', 'create')`
11. **Non-authenticated**: Acessar rota protegida sem login redireciona para `/login`
12. **Session refresh**: Após editar perfil, avatar/email atualizam imediatamente sem reload

---

## Decisions

- **RPC mantida** como fonte de dados — single round-trip, lógica complexa centralizada, RLS ativo
- **Layout fetch** — dados carregam uma vez no Server Component do layout, não por page load. Next.js preserva layout durante client-side navigation
- **Context switching** — implementado na AdminBar com Server Action `switchAccountAction()`. Ao trocar de conta, re-fetch via RPC com novo `accountId`, atualiza context local e `router.refresh()`
- **Stale data tolerado** — dados de sessão podem ficar ligeiramente desatualizados durante a navegação. Server Actions **sempre** re-verificam no banco antes de operações sensíveis. Após ações que alteram dados da sessão: `setSession()` local + `router.refresh()` conforme necessidade
- **Zustand não necessário** — Context API é suficiente para o snapshot de sessão. Zustand seria para estado de UI interativo complexo (filtros, modais, drag-and-drop) — avaliar no futuro quando features de CRM amadurecerem
- **getClaims() vs getUser()** — `getClaims()` valida JWT localmente (rápido, sem rede) e é usado no proxy. `getUser()` valida com o servidor Auth (mais seguro, com rede) e é usado em `getSession()` e Server Actions. Nunca usar `getSession()` do Supabase no servidor (não valida o token)
- **`database.types.ts`** — incluído como pré-requisito (comando Supabase CLI)
- **SessionProvider** fica nos layouts protegidos (`(app)`, `(admin)`, `(classroom)`), não no root layout — porque rotas de auth não têm sessão
- **Escopo de todas as verificações**: permissões, feature gates, limites quantitativos, status da assinatura

## Further Considerations

1. **Realtime updates**: Se a subscription mudar em tempo real (ex: admin muda o plano), o contexto fica stale até o próximo hard refresh. Vale implementar Supabase Realtime listener para `subscriptions` no `SessionProvider`? **Recomendação**: não agora — mutations de subscription são raras e um refresh resolve
2. **Cache do Next.js**: Considerar `unstable_cache` ou `"use cache"` para o resultado da RPC, com revalidação por tag. Porém, a RPC usa `auth.uid()` (por sessão), então cache compartilhado entre usuários não é viável. Cache per-request do React (via `cache()`) já é suficiente para evitar duplicação dentro do mesmo render
3. **Atualizar RPC**: A RPC atual (`v4`) pode precisar de ajustes se o schema mudou. Verificar se os campos retornados ainda correspondem ao schema atual antes de implementar

---

## O que NÃO entra no context global

- Listas paginadas (deals, pessoas, conversas, tarefas)
- Métricas e relatórios de dashboard
- Tabelas grandes e dados de formulários
- Conteúdo de página/módulo específico
- Estado de UI interativo (filtros, modais, seleção) — se necessário no futuro, avaliar Zustand para esses casos

**Regra**: context global para identidade/conta/permissões; query local para conteúdo da tela.

## Antipatterns a evitar

- Buscar `user/account/subscription` separadamente em toda página sem camada agregadora
- Colocar dados pesados no context global
- Tratar `localStorage` ou store client como fonte de verdade de permissões/billing
- Espalhar regras de billing/permissão por componentes de UI individuais (centralizar nos helpers)
- Usar `supabase.auth.getSession()` no servidor em vez de `getUser()` para validação real
- Tentar usar Zustand ou Context API como mecanismo reativo dentro de Server Components
