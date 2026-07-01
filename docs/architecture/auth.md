---
title: Autenticação e Controle de Acesso
description: Auth flow, roles, RLS strategy, formas de acesso, fluxo de convite, multi-account, context switching
---

# Autenticação e Controle de Acesso

O controle de acesso do Causi opera em 3 camadas complementares: Proxy, Client-Side e Server-Side + RLS.

---

## Camadas de Acesso

| Camada | Responsabilidade | Implementação |
|--------|-----------------|---------------|
| **Proxy** | Validação de sessão e roteamento | `src/proxy.ts` via `@supabase/ssr` |
| **Client-Side** | Verificação de acesso por role/feature, controle de UI | `useSession()`, `useAccessControl()` |
| **Server-Side + RLS** | Validação de autenticidade, role, billing e isolamento | `createServerClient`, Políticas RLS |

---

## Roles

O Causi define **5 roles** com hierarquia de acesso. Permissões granulares em `roles.permissions` (jsonb) no formato `{"recurso": ["create","read","update","delete"]}`.

| Slug | Nome | Access Level | Tipo | Descrição |
|------|------|-------------|------|-----------|
| `super_admin` | Super Admin | 999 | Sistema | Acesso cross-account a todas as contas. Suporte técnico, administração comercial. |
| `support_admin` | Suporte | 150 | Sistema | Suporte avançado com acesso a múltiplas contas. Leitura/atualização de subscriptions. |
| `owner` | Proprietário | 100 | Account | Dono da conta. Controle total sobre dados, billing e usuários da própria conta. |
| `admin` | Administrador | 50 | Account | Operacional. CRUD em deals, contatos, tarefas, organizações. |
| `user` | Usuário | 20 | Account | Operacional restrito. CRUD limitado, leitura em agents/accounts/channels. |

**Super Admin vs Support Admin**: Super admin tem CRUD completo em tudo (incluindo `accounts`, `users`, `subscriptions`). Support admin tem acesso mais restrito (ex: `subscriptions` apenas `read/update`, `accounts` apenas `create/read/update`).

> Permissões completas extraídas do banco em [roles-and-permissions.md](../references/roles-and-permissions.md).

---

## Conta Principal vs. Acesso Adicional

- `users.account_id` define a conta **principal** do usuário
- `users.role_id` define o papel do usuário **na conta principal**
- A tabela `users_accounts` existe **exclusivamente** para conceder acesso a contas adicionais (compartilhadas, normalmente pelo super_admin)
- O owner de uma conta é identificado pela `role_id` com slug `owner` na tabela `users`
- `name` e `photo` do usuário vêm de `public.users`, **não** de `auth.users` (que não possui esses campos)

Para saber quais contas um usuário pode acessar:
```sql
-- Conta principal
SELECT account_id FROM public.users WHERE id = auth.uid()
-- Contas adicionais
SELECT account_id FROM public.users_accounts WHERE user_id = auth.uid()
```

---

## Formas de Acesso à Plataforma

Existem **quatro formas distintas** de um usuário obter acesso ao Causi, dependendo do contexto:

### 1. Plano Gratuito — Cadastro Self-Service

Qualquer pessoa pode se cadastrar diretamente em `/cadastrar` sem nenhum código ou convite:

1. Usuário acessa a página de cadastro e cria uma conta (e-mail + senha)
2. Uma assinatura no **plano gratuito** (`plan_id = 1`) é criada automaticamente via RPC `complete_user_registration_v2`
3. Acesso ao módulo `classroom` com **cursos básicos** da plataforma
4. Sem acesso ao CRM (deals, contatos, canais, IA)

### 2. Plano Educacional — Cadastro via Landing Page Externa

Acesso a **cursos premium** do `classroom` requer um código exclusivo originado de uma LP externa:

1. Usuário acessa uma **Landing Page externa** (fora deste repositório)
2. A LP registra o código `EDU_CLASSROOM_2026` nos metadados (`raw_user_meta_data`) do usuário no Supabase Auth
3. Com esse código nos metadados, a RLS de `billing.subscriptions` permite criar uma assinatura no **plano educacional** (`plan_id = 8`)
4. Acesso ao módulo `classroom` com **cursos premium** — sem acesso ao CRM

> Sem o código nos metadados, a tentativa de criar assinatura no plano educacional é bloqueada pela RLS.

### 3. CRM — Provisionamento pelo Super Admin

O acesso ao produto CRM (deals, contatos, WhatsApp, IA) é **100% administrativo** — não há self-service:

1. Cliente contrata o Causi e a negociação/pagamento ocorre **manualmente fora da plataforma**
2. Super Admin acessa `/admin-contas` → preenche nome, e-mail e senha do usuário owner
3. Cria o usuário em `auth.users` via Supabase Auth (o super admin possui política RLS `Full access` — sem necessidade de `service_role`)
4. Chama a RPC `admin_complete_user_registration` (autenticado como super_admin) que cria `public.users` + `accounts` + pipeline inicial com estágios
5. Cria a assinatura via Edge Function `admin-subscriptions-handler`
6. Owner recebe credenciais e acessa a plataforma

> **Não existe** trial self-service nem cadastro independente para o CRM no momento. Isso está planejado para uma versão futura.

### 4. Convite — Membros adicionais de uma conta CRM

Quando um plano permite mais de um usuário, o owner/admin da conta pode convidar novos membros:

1. Admin/Owner cria convite via `/usuarios` → função `create_account_invitation` no banco
2. Registro inserido em `account_invitations` com `token`, `role_id`, `account_id`, `expires_at` (token e expiração gerados pela aplicação, +7 dias)
3. E-mail enviado via SMTP com link contendo token: `/convite?token=...`
4. Convidado acessa `/convite?token=...`
5. Função RPC `is_valid_invite_for_user(p_email, p_account_id, p_token)` verifica token, email, conta e expiração
6. Ao aceitar:
   - Cria registro em `auth.users` (via `service_role`, sem confirmação de email — convite já é verificação)
   - Cria registro em `public.users` com `account_id` da conta convidante e `role_id` do convite
   - Trigger atualiza `account_invitations.status` para `'accepted'`

> **Nota**: O registro é criado em `public.users` (com `account_id`), **não** em `users_accounts`. A tabela `users_accounts` é apenas para contas adicionais.

---

## Fluxo de Autenticação (Login)

1. Usuário submete email/senha
2. Supabase Auth valida credenciais e retorna JWT
3. `@supabase/ssr` salva JWT em cookie seguro (httpOnly)
4. Proxy valida sessão via `supabase.auth.getClaims()`
5. Se válida: acesso permitido; se inválida: redireciona para `/login`

---

## Expiração de Plano

Quando uma assinatura expira (trial ou plano pago), a conta **não é removida nem bloqueada** — é feito um **downgrade automático para o plano gratuito**. O cron `subscriptions-lifecycle-cron-v2` aplica essa transição.

---

## Context Switching (Multi-Account)

Quando um usuário tem acesso a mais de uma conta (via `users_accounts` ou sendo super admin):

- O `SystemBar` exibe um seletor de contas no topo da aplicação
- Ao selecionar uma conta, `switchAccountAction` re-executa a RPC `get_current_user_details_v4` com o `p_account_id` escolhido, seta o cookie HTTP-only `causi_act` e retorna o novo `Session` DTO
- O cliente atualiza o React Context via `setSession()` e chama `router.refresh()` para re-renderizar os Server Components com os dados da nova conta
- O cookie `causi_act` persiste a conta selecionada entre requests, F5 e navegações — `getSession()` o lê e passa como `p_account_id` à RPC
- O cookie é limpo no logout (`logoutAction`) e em caso de acesso revogado (RPC retorna null)
- O dropdown lista conta principal (`users.account_id`) + contas adicionais (`users_accounts`), consolidadas e deduplicadas

> Detalhes completos de implementação em [implementations/session-context.md](../implementations/session-context.md).

---

## Proxy

O proxy protege todas as rotas privadas, mantém a sessão ativa e repassa tokens renovados ao browser:

```tsx
// proxy.ts
import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/proxy'

export async function proxy(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

A lógica de renovação de sessão fica em `lib/supabase/proxy.ts`, que usa `supabase.auth.getClaims()` para validar o token:

```tsx
// lib/supabase/proxy.ts
const AUTH_ROUTES = new Set(["/login", "/cadastrar", "/confirmar", "/redefinir"])

function isPublicRoute(pathname: string) {
  return AUTH_ROUTES.has(pathname) || pathname.startsWith("/auth/callback")
}

export async function updateSession(request: NextRequest) {
  const supabase = createServerClient(...)
  const { data: claimsData, error } = await supabase.auth.getClaims()

  const pathname = request.nextUrl.pathname
  const isAuthenticated = Boolean(claimsData?.claims?.sub) && !error

  // Redireciona não-autenticados para login (preservando destino em ?next=)
  if (!isAuthenticated && !isPublicRoute(pathname)) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("next", pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Redireciona autenticados para fora das rotas de auth
  // Exceções: /confirmar (provisioning) e /redefinir?mode=update (recovery)
  if (isAuthenticated && AUTH_ROUTES.has(pathname)) {
    if (pathname === "/confirmar") return response.current
    const isRecovery = pathname === "/redefinir" &&
      request.nextUrl.searchParams.get("mode") === "update"
    if (!isRecovery) return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  return response.current
}
```

> **Atenção:** Nunca use `supabase.auth.getSession()` em server code (proxy, Server Actions, Route Handlers) — ele não revalida o token e pode aceitar sessões inválidas. Use sempre `getClaims()`, que valida o JWT diretamente.

---

## Client-Side: Hook de Acesso

```tsx
export function useAccessControl() {
  const { user, account, role } = useSession()

  const hasPermission = (resource: string, action: string) => {
    return role?.permissions?.[resource]?.includes(action) ?? false
  }

  return { hasPermission, role }
}

// Uso:
const { hasPermission } = useAccessControl()
if (hasPermission('deals', 'delete')) { /* mostrar botão */ }
```

---

## Server-Side + RLS

- RLS isola dados por `account_id` automaticamente
- `account_id` **deve ser incluído** em todas as queries, mesmo com RLS ativo — para multi-account users, RLS sozinho não é suficiente
- Validação de permissões via Server Actions antes de operações sensíveis
- Funções auxiliares: `is_user_in_account_or_shared()`, `has_user_permission_in_account()`, `is_super_admin()`
- Super admin possui política `Full access` em todas as tabelas (bypass cross-account)

> Detalhes de RLS em [rls.md](../database/rls.md).

---

## Segurança: RLS vs. Validação de Aplicação

- **RLS** protege visibilidade e propriedade dos dados no nível do PostgreSQL
- **Validação de Aplicação** (Server Side) verifica: limites quantitativos, regras de negócio complexas, permissões baseadas em estado

Ambas devem estar presentes. RLS sem validação de aplicação é insuficiente; validação sem RLS é perigosa.

---

## Documentos Relacionados

| Documento | Descrição |
|-----------|-----------|
| [roles-and-permissions.md](../references/roles-and-permissions.md) | Permissões reais extraídas do banco |
| [database/rls.md](../database/rls.md) | Políticas RLS por tabela |
| [features/admin-panel.md](../features/admin-panel.md) | Painel do super admin |
| [database/schema-public.md](../database/schema-public.md) | Tabelas users, roles, accounts |
| [implementations/auth.md](../implementations/auth.md) | Implementação completa — camadas, arquivos, fluxos end-to-end |
