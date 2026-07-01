# Changelog — Plan 008: Auth Review

## 2026-04-08

### Sessão 1 — Implementação das Correções (Steps 1–16)

#### Arquivos criados
- `src/lib/search-params.ts` — utilitário compartilhado com `getParam()` e tipo `SearchParams`, eliminando 4× duplicação nas páginas de auth
- `src/components/auth/form-error-banner.tsx` — componente `FormErrorBanner` compartilhado, eliminando 4× markup inline duplicado

#### Arquivos modificados — Código

| Arquivo | Mudanças |
|---|---|
| `src/forms/ForgotPasswordForm/forgot-password.tsx` | Removido `useMemo`; supabase client → `createClient()` direto; `handleSubmit` envolto em `try/finally`; `setIsSubmitting(false)` movido para `finally`; `FormErrorBanner` substituiu banner inline |
| `src/forms/UpdatePasswordForm/update-password-form.tsx` | Mesmo padrão do `ForgotPasswordForm` (5 mudanças) |
| `src/forms/SignUpForm/signup-form.tsx` | `useState(() => createClient())` → `createClient()`; default `nextPath` `"/onboarding"` → `"/dashboard"`; `FormErrorBanner` substituiu banner inline |
| `src/forms/SignInForm/signin-form.tsx` | `handleSubmit` envolto em `try/catch`; `FormErrorBanner` substituiu banner inline |
| `src/hooks/use-auth-email-resend.ts` | `useState(() => createClient())` → `createClient()` |
| `src/components/atoms/avatar-dropdown.tsx` | `router.push("/login")` → `router.replace("/login")` pós-logout |
| `src/app/(auth)/login/page.tsx` | Import de `getParam`/`SearchParams` migrado para `@/lib/search-params` |
| `src/app/(auth)/cadastrar/page.tsx` | Mesmo — import migrado |
| `src/app/(auth)/confirmar/page.tsx` | Mesmo — import migrado |
| `src/app/(auth)/redefinir/page.tsx` | Mesmo — import migrado |

#### Arquivos modificados — Documentação

| Arquivo | Mudanças |
|---|---|
| `docs/guides/auth.md` | Corrigido fluxo SignInForm ("email not confirmed" → `/login?status=confirm-email`); adicionado repasse de `headers` no `setAll`; `nextPath` padrão corrigido para `"/dashboard"` |
| `docs/api/routes.md` | Adicionadas rotas faltantes: `/confirmar`, `/auth/callback`, `/auth/hash-callback` |
| `docs/architecture/overview.md` | Adicionado `/confirmar` na lista de rotas `(auth)/` e no diagrama de pastas |

#### Itens verificados (Fase 0)
- **V1** — `auth-form-shell.tsx` já tinha `mt-6` no footer div → step 4 pulado
- **V2** — `method="post"` mantido por segurança (form sem JS faria GET e exporia senha na URL)
- **V3** — email como query param no `SignInForm` mantido (risco considerado baixo)

#### Itens descartados / adiados
- **Step 11** — Rate limiting em `provisionFreeAccountAction`: sem utilitário existente no projeto → adiado para task dedicada
- **Step 13** — Refatoração de code blocks no `docs/guides/auth.md` → adiado (concluído na Sessão 2)
- **Pattern 4.6** — Barrel exports inconsistentes no `UpdatePasswordForm` → adiado para padronização futura

---

### Sessão 2 — Refatoração dos Code Blocks no `docs/guides/auth.md` (Step 13)

#### Arquivo modificado
- `docs/guides/auth.md`

#### Blocos removidos (substituídos por referências de arquivo)

| Seção | O que foi removido |
|---|---|
| 6 — `env.ts` | Schema Zod completo (~20 linhas) |
| 7.2 — `server.ts` | Implementação `createClient` server (~50 linhas) |
| 8 — Middleware | `updateSession()` com lógica de roteamento completa (~40 linhas) |
| 9.3 — `auth-toast.ts` | Implementação `showAuthEmailToast` (~20 linhas) |
| 10 — Constants | Arrays `AUTH_EMAIL_PROVIDERS`, `BRAZILIAN_STATES`, constantes `onboarding.ts` |
| 12.1 — `AuthPageShell` | JSX completo do componente |
| 12.2 — `AuthFormShell` | Interface + JSX completo do componente |
| 12.3 — `AuthAdvisorResendButton` | JSX do sub-componente |
| 12.4 — `AvatarDropdown` | JSX completo do componente |
| 13.1 — `SignInForm` | `handleSubmit` completo |
| 13.2 — `SignUpForm` | `handleSubmit` completo |
| 14 — `/cadastrar/page.tsx` | Implementação da feature flag |
| 15.1 — callback GET | Route handler GET completo (~40 linhas) |
| 15.2 — callback POST | Route handler POST completo |
| 15.3 — `hash-callback` | Client Component com `useEffect` completo |
| 16.1 — `ConfirmarPage` | Server Component de roteamento por `status` |
| 16.2 — `ConfirmarClient` | Client Component com `useReducer` completo (~40 linhas) |
| 16.3 — `ConfirmEmailClient` | Client Component completo |
| 16.4 — `provisionFreeAccountAction` | Server Action completa (~30 linhas) |

#### O que foi mantido deliberadamente
- Funções de segurança pequenas e estáveis: `getSafeRedirectPath`, `buildAuthCallbackUrl`, `getAuthErrorMessage`, `logoutAction`
- Exemplos pedagógicos genéricos: JWT anatomy, RSC vs Client Component, Zod pattern, composição Server+Client
- Diagramas de fluxo ASCII (Seções 8 e 17)
- `getClaims()` vs `getUser()` snippets (decisão de design crítica)
- Tabela de segurança (Seção 18) e FAQ (Seção 19)
- `AuthAdvisorType` / `AuthAdvisorProps` types (referência de API)
- `UseAuthEmailResendOptions` interface e padrão de timestamp absoluto
