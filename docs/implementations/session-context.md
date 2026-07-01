---
title: Session Context
description: Camada de sessão do app — DAL server-only, React Context, hooks de acesso e controle de permissões
---

# Session Context

## Visão Geral

A camada de sessão centraliza os dados do usuário autenticado (user, account, role, subscription, usage, limits, features) em um snapshot carregado uma vez por render de layout. Client Components acessam esses dados via hooks sem prop drilling.

```
Layout (Server Component)
  └── getSession()  →  RPC get_current_user_details_v4
         │
         └── SessionProvider (Client)
               ├── useSession()         → snapshot completo
               └── useAccessControl()  → hasPermission / hasFeature / isWithinLimit
```

## Fluxo (Server → Context → Hooks)

```
1. (app)/layout.tsx   →  await getSession()
2. getSession()       →  lê cookie `causi_act`  →  supabase.auth.getUser()  +  RPC .maybeSingle()
3. mapRpcToSession()  →  Session DTO (sem campos internos)
4. SessionProvider    →  useState(session)  →  Context.Provider
                      →  useEffect (mount) → syncSessionCookieAction()  → inicializa cookie se ausente
5. useSession()       →  useContext(SessionContext).session
6. useAccessControl() →  hasPermission / hasFeature / isWithinLimit
```

### Redirect no layout

| Estado | Destino |
|--------|---------|
| `getUser()` retorna erro (token inválido) | `/login?next=/dashboard` |
| `getUser()` ok mas RPC retorna null (provisioning incompleto) | `/confirmar` |
| `session.role.accessLevel !== 999` no admin layout | `/dashboard` |

> **Por que `/confirmar` e não `/login`?** O middleware redireciona usuários autenticados de `/login` de volta para `/dashboard`, causando loop infinito. `/confirmar` aceita usuários autenticados para completar o registro.

## Arquivos

| Arquivo | Tipo | Descrição |
|---------|------|-----------|
| `src/lib/session/types.ts` | shared | Interfaces: `Session`, `SessionUser`, etc. |
| `src/lib/session/get-session.ts` | **server-only** | `getSession()` + `mapRpcToSession()` — lê cookie `causi_act` para contexto de conta |
| `src/lib/session/server-checks.ts` | **server-only** | `requireSession`, `serverHasPermission`, `serverHasFeature`, `serverIsWithinLimit` |
| `src/lib/session/actions.ts` | **use server** | `getUserAccountsAction()`, `switchAccountAction()`, `syncSessionCookieAction()` |
| `src/lib/session/index.ts` | barrel | Re-exports públicos |
| `src/lib/auth/actions.ts` | **use server** | `logoutAction()` — executa `signOut()` e deleta cookie `causi_act` |
| `src/components/session-provider.tsx` | client | `SessionProvider` + `useSessionContext()` — inicializa cookie no mount |
| `src/hooks/use-session.ts` | client | `useSession()` |
| `src/hooks/use-access-control.ts` | client | `useAccessControl()` |

### Integração com mídia pública do bucket `media`

O snapshot de sessão resolve `session.user.photo` como URL pública renderizável mesmo quando `users.photo` no banco armazena apenas o path relativo do bucket `media`.

Fluxo resumido:

1. Server Action persiste `users.photo = accounts/{accountId}/users/{userId}/avatar-{timestamp}.{ext}`
2. `getSession()` lê o valor cru retornado pela RPC
3. `mapRpcToSession()` usa `resolveMediaPublicUrl()` para converter esse path em URL pública
4. Client Components continuam consumindo `session.user.photo` sem conhecer a estrutura interna do bucket

Esse mapeamento preserva o contrato do context para a UI e permite migrar colunas legadas de URL completa para path canônico sem refatorar cada componente consumidor.

## Tipos Principais

```typescript
interface Session {
  user: SessionUser;       // id, name, email, photo
  account: SessionAccount; // id, name, status
  role: SessionRole;       // id, accessLevel, permissions
  subscription: SessionSubscription; // status + campos do plano
  usage: SessionUsage;     // agents/channels/deals/persons/pipelines/users counts
  limits: SessionLimits;   // max_contacts, max_users, max_channels, max_pipelines
  features: SessionFeatures; // Record<string, boolean>
  hasSharedAccounts: boolean;
}
```

## Exemplos de Uso

### Client Component — leitura de sessão

```tsx
"use client";
import { useSession } from "@/hooks/use-session";

export function UserGreeting() {
  const session = useSession();
  return <p>Olá, {session.user.name} — conta: {session.account.name}</p>;
}
```

### Client Component — controle de acesso

```tsx
"use client";
import { useAccessControl } from "@/hooks/use-access-control";

export function NewChannelButton() {
  const { hasPermission, hasFeature, isWithinLimit } = useAccessControl();

  if (!hasPermission("channels", "write")) return null;
  if (!isWithinLimit("channels")) return <UpgradeButton />;

  return <Button>Novo Canal</Button>;
}
```

### Server Component / Server Action

```typescript
import { getSession, requireSession, serverHasPermission } from "@/lib/session";

export default async function ChannelsPage() {
  const session = await getSession();
  requireSession(session); // redirect se null

  if (!serverHasPermission(session, "channels", "read")) {
    redirect("/dashboard");
  }

  // ...
}
```

### Atualização otimista de usage após mutation

```tsx
"use client";
import { useSessionContext } from "@/components/session-provider";

export function CreateDealButton() {
  const { setSession } = useSessionContext();

  async function handleCreate() {
    await createDealAction();
    setSession((prev) => ({
      ...prev,
      usage: {
        ...prev.usage,
        deals_count: (prev.usage.deals_count ?? 0) + 1,
      },
    }));
  }

  return <Button onClick={handleCreate}>Nova Oportunidade</Button>;
}
```

### Atualização otimista do avatar/nome do usuário

```tsx
"use client";
import { useSessionContext } from "@/components/session-provider";

export function ProfileSaveExample() {
  const { setSession } = useSessionContext();

  async function handleProfileSaved(name: string, photoUrl: string | null) {
    setSession((prev) => ({
      ...prev,
      user: {
        ...prev.user,
        name,
        photo: photoUrl,
      },
    }));
  }

  return null;
}
```

Esse padrão já é usado em `/perfil`: a UI atualiza o `SessionProvider` após a Server Action e em seguida executa `router.refresh()` para sincronizar também os Server Components da rota atual.

## Tabela de Mapeamento de Limites

| Recurso | Chave usage | Chave limit | Origem |
|---------|-------------|-------------|--------|
| `deals` | `deals_count` | `max_contacts` | DB (`total_limits`) |
| `users` | `users_count` | `max_users` | DB (`total_limits`) |
| `channels` | `channels_count` | `max_channels` | DB (`total_limits`) |
| `agents` | `agents_count` | `max_channels` (proxy temp.) | DB — até limit próprio existir |
| `pipelines` | `pipelines_count` | `max_pipelines` | DB (`total_limits`) |
| `persons` | `persons_count` | `20_000` hardcoded | App-level |

## Decisões de Design

### Cookie `causi_act` — Persistência do contexto de conta

A conta selecionada no `SystemBar` é persitida no cookie HTTP-only `causi_act` (maxAge 30 dias). Isso permite que `getSession()` — executado no servidor — passe `p_account_id` à RPC e retorne os dados da conta correta em todos os requests subsequentes (F5, navegação, `router.refresh()`).

| Situação | Comportamento |
|----------|---------------|
| Login inicial (sem cookie) | `getSession()` retorna conta principal. `syncSessionCookieAction` no mount do `SessionProvider` seta o cookie com o id da conta principal se ainda não existir |
| Troca de conta | `switchAccountAction` seta o cookie com o novo `accountId` |
| F5 / retorno enquanto logado | `getSession()` lê o cookie → RPC com `p_account_id` → mantém a conta selecionada |
| RPC retorna null (acesso revogado) | `getSession()` deleta o cookie → fallback para conta principal |
| Logout | `logoutAction` deleta o cookie → próximo login começa na conta principal |
| Cookie expirado/deletado | Fallback para conta principal |

> **Por que cookie e não localStorage?** Server Components e `getSession()` executam no servidor, onde `localStorage` não existe. Cookies são enviados automaticamente em cada request HTTP, tornando o contexto de conta visível para o servidor antes de qualquer render.

### `getUserAccountsAction` — conta principal + contas adicionais

Para usuários comuns, a listagem consolida **duas fontes**:
1. Conta principal: `users.account_id` (join `accounts`)
2. Contas adicionais: `users_accounts` (join `accounts`)

Os resultados são deduplicados por `id` e a conta principal sempre aparece primeiro. Sem essa consolidação o dropdown não exibiria a conta principal.

### Proteção IDOR em switchAccountAction

`switchAccountAction` valida `accountId` via Zod (inteiro positivo) antes de chamar a RPC. A RPC usa `auth.uid()` e RLS para garantir que apenas contas acessíveis retornem dados. Se o campo `data` for null (conta inválida ou sem acesso), a action retorna `{ error: 'Forbidden' }` sem expor nenhum detalhe.

### cache() do React vs unstable_cache do Next.js

`getSession()` usa `cache()` do React (per-request) — deduplica chamadas dentro da mesma árvore de render sem risco de compartilhar dados entre usuários. `unstable_cache` / `"use cache"` armazena entre requests e é incompatível com `auth.uid()` e leitura de cookies por request.

### SystemBar vs AdminBar

A barra renomeada de `AdminBar` para `SystemBar` é exibida para qualquer usuário com `hasSharedAccounts === true` ou `accessLevel === 999`. A lógica antes era hard-coded `showAdminBar = true`; agora é derivada da sessão real.
