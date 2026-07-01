# Plan: Auth – Implementação das Correções

## TL;DR
Plano de implementação das correções e melhorias identificadas na revisão do sistema de auth. Incorpora os comentários de revisão: 2 itens de segurança foram resolvidos/descartados, 3 itens precisam de verificação antes de agir, e o padrão correto de criação do cliente Supabase foi definido como `const supabase = createClient()` diretamente.

---

## Itens Resolvidos / Fora do Escopo

- **Security 2.2** (getClaims valida assinatura) — RESOLVIDO: `getClaims()` valida a assinatura JWT contra as chaves públicas do projeto. Nenhuma ação necessária.
- **Security 2.4** (hash na URL no hash-callback) — DESCARTADO: fluxo normal do Supabase. O token é de curta duração e o redirect ocorre logo em seguida.
- **Pattern 4.6** (barrel exports inconsistente no UpdatePasswordForm) — FORA DO ESCOPO: será revisado em uma etapa futura de padronização de exports.

---

## Fase 0: Verificações Pendentes

> Executar antes de implementar — os resultados determinam se os itens condicionais das fases seguintes são necessários.

**V1.** Verificar `src/components/auth/auth-form-shell.tsx` — confirmar se o `mt-6` está realmente ausente no footer div ou se já existe. *(Afeta: bug 3.4, melhoria 6.8)*

**V2.** Verificar `method="post"` nos forms — avaliar o risco de remover: se o JavaScript não carregar, um form sem `method="post"` faria GET e poderia expor a senha na URL. Confirmar se é o caso e se o risco justifica manter o atributo. *(Afeta: padrão 4.5, melhoria 6.7)*

**V3.** Avaliar email na URL no `SignInForm` — investigar se há alguma razão técnica ou UX para o email estar como query param na URL em vez de sessionStorage. Comparar com o padrão do `SignUpForm`. Se o risco for considerado não significativo, manter como está. *(Afeta: segurança 2.1, melhoria 6.5)*

---

## Fase 1: Correções de Bugs

**1.** `src/forms/ForgotPasswordForm/forgot-password.tsx` — Adicionar `try/catch/finally` ao `handleSubmit`. Mover `setIsSubmitting(false)` para o bloco `finally`. Referenciar o padrão do `SignUpForm` como modelo. *(Corrige bug 3.1)*

**2.** `src/forms/UpdatePasswordForm/update-password-form.tsx` — Mesmo fix que o passo 1. *(Corrige bug 3.1)*

**3.** *(Condicional — se V3 confirmar risco)* `src/forms/SignInForm/signin-form.tsx` — Substituir `email=<valor>` na URL por armazenamento em `sessionStorage` usando a chave `causi:signup-email`, alinhando ao padrão do `SignUpForm`. Atualizar a leitura do email no componente da view confirm-email em `/login`. *(Corrige segurança 2.1)*

**4.** *(Condicional — se V1 confirmar ausência)* `src/components/auth/auth-form-shell.tsx` — Adicionar `mt-6` ao footer div. *(Corrige bug 3.4)*

---

## Fase 2: Padronização de Código

> Os passos 5–9 são independentes entre si e podem ser executados em paralelo.

**5.** Criar `src/lib/search-params.ts` — Extrair a função `getParam()` e o tipo `SearchParams` que estão duplicados em 4 arquivos. Atualizar os imports em:
- `src/app/(auth)/login/page.tsx`
- `src/app/(auth)/cadastrar/page.tsx`
- `src/app/(auth)/confirmar/page.tsx`
- `src/app/(auth)/redefinir/page.tsx`
*(Elimina padrão 4.1 — 4x duplicação)*

**6.** Criar `src/components/auth/form-error-banner.tsx` — Extrair o banner de erro inline duplicado. Atualizar os 4 formulários para usar o componente compartilhado. *(Elimina padrão 4.4 — 4x duplicação)*

**7.** Padronizar criação do cliente Supabase — O padrão correto é `const supabase = createClient()` diretamente (sem `useState` ou `useMemo`). Atualizar:
- `src/forms/SignUpForm` — remover `useState(() => createClient())`
- `src/forms/ForgotPasswordForm` — remover `useMemo(() => createClient(), [])`
- `src/forms/UpdatePasswordForm` — remover `useMemo(() => createClient(), [])`
- `src/hooks/use-auth-email-resend.ts` — remover `useState(() => createClient())`
*(Elimina padrão 4.2)*

**8.** Padronizar `try/catch/finally` no `SignInForm` — atribuir o bloco completo de submit conforme o padrão do `SignUpForm`. *(Elimina padrão 4.3)*

**9.** `src/components/header/avatar-dropdown.tsx` (ou onde estiver `logoutAction`) — Substituir `router.push("/login")` por `router.replace("/login")` após logout. *(Melhoria 6.6)*

**10.** *(Condicional — se V2 confirmar que é seguro remover)* `src/forms/SignInForm/signin-form.tsx` e `src/forms/SignUpForm/signup-form.tsx` — Remover atributo `method="post"` das tags `<form>`. *(Melhoria 6.7)*

---

## Fase 3: Segurança

**11.** Avaliar rate limiting em `src/app/(auth)/confirmar/actions.ts` (`provisionFreeAccountAction`) — Verificar se existe um utilitário de rate limiting no projeto que possa ser aplicado aqui e também em outras Server Actions expostas. Se não existir, avaliar se criar um utilitário genérico faz sentido neste momento ou se deve ser deixado para uma task dedicada.

---

## Fase 4: Documentação

> Os passos 12–15 são independentes.

**12.** `docs/guides/auth.md` — Corrigir a descrição do fluxo do `SignInForm` na seção "email não confirmado": o redirect vai para `/login?status=confirm-email`, não para `/confirmar`. Documentar o repasse de `headers` no `setAll` do `server.ts`.

**13.** `docs/guides/auth.md` — Substituir blocos de código longos de componentes e forms por referências de arquivo (ex: `Implementação: src/forms/SignInForm/signin-form.tsx`). Manter apenas: trechos conceituais curtos, pseudocódigo, e funções pequenas e estáveis de segurança como `getSafeRedirectPath` e `buildAuthCallbackUrl`.

**14.** `docs/api/routes.md` — Adicionar as rotas faltantes:
- `/confirmar` — provisioning de conta gratuita
- `/auth/callback` — callback SSR (PKCE + OTP)
- `/auth/hash-callback` — recovery via hash fragment

**15.** `docs/architecture/overview.md` — Adicionar `/confirmar` na lista de rotas `(auth)/`.

**16.** `src/forms/SignUpForm/signup-form.tsx` — Alterar o default do `nextPath` de `"/onboarding"` para `"/dashboard"`. A rota `/onboarding` é planejada para o futuro; enquanto não existir, usar `/dashboard` como padrão. Não é necessário documentar `/onboarding` em `docs/api/routes.md` por enquanto.

---

## Arquivos Afetados

- `src/forms/ForgotPasswordForm/forgot-password.tsx` — try/catch/finally (passo 1)
- `src/forms/UpdatePasswordForm/update-password-form.tsx` — try/catch/finally (passo 2)
- `src/forms/SignInForm/signin-form.tsx` — email sessionStorage (cond.), padronização try/catch, supabase client, method="post" (cond.) (passos 3, 7, 8, 10)
- `src/forms/SignUpForm/signup-form.tsx` — supabase client, method="post" (cond.), nextPath default (passos 7, 10, 16)
- `src/hooks/use-auth-email-resend.ts` — supabase client (passo 7)
- `src/components/auth/auth-form-shell.tsx` — mt-6 (cond.) (passo 4)
- `src/components/auth/form-error-banner.tsx` — criar (passo 6)
- `src/lib/search-params.ts` — criar (passo 5)
- `src/app/(auth)/login/page.tsx` — imports (passo 5)
- `src/app/(auth)/cadastrar/page.tsx` — imports (passo 5)
- `src/app/(auth)/confirmar/page.tsx` — imports (passo 5)
- `src/app/(auth)/redefinir/page.tsx` — imports (passo 5)
- `src/app/(auth)/confirmar/actions.ts` — rate limiting (passo 11, se aplicável)
- `docs/guides/auth.md` — correções de fluxo + substituição de code blocks (passos 12, 13)
- `docs/api/routes.md` — rotas faltantes (passo 14)
- `docs/architecture/overview.md` — rota /confirmar (passo 15)

---

## Verificação

1. Após fase 1: testar `ForgotPasswordForm` e `UpdatePasswordForm` com Network offline no DevTools — confirmar que o botão não fica travado
2. Após fase 2 passo 5: confirmar que as 4 páginas de auth continuam recebendo searchParams corretamente
3. Após fase 2 passo 6: confirmar que o `FormErrorBanner` aparece corretamente em cada form com erro
4. Após fase 2 passo 9: confirmar que após logout não é possível navegar "de volta" com o botão Back do browser
5. Após fase 4: validar links cruzados nos docs e garantir que nenhuma referência quebrada foi deixada
