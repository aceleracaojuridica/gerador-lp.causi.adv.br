---
title: Guia Completo - Gerenciando Sessao do Usuario no Contexto
description: Como usar getSession, SessionProvider, hooks de acesso, server checks e proxy com exemplos praticos em Server Components, Server Actions, Route Handlers e Client Components
---

# Guia Completo - Gerenciando Sessao do Usuario no Contexto

Este guia explica como utilizar e gerenciar a sessao do usuario no app Causi de forma segura, consistente e alinhada com o fluxo real do projeto.

O foco aqui e pratico: voce vai ver como aplicar sessao em Server Components, Server Actions, Route Handlers, Client Components, formularios e interacoes de UI.

---

## Visao geral rapida

No Causi, a sessao e montada assim:

1. `getSession()` chama a RPC `get_current_user_details_v4`
2. `mapRpcToSession()` transforma o payload em `Session`
3. `SessionProvider` compartilha o snapshot no client
4. `useSession()` e `useAccessControl()` leem sessao e regras de acesso
5. `server-checks.ts` aplica checks equivalentes no server
6. `proxy.ts` faz o gate inicial de autenticacao e redirects

> Nota: se voce veio de outras stacks, o papel de `getServerSession` aqui e exercido por `getSession()` em `src/lib/session/get-session.ts`.

---

## O que cada camada resolve

| Camada | Responsabilidade |
|---|---|
| `src/proxy.ts` + `src/lib/supabase/proxy.ts` | Verificar autenticacao cedo e redirecionar requests |
| `src/lib/session/get-session.ts` | Buscar sessao no server e mapear DTO seguro |
| `src/lib/session/server-checks.ts` | Regras server-side: permissao, feature e limite |
| `src/components/session-provider.tsx` | Disponibilizar snapshot da sessao no client |
| `src/hooks/use-session.ts` | Ler sessao em Client Components |
| `src/hooks/use-access-control.ts` | hasPermission, hasFeature, isWithinLimit no client |

---

## Fluxo recomendado (padrao)

1. Proteger request no `proxy` (autenticado vs publico)
2. No layout/pagina server, chamar `getSession()` e redirecionar se necessario
3. Em operacoes sensiveis, revalidar sessao dentro da Server Action / Route Handler
4. No client, usar `useAccessControl()` para UX (mostrar/esconder/desabilitar)
5. Nunca confiar so no client para seguranca de dados

---

## 1) Server Components

### Caso de uso: pagina protegida com permissao + redirect

```tsx
import { redirect } from "next/navigation";
import {
	getSession,
	requireSession,
	serverHasFeature,
	serverHasPermission,
} from "@/lib/session";

export default async function RelatoriosPage() {
	const session = await getSession();
	requireSession(session);

	if (!serverHasFeature(session, "reports")) {
		redirect("/dashboard?erro=feature-indisponivel");
	}

	if (!serverHasPermission(session, "reports", "read")) {
		redirect("/dashboard?erro=sem-permissao");
	}

	return <main>Conteudo de relatorios</main>;
}
```

### Caso de uso: proteger por nivel administrativo

```tsx
import { redirect } from "next/navigation";
import { getSession, requireSession } from "@/lib/session";

export default async function AdminOnlyPage() {
	const session = await getSession();
	requireSession(session);

	if (session.role.accessLevel !== 999) {
		redirect("/dashboard");
	}

	return <main>Painel administrativo</main>;
}
```

Boas praticas:

- Faca validacao de acesso no server antes de renderizar dados sensiveis
- Use redirect server-side para evitar flicker de conteudo proibido
- Em multi-account, deixe o `causi_act` conduzir o contexto via `getSession()`

---

## 2) Server Actions

### Caso de uso: mutation sensivel com validacao de sessao

```ts
"use server";

import { z } from "zod";
import {
	getSession,
	requireSession,
	serverHasPermission,
	serverIsWithinLimit,
} from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

const createChannelSchema = z.object({
	name: z.string().min(2),
});

export async function createChannelAction(input: unknown) {
	const parsed = createChannelSchema.safeParse(input);
	if (!parsed.success) {
		return { error: "Dados invalidos" };
	}

	const session = await getSession();
	requireSession(session);

	if (!serverHasPermission(session, "channels", "create")) {
		return { error: "Forbidden" };
	}

	if (!serverIsWithinLimit(session, "channels")) {
		return { error: "Limite de canais atingido" };
	}

	const supabase = await createClient();
	const { error } = await supabase.from("channels").insert({
		account_id: session.account.id,
		name: parsed.data.name,
	});

	if (error) {
		return { error: "Falha ao criar canal" };
	}

	return { ok: true };
}
```

### Caso de uso: protecao contra troca indevida de conta (IDOR)

Use o mesmo padrao de `switchAccountAction`: validar input com Zod, consultar RPC com contexto do usuario e retornar `Forbidden` quando nao houver acesso.

Boas praticas:

- Sempre validar input no server (Zod)
- Rebuscar sessao na propria action
- Nao confiar em `account_id` vindo do client
- Deixar RLS + RPC serem a camada final de enforcement

---

## 3) API Routes / Route Handlers

### Caso de uso: endpoint autenticado com token/session check

```ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
	const supabase = await createClient();
	const {
		data: { user },
		error,
	} = await supabase.auth.getUser();

	if (error || !user) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	return NextResponse.json({ ok: true, userId: user.id });
}
```

### Caso de uso: callback de autenticacao com refresh/set de sessao

No projeto, `src/app/auth/callback/route.ts` ja cobre:

- `exchangeCodeForSession(code)`
- fallback `verifyOtp({ token_hash, type })`
- `setSession({ access_token, refresh_token })` no `POST`
- redirect seguro com `getSafeRedirectPath`

### Middleware de autenticacao e refresh automatico

No projeto, `src/proxy.ts` delega para `updateSession(request)` em `src/lib/supabase/proxy.ts`.

Esse fluxo usa `supabase.auth.getClaims()` e controla:

- request nao autenticado fora de rotas publicas -> redirect para `/login`
- usuario autenticado tentando abrir rota de auth -> redirect para `next` seguro
- excecao para `/confirmar` e fluxo de recovery update

Boas praticas:

- Tratar handlers como backend publico: validacao e auth obrigatorias
- Usar `NextResponse.json` com codigos HTTP corretos
- Evitar retornar detalhes sensiveis em erro de auth

---

## 4) Client Components

### Caso de uso: hook customizado com loading e erro

```tsx
"use client";

import { useEffect, useState } from "react";

type ProfileSummary = { name: string; email: string };

export function useProfileSummary() {
	const [data, setData] = useState<ProfileSummary | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		let active = true;

		async function load() {
			try {
				const response = await fetch("/api/profile/summary");
				if (!response.ok) {
					throw new Error("Falha ao carregar perfil");
				}

				const json = (await response.json()) as ProfileSummary;
				if (active) {
					setData(json);
					setError(null);
				}
			} catch {
				if (active) {
					setError("Nao foi possivel carregar dados da sessao");
				}
			} finally {
				if (active) {
					setLoading(false);
				}
			}
		}

		void load();
		return () => {
			active = false;
		};
	}, []);

	return { data, loading, error };
}
```

### Caso de uso: leitura de sessao + controle de acesso

```tsx
"use client";

import { useMemo } from "react";
import { useSession } from "@/hooks/use-session";
import { useAccessControl } from "@/hooks/use-access-control";

export function SessionBadge() {
	const session = useSession();
	const { hasPermission } = useAccessControl();

	const canManageUsers = useMemo(() => {
		return hasPermission("users", "update");
	}, [hasPermission]);

	return (
		<div>
			<p>{session.user.name}</p>
			<p>{canManageUsers ? "Pode gerenciar usuarios" : "Acesso limitado"}</p>
		</div>
	);
}
```

### Caso de uso: atualizacao otimista apos mutation

```tsx
"use client";

import { useTransition } from "react";
import { useSessionContext } from "@/components/session-provider";
import { createDealAction } from "@/lib/deals/actions";

export function CreateDealButton() {
	const { setSession } = useSessionContext();
	const [pending, startTransition] = useTransition();

	function handleClick() {
		startTransition(async () => {
			const result = await createDealAction();
			if (result?.ok) {
				setSession((prev) => ({
					...prev,
					usage: {
						...prev.usage,
						deals_count: (prev.usage.deals_count ?? 0) + 1,
					},
				}));
			}
		});
	}

	return (
		<button type="button" onClick={handleClick} disabled={pending}>
			{pending ? "Criando..." : "Nova oportunidade"}
		</button>
	);
}
```

Boas praticas:

- `useSession()` e `useAccessControl()` apenas dentro de `SessionProvider`
- Mostrar estado `pending` para interacoes assincronas
- Atualizacao otimista e para UX, nao para seguranca

---

## 5) Forms

### Caso de uso: submit com validacao de sessao e dados

```tsx
"use client";

import { useActionState } from "react";
import { submitSensitiveFormAction } from "@/lib/forms/actions";

const initialState = { error: "", ok: false };

export function SensitiveForm() {
	const [state, action, pending] = useActionState(
		submitSensitiveFormAction,
		initialState,
	);

	return (
		<form action={action}>
			<input name="title" />
			<button type="submit" disabled={pending}>
				{pending ? "Salvando..." : "Salvar"}
			</button>
			{state.error ? <p>{state.error}</p> : null}
		</form>
	);
}
```

```ts
"use server";

import { z } from "zod";
import { getSession, requireSession } from "@/lib/session";

const schema = z.object({ title: z.string().min(3) });

export async function submitSensitiveFormAction(
	_prev: { error: string; ok: boolean },
	formData: FormData,
) {
	const session = await getSession();
	requireSession(session);

	const parsed = schema.safeParse({
		title: formData.get("title"),
	});

	if (!parsed.success) {
		return { error: "Formulario invalido", ok: false };
	}

	return { error: "", ok: true };
}
```

### CSRF em formularios sensiveis

Com Server Actions e cookies `httpOnly` + `sameSite=lax`, voce ja reduz risco em fluxos padrao. Para operacoes de alto risco (ex.: billing, exclusao em massa), use token CSRF explicito:

1. gerar token no server e salvar em cookie assinado/expiravel
2. injetar token em campo hidden no form
3. na Server Action, validar igualdade token do cookie vs token do form
4. invalidar token apos uso (single-use)

Pseudo-exemplo de validacao:

```ts
const csrfFromForm = String(formData.get("csrf_token") ?? "");
const csrfFromCookie = cookies().get("csrf_token")?.value ?? "";

if (!csrfFromForm || csrfFromForm !== csrfFromCookie) {
	return { error: "CSRF token invalido", ok: false };
}
```

### Persistencia de dados durante erro de sessao

Para UX melhor:

- retorne erros estruturados (`fieldErrors`, `message`)
- mantenha os valores no form controlado pelo client
- quando receber `Unauthorized`, redirecione para login preservando `next`

---

## 6) Buttons e interacoes

### Caso de uso: botao com permissao + feature + limite

```tsx
"use client";

import { useAccessControl } from "@/hooks/use-access-control";

export function NewChannelButton() {
	const { hasPermission, hasFeature, isWithinLimit } = useAccessControl();

	const canCreate =
		hasFeature("channels") &&
		hasPermission("channels", "create") &&
		isWithinLimit("channels");

	return (
		<button type="button" disabled={!canCreate} aria-disabled={!canCreate}>
			Novo canal
		</button>
	);
}
```

### Caso de uso: feedback explicito quando bloqueado

```tsx
"use client";

import { useAccessControl } from "@/hooks/use-access-control";

export function DealActionGuard() {
	const { hasPermission, isWithinLimit } = useAccessControl();

	if (!hasPermission("deals", "create")) {
		return <p>Voce nao tem permissao para criar oportunidades.</p>;
	}

	if (!isWithinLimit("deals")) {
		return <p>Limite do plano atingido. Faca upgrade para continuar.</p>;
	}

	return <button type="button">Nova oportunidade</button>;
}
```

Boas praticas:

- Use estado `disabled` para impedir clique acidental
- Exiba motivo do bloqueio (sem permissao, sem feature, limite)
- Sempre repetir a validacao no server antes de gravar dados

---

## Mapa de decisoes rapidas

| Se voce precisa... | Use |
|---|---|
| Bloquear request antes de renderizar | `proxy.ts` / `updateSession()` |
| Ler sessao no server | `getSession()` |
| Garantir sessao obrigatoria no server | `requireSession()` |
| Checar permissao/feature/limite no server | `serverHasPermission`, `serverHasFeature`, `serverIsWithinLimit` |
| Ler sessao no client | `useSession()` |
| Checar acesso no client | `useAccessControl()` |
| Trocar conta ativa | `switchAccountAction()` |
| Sincronizar cookie de conta no primeiro mount | `syncSessionCookieAction()` |

---

## Checklist de seguranca (obrigatorio)

- Validar sessao no server em toda mutation sensivel
- Validar input com Zod em actions e handlers
- Confiar no RLS como enforcement final de dados
- Nao expor detalhes internos em mensagens de erro de auth
- Revisar impacto de multi-account (`causi_act`) em todo fluxo
- Para formularios criticos, adicionar CSRF token explicito

---

## Checklist de qualidade de UX

- Mostrar loading (`pending`) em botoes e submits
- Diferenciar visualmente bloqueio por permissao vs limite
- Evitar flicker usando redirects no server
- Aplicar atualizacao otimista somente quando fizer sentido
- Preservar `next` nos redirects para nao quebrar jornada

---

## Referencias internas

- `docs/implementations/session-context.md`
- `docs/implementations/auth.md`
- `docs/guides/nextjs.md`
- `src/lib/session/get-session.ts`
- `src/lib/session/server-checks.ts`
- `src/lib/session/actions.ts`
- `src/lib/supabase/proxy.ts`
- `src/components/session-provider.tsx`
- `src/hooks/use-session.ts`
- `src/hooks/use-access-control.ts`

