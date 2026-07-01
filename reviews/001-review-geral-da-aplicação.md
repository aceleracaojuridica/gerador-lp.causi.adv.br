# Revisão Técnica — Branch `feature/darlley`

> **Branch:** `feature/darlley` → `master` | **Data:** 2026-06-29  
> **Commits:** `98cd40b` (feature auth) · `a976087` (alterações) · `fe5d15a` (teste com bug)

---

## Resumo rápido — o que mudou e por quê

| # | O que estava errado | O que foi alterado | Arquivos-chave |
|---|--------------------|--------------------|----------------|
| 1 | Qualquer usuário logado acessava o gerador sem ter o plano | Sessão agora consulta RPC do Causi e verifica plano antes de qualquer rota | `lib/session/get-session.ts`, `lib/session/require-session.ts`, `lib/session/access.ts` |
| 2 | `/nova` não tinha nenhuma proteção de acesso | Adicionado `requireLpAccess()` em todas as páginas sensíveis | `app/nova/page.tsx`, `app/page.tsx`, `app/dashboard/page.tsx` |
| 3 | Salvar/excluir LP e configurações usavam `fetch()` para Route Handlers sem validação de plano | Substituídos por Server Actions com guard + `revalidatePath` | `app/actions/lps.ts`, `app/actions/config.ts` (novos); `app/api/lps/`, `app/api/config/` (removidos) |
| 4 | `lib/config.ts` lia/escrevia na tabela errada (`user_config`) com o cliente errado (`supabaseServer`) | Migrado para `user_settings` com `lpAdmin()` (service_role do Projeto B) | `lib/config.ts` |
| 5 | Dashboard buscava leads via subdomínio em dois passos (query indireta, campo nullable) | Query direta em `leads_gerador` por `causi_user_id` | `app/dashboard/page.tsx` |
| 6 | Não havia layout global — cada página tinha sua própria lógica de sidebar | `AppShell` + `AppSidebar` injetados no `app/layout.tsx` | `components/ui/AppShell.tsx`, `components/ui/AppSidebar.tsx` (novos) |
| 7 | Formulário avançava com WhatsApp e e-mail inválidos (qualquer string não-vazia) | Validação real: WhatsApp com 13 dígitos, e-mail com regex | `components/builder/NovaLpForm.tsx` |

---

## Banco de Dados — Dois Projetos Supabase

O sistema opera com **dois projetos Supabase independentes**. Confundir qual cliente usar em qual banco é uma das causas dos bugs corrigidos nesta branch.

### Os dois projetos

| | Projeto A — Causi | Projeto B — Gerador |
|---|---|---|
| **Função** | Autenticação, billing, planos, contas | LPs, leads, configurações do usuário |
| **Banco** | `auth.*`, `billing.*`, `public.*` do Causi | `public.*` do Gerador |
| **Quem acessa** | `supabaseServer()` — JWT do usuário logado | `lpAdmin()` — service_role fixo |
| **Variável de env** | `NEXT_PUBLIC_SUPABASE_URL` + `ANON_KEY` | `LP_SUPABASE_URL` + `LP_SERVICE_ROLE_KEY` |
| **Escopo de dados** | Por `auth.uid()` via RLS | Por `causi_user_id` (text) no WHERE |

**Por que service_role no Projeto B?** O Projeto B não tem sessão JWT própria — o usuário se autentica só no Causi. Usar service_role e filtrar manualmente por `causi_user_id` é o equivalente a RLS sem precisar configurar JWT cross-project.

---

### Projeto A — Causi (referência em `supabase/reference/causi/schema.sql`)

O código do gerador **nunca escreve** no Projeto A. Só lê, via RPC, os dados de billing:

```
billing.plans          → planos disponíveis (id, slug, tier_level, features jsonb)
billing.subscriptions  → assinaturas ativas por conta (status, plan_id)
billing.payments       → histórico de pagamentos
public.accounts        → conta da empresa do usuário
public.users           → usuário do Causi (auth.users espelhado)
```

A leitura é feita exclusivamente via **RPC `get_current_user_details_v4`**, que retorna em uma única chamada: conta, assinatura ativa, plano e features. As tabelas de billing não são expostas via PostgREST (sem endpoint REST direto).

---

### Projeto B — Gerador (migrations em `supabase/migrations/`)

#### Estado anterior — o que existia e o que estava errado

Antes das migrations desta branch, o Projeto B tinha esta estrutura problemática:

```
public.profiles         ← tabela do Lovable; o gerador estava ABUSANDO dela
  ├─ id (uuid)
  ├─ subdomain (text)
  └─ pages (jsonb)       ← ❌ o gerador guardava LPs aqui em vez de tabela própria
                           Array de objetos {slug, name, tema, schema}
                           Impossível indexar, filtrar por LP ou paginar

public.users            ← espelho local do usuário Causi
  ├─ causi_user_id (text)
  └─ plan (text)         ← ❌ coluna 'plan' usada para autorização
                           Mas plano real vem de billing.subscriptions no Causi,
                           não daqui — estava sempre desatualizado

public.user_config      ← configurações do usuário (tabela antiga)
  ├─ user_id (uuid)      ← ❌ coluna errada; deveria ser causi_user_id
  └─ fonts, tags, domain ← ❌ tudo em JSONB flat (sem índice, sem tipagem)

public.lps              ← tabela de LPs legada
  ├─ causi_user_id (text)
  └─ slug                ← ❌ único por usuário (causi_user_id + slug)
                           Dois usuários podiam ter LP com o mesmo slug
                           Causava conflito na URL pública futura

public.leads_gerador    ← leads capturados pelas LPs
  └─ client_slug         ← referência ao subdomínio, campo frequentemente vazio

```

O gerador salvava LPs em dois lugares diferentes dependendo do fluxo: ora em `lps`, ora dentro de `profiles.pages` (coluna JSONB herdada do Lovable). Não havia DDL oficial da tabela `lps` — ela existia no banco mas nunca estava documentada nas migrations.

#### Migrations aplicadas nesta branch (em ordem)

**`0-initital.sql`** — schema inicial (ponto de partida documentado)

Formaliza o que existia: `profiles`, `users`, `user_settings`, `leads`. Adiciona RLS em `profiles` e `leads`. Adiciona trigger `set_updated_at()` e função `ensure_user_exists()` (para criar usuário automaticamente ao gravar `user_settings`).

---

**`20260629130000_refactor_structure.sql`** — reorganização da estrutura

Refactoring do schema inicial com constraints mais claras e definições alinhadas ao modelo dual-database. Sem alterações destrutivas.

---

**`20260629140000_migrate_legacy_lps_and_leads.sql`** — migração de dados legados

Migra dados das tabelas antigas para o formato novo e as remove:

```
lps         → profiles.pages  (merge: LPs existentes entram no jsonb do Lovable)
leads_gerador → leads         (formato Lovable: nome/telefone/subdomain)

DROP TABLE leads_gerador;
DROP TABLE lps;
```

---

**`20260629150000_gerador_landing_pages_and_drop_users.sql`** — tabela própria de LPs + remoção de `users`

Cria `gerador_landing_pages` como tabela dedicada (saindo do jsonb de `profiles.pages`):

```sql
CREATE TABLE public.gerador_landing_pages (
  id             uuid PRIMARY KEY,
  causi_user_id  text NOT NULL,          -- usuário dono
  profile_id     uuid NULL,              -- vínculo opcional com Lovable
  slug           text NOT NULL,
  name           text,
  tema           text,
  schema         jsonb,                  -- JSON da LP gerada
  created_at     timestamptz,
  updated_at     timestamptz
  -- UNIQUE: (causi_user_id, slug) ← por usuário neste momento
);
```

Migra os dados de `profiles.pages` e de `lps` para a nova tabela. Remove a coluna `pages` de `profiles` (o Lovable não usa mais). Remove `public.users` — a identidade vem exclusivamente da RPC do Causi, não de espelho local.

---

**`20260629160000_gerador_lp_storage_bucket.sql`** — bucket de mídias

Cria o bucket `gerador-lp-assets` no Supabase Storage com leitura pública:

```
Estrutura de pastas dentro do bucket:
  {subdomain}.causi.adv.br/{lp-slug}/logo/logo.webp
  {subdomain}.causi.adv.br/{lp-slug}/lawyers/{id}.webp
  {subdomain}.causi.adv.br/{lp-slug}/sections/{hero|dor|sobre|solucao}.webp

  Sem subdomínio vinculado:
  _sem-subdominio/{causi_user_id}/{lp-slug}/...
```

Limite de 10 MB por arquivo. Tipos permitidos: JPEG, PNG, WebP, GIF, SVG.

---

**`20260629170000_templates_and_publish.sql`** — template, status e slug global

Adiciona colunas e muda a constraint de unicidade do slug:

```sql
ALTER TABLE gerador_landing_pages
  ADD COLUMN template_id  TEXT DEFAULT 'classic-light',
  ADD COLUMN status       TEXT DEFAULT 'draft',      -- 'draft' | 'published'
  ADD COLUMN published_at TIMESTAMPTZ;

-- ANTES: UNIQUE (causi_user_id, slug) — slug único por usuário
-- ❌ permitia dois usuários com slug idêntico → URL pública ambígua

-- Resolve colisões existentes antes de migrar (slug-2, slug-3...)
-- e troca para:
ALTER TABLE gerador_landing_pages
  ADD CONSTRAINT gerador_landing_pages_slug_uk UNIQUE (slug);
-- DEPOIS: UNIQUE (slug) — slug único globalmente
```

---

**`20260629180000_rename_landing_pages.sql`** — renomeia tabela

```sql
ALTER TABLE public.gerador_landing_pages RENAME TO landing_pages;
-- Renomeia constraints e índices junto.
```

---

#### Estado final — o que existe agora no Projeto B

```
public.profiles         ← Lovable (intocado, sem coluna pages)
  ├─ id (uuid)
  └─ subdomain (text)

public.user_settings    ← configurações globais por usuário
  ├─ causi_user_id (text UNIQUE) ← chave de escopo
  ├─ heading_font (text)
  ├─ body_font (text)
  ├─ tracking_tags (jsonb)       ← {head, body, footer}
  └─ custom_domain (text)

public.landing_pages    ← LPs do gerador (tabela final)
  ├─ id (uuid)
  ├─ causi_user_id (text)        ← dono da LP
  ├─ profile_id (uuid NULL)      ← vínculo opcional com Lovable
  ├─ slug (text UNIQUE)          ← único globalmente
  ├─ name (text)
  ├─ tema (text)
  ├─ template_id (text)          ← preset de visual escolhido no wizard
  ├─ status (text)               ← 'draft' | 'published'
  ├─ published_at (timestamptz)
  ├─ schema (jsonb)              ← JSON completo gerado pelo GPT-4o
  ├─ created_at (timestamptz)
  └─ updated_at (timestamptz)    ← atualizado via trigger

public.leads            ← leads capturados (formato Lovable)
  ├─ id (bigint)
  ├─ nome (text)
  ├─ telefone (text)
  ├─ page_url (text)
  ├─ subdomain (text)            ← filtro de acesso via RLS
  └─ created_at (timestamptz)

storage.gerador-lp-assets  ← imagens das LPs (público, 10 MB/arquivo)
```

**Tabelas removidas nesta branch:** `public.lps`, `public.leads_gerador`, `public.users`, coluna `profiles.pages`.

---

## Alteração 1 — Sessão não verificava plano

### O que estava errado

`getSession()` só chamava `supabase.auth.getUser()`. O campo `features` era **hardcoded**:

```typescript
// lib/session/get-session.ts — ANTES
return {
  user: { id: user.id, name: ..., email: ... },
  account: { id: user.id, name: ... },
  features: {
    landing_pages: true,  // hardcoded — qualquer usuário logado tinha acesso
  },
};
```

O próprio código tinha um comentário pendente:

```
// Fase 2 (quando a RPC do Causi estiver pronta): chamar
//   get_current_user_details_v4 para obter account_id real e features do plano.
```

Isso significa que nunca houve bloqueio real por plano. Qualquer conta autenticada entrava no gerador e podia criar LPs.

### O que foi alterado

`getSession()` agora chama a RPC `get_current_user_details_v4` do Causi após autenticar e enriquece a sessão com conta, plano e features reais:

```typescript
// lib/session/get-session.ts — DEPOIS
const { data } = await supabase.rpc("get_current_user_details_v4").maybeSingle();

// Se a RPC falhar ou não retornar, o usuário fica com plan: null
// e é bloqueado pelos guards normalmente.
return {
  ...session,
  account: { id: row.account_id, name: row.account_name },
  plan: {
    id: sub.plan_id,       // ex: 9 (Landing Pages)
    name: sub.plan_name,
    slug: sub.plan_slug,
    tierLevel: sub.plan_tier_level,
    status: sub.status,
  },
  features: row.plan_features ?? {},
};
```

O tipo `Session` em `lib/session/types.ts` ganhou os campos `plan: SessionPlan | null` e `features: Record<string, boolean>`.

Foi criado `lib/session/access.ts` com as constantes de controle:

```typescript
export const LP_PLAN_ID = 9;  // billing.plans.id do plano Landing Pages
export const CAUSI_APP_URL = process.env.NEXT_PUBLIC_CAUSI_APP_URL ?? "https://app.causi.com.br";

export function hasLpAccess(session: Session | null): boolean {
  return session?.plan?.id === LP_PLAN_ID;
}
```

---

## Alteração 2 — Páginas sem guard de acesso

### O que estava errado

Cada página fazia sua própria checagem de autenticação de forma inconsistente, e nenhuma verificava plano:

```typescript
// app/page.tsx — ANTES (só verifica login, não plano)
const session = await getSession();
if (!session) redirect("/login");

// app/nova/page.tsx — ANTES (sem proteção nenhuma)
export default function Page() {
  return <NovaLpForm />;
}

// app/dashboard/page.tsx — ANTES (autenticação manual, sem plano)
const { data: { user } } = await supabase.auth.getUser();
if (!user) redirect("/login");
```

### O que foi alterado

Criados dois guards em `lib/session/require-session.ts` para os dois contextos diferentes:

```typescript
// Para Server Components / páginas — redireciona
export async function requireLpAccess(): Promise<Session> {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!hasLpAccess(session)) redirect(CAUSI_APP_URL);
  return session;
}

// Para Server Actions / Route Handlers — lança erro
export async function requireLpSession(): Promise<Session> {
  const session = await getSession();
  if (!session) throw new Error("UNAUTHENTICATED");
  if (!hasLpAccess(session)) throw new Error("FORBIDDEN");
  return session;
}
```

Todas as páginas foram atualizadas:

```typescript
// app/nova/page.tsx — DEPOIS
export default async function Page() {
  await requireLpAccess();  // redireciona se sem login ou sem plano
  return <NovaLpForm />;
}

// app/page.tsx — DEPOIS
const session = await requireLpAccess();  // retorna sessão com plano
const lps = await listLps(session.user.id);
```

A API de geração também foi atualizada — antes retornava sempre `401`, agora distingue os dois casos:

```typescript
// app/api/gerar-lp/route.ts — DEPOIS
user = await requireLpSession();
// ... se falhar:
const forbidden = err instanceof Error && err.message === "FORBIDDEN";
return Response.json(
  { error: forbidden ? "Sem acesso ao gerador." : "Não autenticado." },
  { status: forbidden ? 403 : 401 },
);
```

---

## Alteração 3 — Route Handlers de CRUD sem validação de plano

### O que estava errado

Três Route Handlers existiam para operações internas (não eram APIs públicas expostas para terceiros):

- `GET /api/config` e `POST /api/config` — ler e salvar configurações globais
- `POST /api/lps/save` — salvar uma LP
- `POST /api/lps/delete` — excluir uma LP

Problemas concretos:
1. Nenhum deles verificava plano — só autenticação básica (ou nenhuma no caso do `GET /api/config`)
2. Os componentes faziam `fetch()` manual com `JSON.stringify`, sem tipagem de retorno
3. Excluir a LP não chamava `revalidatePath`, então a galeria não atualizava sem `router.refresh()` extra

```typescript
// components/builder/LpCard.tsx — ANTES
const res = await fetch("/api/lps/delete", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ slug }),
});
if (!res.ok) throw new Error();  // erro genérico, sem mensagem
router.refresh();  // refresh manual necessário
```

### O que foi alterado

Os três Route Handlers foram **removidos** e substituídos por Server Actions:

```
REMOVIDOS:
  app/api/config/route.ts
  app/api/lps/save/route.ts
  app/api/lps/delete/route.ts

CRIADOS:
  app/actions/config.ts  → getConfigAction(), saveConfigAction()
  app/actions/lps.ts     → saveLpAction(), deleteLpAction()
```

Cada Action valida plano antes de operar e retorna um tipo explícito:

```typescript
// app/actions/lps.ts
export type ActionResult = { ok: true } | { ok: false; error: string };

export async function deleteLpAction(slug: string): Promise<ActionResult> {
  try {
    userId = (await requireLpSession()).user.id;  // verifica plano
  } catch (err) {
    return { ok: false, error: toMessage(err, "Não autenticado.") };
  }
  await deleteLp(userId, slug);
  revalidatePath("/");  // galeria atualiza automaticamente
  return { ok: true };
}
```

```typescript
// components/builder/LpCard.tsx — DEPOIS
const res = await deleteLpAction(slug);
if (!res.ok) throw new Error(res.error);  // mensagem tipada
// router.refresh() não é mais necessário
```

> **Nota:** `POST /api/gerar-lp` **permanece como Route Handler**. É uma operação longa com GPT-4o que precisa de controle de timeout e resposta de streaming. Server Actions não são adequadas para isso.

---

## Alteração 4 — `lib/config.ts` lendo da tabela e banco errados

### O que estava errado

`lib/config.ts` usava `supabaseServer()` (cliente com JWT do Causi) para escrever no **Projeto B**. O Projeto B não conhece o JWT do Causi, então essa query dependia de RLS permissiva ou falhava silenciosamente. Além disso, a tabela usada era `user_config` com coluna `user_id`:

```typescript
// lib/config.ts — ANTES
const supabase = await supabaseServer();    // ❌ JWT do Causi, não funciona no Projeto B
const { data: { user } } = await supabase.auth.getUser();

const { data } = await supabase
  .from("user_config")                      // ❌ tabela antiga
  .select("fonts,tags,domain")              // ❌ campos JSONB flat
  .eq("user_id", user.id)                  // ❌ coluna antiga
```

### O que foi alterado

```typescript
// lib/config.ts — DEPOIS
const session = await getSession();    // ✅ sessão já resolvida

const { data } = await lpAdmin()       // ✅ service_role do Projeto B
  .from("user_settings")               // ✅ tabela correta
  .select("heading_font,body_font,tracking_tags,custom_domain")  // ✅ colunas dedicadas
  .eq("causi_user_id", session.user.id)  // ✅ coluna correta
```

A nova tabela `user_settings` (descrita em `supabase/gerador.causi.sql`) tem colunas separadas por campo, o que permite queries parciais e índices futuros. A FK é para `public.users.causi_user_id`.

---

## Alteração 5 — Dashboard buscando leads em dois passos

### O que estava errado

O dashboard precisava de dois passos para mostrar leads:

```typescript
// app/dashboard/page.tsx — ANTES
// Passo 1: pega os subdomínios das LPs do usuário
const { data: lpsRows } = await supabase.from("lps").select("subdomain")
const subdomains = [...new Set(lpsRows.map(r => r.subdomain).filter(Boolean))]
// ↑ se nenhuma LP tiver subdomain preenchido, subdomains = [] e zero leads aparecem

// Passo 2: busca leads nesses subdomínios (no Projeto A!)
const { data } = await supabaseAdmin()
  .from("leads")               // ❌ tabela no Projeto A, não no Projeto B
  .in("subdomain", subdomains) // ❌ depende de subdomain não-nulo
```

Problemas: se nenhuma LP tivesse `subdomain` preenchido, o dashboard mostrava zero leads mesmo havendo dados. Usava `supabaseAdmin()` do Projeto A ao invés de `lpAdmin()` do Projeto B.

### O que foi alterado

```typescript
// app/dashboard/page.tsx — DEPOIS
const session = await requireLpAccess();  // inclui verificação de plano

const { data } = await lpAdmin()          // ✅ Projeto B
  .from("leads_gerador")                  // ✅ tabela correta
  .select("id,created_at,name,phone,page_url,client_slug")
  .eq("causi_user_id", session.user.id)   // ✅ direto, sem join de subdomínio
  .order("created_at", { ascending: false })
  .limit(2000)
```

---

## Alteração 6 — Sem layout global, sidebar era por página

### O que estava errado

Não havia um componente de layout compartilhado. O `app/layout.tsx` apenas envolvia `{children}` sem sidebar. Cada página que precisasse de sidebar teria que renderizá-la individualmente — o que levava a estados inconsistentes e código duplicado.

### O que foi alterado

`app/layout.tsx` agora envolve tudo em `AppShell`:

```tsx
// app/layout.tsx — DEPOIS
<body suppressHydrationWarning>
  <AppShell>{children}</AppShell>
</body>
```

`AppShell` (`components/ui/AppShell.tsx`) é um Client Component que lê `usePathname()` e suprime a sidebar nas rotas `/login` e `/auth/callback`. Em todas as outras rotas, a sidebar aparece automaticamente:

```tsx
export function AppShell({ children }) {
  const pathname = usePathname();
  const hideSidebar = ["/login", "/auth/callback"].some(p => pathname.startsWith(p));
  if (hideSidebar) return <>{children}</>;
  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
```

`AppSidebar` (`components/ui/AppSidebar.tsx`) é uma coluna de 60px com: logo (→ galeria), link para aulas, botão de configurações, link home (→ Causi) e avatar do usuário.

O botão de configurações abre `GlobalSettings` como modal. Para isso, `GlobalSettings` foi refatorado para aceitar controle externo via props:

```typescript
// components/builder/GlobalSettings.tsx — ANTES
// O componente sempre renderizava seu próprio botão de trigger
export function GlobalSettings() {
  const [open, setOpen] = useState(false);
  // ...botão hardcoded dentro
}

// DEPOIS — aceita ser controlado de fora (pelo sidebar) ou ser self-contained
export function GlobalSettings({ open: controlledOpen, onClose } = {}) {
  const controlled = controlledOpen !== undefined;
  // se controlled=true, não renderiza o botão interno
}
```

O `suppressHydrationWarning` no `<body>` foi adicionado para suprimir warnings causados por extensões de browser (LastPass, Grammarly, etc.) que injetam atributos no DOM antes do React hidratar.

---

## Alteração 7 — Formulário de nova LP aceitava dados inválidos

### O que estava errado

O wizard de 3 passos avançava com qualquer string não-vazia nos campos obrigatórios:

```typescript
// components/builder/NovaLpForm.tsx — ANTES
const temWhatsapp = whatsapp.length > 0       // "1" passava
const temEmail = email.trim().length > 0      // "a" passava

const podeAvancar =
  step === 1 ? temWhatsapp && temEmail : true  // endereço e redes sociais ignorados
```

Resultado: LPs chegavam ao GPT-4o com WhatsApp inválido (ex.: "11999") e o conteúdo gerado ficava sem número funcional de contato.

### O que foi alterado

```typescript
// components/builder/NovaLpForm.tsx — DEPOIS
const temWhatsapp = whatsapp.length === 13  // "55" + DDD (2) + 9 dígitos
const temEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
const temEndereco = !showAddress || addresses[0]?.address.trim().length > 0 || addresses[0]?.cidade.trim().length > 0
const temSocials = !showSocials || socials.some(s => s.url.trim().length > 0)

const podeAvancar =
  step === 1 ? temWhatsapp && temEmail && temEndereco && temSocials : true
```

Também foram adicionados `showMaps: boolean` em cada endereço e `showVideo: boolean` como estado separado, para que campos opcionais desabilitados não bloqueiem o avanço.

---

## Bug Ativo — Criação de LP Possivelmente Quebrada

O último commit (`fe5d15a`) tem mensagem "commit de teste para criação da lp que deu errado".

**O que aconteceu:** No commit de autenticação (`98cd40b`), os Route Handlers antigos foram removidos mas dois componentes ainda faziam `fetch()` para eles:

- `GlobalSettings.tsx` ainda chamava `fetch("/api/config")` para carregar a configuração
- `LpStudio.tsx` ainda chamava `fetch("/api/config")` para carregar as fontes no mount

Essas chamadas retornavam `404`, causando falha silenciosa ao abrir o editor. O último commit (`fe5d15a`) corrigiu essas referências, migrando para `getConfigAction()`.

**Status:** As referências residuais foram corrigidas no código, mas o fluxo completo de criação de LP (wizard → GPT → salvamento no Projeto B → redirect) **não foi testado end-to-end** após as correções. Esse é o ponto mais crítico a validar antes de fazer merge.

---

## Documentação de Schema Adicionada

| Arquivo | O que é |
|---------|---------|
| `supabase/causi.sql` | Schema de referência do Causi (Projeto A): tabelas `billing.plans`, `billing.subscriptions`, `billing.payments`. **Não executar — só leitura.** |
| `supabase/gerador.causi.sql` | Schema de referência do Projeto B: tabelas `public.users`, `public.user_settings`, `public.leads_gerador`. **Não executar.** |
| `supabase/example.json` | Registro real do plano Landing Pages no Causi: `id: 9`, `slug: "landing_pages"`, `tier_level: 3` |

O arquivo `supabase/migration.sql` (schema monolítico antigo, sem versionamento) foi **removido**.

---

## Pendências

| Item | Detalhe |
|------|---------|
| **Testar criação de LP end-to-end** | Fluxo mais crítico — wizard → GPT-4o → Projeto B → redirect. Não testado após o último commit |
| **`.env.local.example` removido** | O arquivo foi deletado nesta branch mas o README ainda manda o dev copiá-lo. Regressão de DX para novos desenvolvedores |
| **Endpoint de captura de leads** | `leads_gerador` existe no banco mas o endpoint público que recebe o form da LP pública e insere leads não apareceu nesta branch |
| **Middleware não verifica plano** | O middleware valida apenas se há cookie de sessão. A verificação de plano acontece nos guards server-side. Usuário sem plano pode fazer requests para `/api/gerar-lp` diretamente e só é bloqueado no handler |
| **Botão "Ajuda" no sidebar** | Renderizado em `AppSidebar` sem `onClick` — não faz nada |
| **`Editor.tsx` monolítico** | Aproximadamente 3.000 linhas. Esta branch não tocou na estrutura — só recebeu pequenos ajustes de imports |
