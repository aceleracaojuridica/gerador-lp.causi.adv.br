# 🚀 Guia Completo de Next.js 16 para Desenvolvedores

> **Versão de referência:** Next.js 16.x — App Router  
> **Última atualização da documentação consultada:** Março 2026  
> **Pré-requisito:** Familiaridade com React e JavaScript/TypeScript

---

## Sumário

1. [Estrutura de Arquivos](#1-estrutura-de-arquivos)
2. [Server Components vs Client Components](#2-server-components-vs-client-components)
3. [Funcionamento do Client-Side](#3-funcionamento-do-client-side)
4. [Funcionamento do Server-Side](#4-funcionamento-do-server-side)
5. [App Router, Componentes e Hooks Principais](#5-app-router-componentes-e-hooks-principais)
6. [Sistema de Cache](#6-sistema-de-cache)

---

## 1. Estrutura de Arquivos

O Next.js com App Router usa uma convenção de **sistema de arquivos como roteador**. Cada pasta dentro de `app/` representa um segmento de rota. Arquivos especiais dentro dessas pastas definem o comportamento da rota.

### Explicação dos Arquivos Especiais

| Arquivo | Função | Observação |
|---|---|---|
| `layout.tsx` | Wrapper persistente para um segmento. O root layout (`app/layout.tsx`) é **obrigatório** e deve renderizar `<html>` e `<body>`. | Não re-renderiza ao navegar entre rotas filhas |
| `page.tsx` | Define a UI pública de uma rota. Sem este arquivo, a pasta não cria uma rota acessível. | Server Component por padrão |
| `loading.tsx` | Fallback do `<Suspense>` enquanto dados são carregados (streaming). | Renderizado instantaneamente |
| `error.tsx` | Captura erros de runtime na rota e em seus filhos. Deve ser Client Component (`"use client"`). | Usa `Error Boundary` do React |
| `not-found.tsx` | Renderizado quando `notFound()` é chamado. | Personaliza o 404 |
| `route.ts` | Cria um endpoint de API (GET, POST, PUT, DELETE…). Não pode coexistir com `page.tsx` na mesma pasta. | Route Handler |
| `proxy.ts` | Executa código **antes** da requisição ser processada (renova sessão, redirecionamentos, rewrite de URL). Substitui o antigo `middleware.ts` no Next.js 16+. | Fica na raiz do projeto |
| `(pasta)/` | **Route Group**: organiza rotas sem afetar a URL. Útil para layouts compartilhados. | Parênteses excluem da URL |
| `[pasta]/` | **Dynamic Segment**: captura parâmetros dinâmicos. Ex: `/blog/[slug]` → `/blog/meu-post` | Acessado via `params.slug` |
| `[...pasta]/` | **Catch-all segment**: captura múltiplos segmentos. | `params.slug` vira um array |

---

## 2. Server Components vs Client Components

Esta é a distinção mais importante do Next.js moderno. A escolha errada impacta performance, segurança e funcionalidade.

### Comparativo Rápido

| Característica | Server Component (padrão) | Client Component (`"use client"`) |
|---|---|---|
| **Renderizado em** | Servidor | Servidor (HTML inicial) + Hidratado no cliente |
| **JavaScript enviado ao browser** | ❌ Nenhum | ✅ Sim |
| **Acesso a banco de dados/APIs** | ✅ Direto | ❌ Apenas via fetch |
| **Segredos / API Keys** | ✅ Seguro | ❌ Exposto ao cliente |
| **useState / useEffect** | ❌ Não permitido | ✅ Sim |
| **Event handlers (onClick, etc)** | ❌ Não | ✅ Sim |
| **APIs do browser (window, localStorage)** | ❌ Não | ✅ Sim |
| **Hooks customizados com estado** | ❌ Não | ✅ Sim |
| **async/await diretamente no componente** | ✅ Sim | ❌ Não |
| **Context providers** | ❌ Não pode ser provedor | ✅ Sim |

### Como funciona na prática

**Server Component** — padrão, sem diretiva:

```tsx
// app/products/page.tsx — Server Component (padrão)
// Roda SOMENTE no servidor. Zero JS enviado ao cliente.
async function ProductsPage() {
  // Pode acessar banco diretamente, sem API intermediária
  const products = await db.query('SELECT * FROM products')

  return (
    <main>
      <h1>Produtos</h1>
      {products.map(p => <div key={p.id}>{p.name}</div>)}
    </main>
  )
}

export default ProductsPage
```

**Client Component** — com diretiva `"use client"`:

```tsx
// components/AddToCartButton.tsx — Client Component
'use client'

import { useState } from 'react'

export default function AddToCartButton({ productId }: { productId: string }) {
  const [added, setAdded] = useState(false)

  return (
    <button onClick={() => setAdded(true)}>
      {added ? '✅ Adicionado!' : 'Adicionar ao carrinho'}
    </button>
  )
}
```

### Padrão de Composição (Server + Client)

O segredo é **manter a maior parte como Server Component** e isolar interatividade em pequenos "ilhas" de Client Components:

```tsx
// app/products/[id]/page.tsx — Server Component
import AddToCartButton from '@/components/AddToCartButton' // Client Component

async function ProductPage({ params }: { params: { id: string } }) {
  const { id } = await params
  const product = await fetchProduct(id) // busca no servidor

  return (
    <div>
      <h1>{product.name}</h1>
      <p>{product.description}</p>
      {/* Client Component encapsulado dentro do Server Component */}
      <AddToCartButton productId={product.id} />
    </div>
  )
}
```

> ⚠️ **Regra importante:** Um Server Component **pode** importar e renderizar um Client Component. Um Client Component **não pode** importar um Server Component diretamente — mas pode recebê-lo via `children` prop.

---

## 3. Funcionamento do Client-Side

### O que acontece no lado do cliente

O client-side no Next.js vai além do React tradicional. Envolve hidratação, prefetching inteligente e navegação sem recarregamento de página.

### Fluxo de renderização inicial

```
1. Usuário acessa /dashboard
       ↓
2. Servidor renderiza HTML estático + RSC Payload
       ↓
3. Browser recebe e exibe HTML (First Contentful Paint rápido)
       ↓
4. JavaScript de Client Components é baixado
       ↓
5. React hidrata o HTML estático (adiciona event listeners)
       ↓
6. App está totalmente interativa
```

**RSC Payload (React Server Component Payload):** É um formato binário compacto gerado pelo servidor que descreve a árvore de componentes e permite que o React reconcilie o DOM sem destruir o estado existente durante a navegação.

### Navegação Client-Side (após hidratação inicial)

Ao navegar com o componente `<Link>`, o Next.js realiza **soft navigation**:

```
Usuário clica em <Link href="/blog">
       ↓
1. Verifica Router Cache (memória do browser)
       ↓
2. Se não estiver em cache → fetch do RSC Payload do servidor
       ↓
3. React atualiza apenas os segmentos que mudaram
       ↓
4. Layouts persistentes NÃO são re-renderizados
       ↓
5. Scroll position e estado preservados
```

### Prefetching automático

O Next.js pré-busca rotas automaticamente quando um `<Link>` entra no viewport:

- **Rotas estáticas:** pré-busca o payload completo
- **Rotas dinâmicas:** pré-busca apenas o layout compartilhado
- **Next.js 15+:** prefetch de páginas está **desabilitado por padrão** — apenas layouts são prefetchados. Para habilitar: `<Link prefetch={true} href="/rota">`

### Streaming e Suspense

```tsx
// app/dashboard/page.tsx
import { Suspense } from 'react'
import SlowDataComponent from './SlowDataComponent'

export default function DashboardPage() {
  return (
    <div>
      <h1>Dashboard</h1>
      {/* HTML da página é enviado imediatamente */}
      {/* SlowDataComponent é streamado quando ficar pronto */}
      <Suspense fallback={<p>Carregando métricas...</p>}>
        <SlowDataComponent />
      </Suspense>
    </div>
  )
}
```

O arquivo `loading.tsx` cria automaticamente um `<Suspense>` para toda a rota.

---

## 4. Funcionamento do Server-Side

### Modos de renderização

O Next.js oferece diferentes estratégias de renderização, configuráveis por rota:

#### Static Rendering (SSG — padrão quando possível)

A rota é renderizada **em tempo de build**. O HTML gerado é servido de um CDN.

```tsx
// Renderização estática — padrão quando não há dados dinâmicos
export default async function BlogPage() {
  const posts = await fetch('https://api.example.com/posts').then(r => r.json())
  // fetch com cache implícito → renderiza em build time
  return <PostList posts={posts} />
}
```

#### Dynamic Rendering (SSR)

A rota é renderizada **a cada requisição**. Ativado automaticamente quando você usa cookies, headers, searchParams, ou desabilita o cache.

```tsx
import { cookies } from 'next/headers'

export default async function ProfilePage() {
  const cookieStore = await cookies() // Força dynamic rendering
  const token = cookieStore.get('auth-token')
  const user = await fetchUser(token?.value)

  return <Profile user={user} />
}

// Ou force manualmente:
export const dynamic = 'force-dynamic'
```

#### ISR (Incremental Static Regeneration)

Regenera páginas estáticas em background após um intervalo de tempo:

```tsx
// Revalida a cada 60 segundos
export const revalidate = 60

export default async function NewsPage() {
  const news = await fetch('https://api.example.com/news', {
    next: { revalidate: 60 } // ou configurado por fetch individual
  }).then(r => r.json())

  return <NewsList news={news} />
}
```

### Route Handlers (API Routes)

Substituem as `pages/api/` do Pages Router. Suportam todos os métodos HTTP:

```ts
// app/api/products/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category')

  const products = await db.getProducts({ category })
  return NextResponse.json(products)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const newProduct = await db.createProduct(body)
  return NextResponse.json(newProduct, { status: 201 })
}
```

### Server Actions

Funções assíncronas que rodam no servidor, chamáveis diretamente de Client Components. Eliminam a necessidade de criar endpoints de API para mutations:

```tsx
// app/actions.ts
'use server'

import { revalidatePath } from 'next/cache'

export async function createPost(formData: FormData) {
  const title = formData.get('title') as string
  await db.posts.create({ title })
  revalidatePath('/blog') // invalida o cache da rota
}
```

```tsx
// app/blog/new/page.tsx — Client Component que usa Server Action
'use client'
import { createPost } from '@/app/actions'

export default function NewPostPage() {
  return (
    <form action={createPost}>
      <input name="title" placeholder="Título do post" />
      <button type="submit">Publicar</button>
    </form>
  )
}
```

### Proxy

Roda **antes** de qualquer renderização, no Edge Runtime (ou Node.js). No Next.js 16+, o arquivo se chama `proxy.ts` (renomeado de `middleware.ts`) e a função exportada é `proxy()`:

```ts
// proxy.ts (na raiz do projeto)
import type { NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/proxy'

export async function proxy(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: ['/dashboard/:path*', '/api/admin/:path*'],
}
```

---

## 5. App Router, Componentes e Hooks Principais

### App Router — Convenções de Roteamento

O App Router suporta padrões avançados de roteamento:

```
app/
├── page.tsx                    → /
├── about/page.tsx              → /about
├── blog/
│   ├── page.tsx                → /blog
│   └── [slug]/page.tsx         → /blog/:slug
├── shop/
│   └── [...categories]/page.tsx → /shop/a/b/c
├── @modal/                     → Parallel Route (slot)
└── (.)photo/[id]/page.tsx      → Intercepting Route
```

**Rotas paralelas (`@slot`):** Renderizam múltiplas páginas simultaneamente no mesmo layout (ex: modal + conteúdo de fundo).

**Rotas interceptadas:** Permitem abrir uma rota em um contexto diferente (ex: foto em modal ao clicar na feed, mas URL direta abre a página completa).

---

### Componentes Built-in

#### `<Image>` — next/image

Substitui a tag `<img>` com otimizações automáticas:

```tsx
import Image from 'next/image'

// ✅ Use sempre que exibir imagens
export default function Avatar() {
  return (
    <Image
      src="/avatar.jpg"
      alt="Foto do usuário"
      width={200}
      height={200}
      priority            // carrega com alta prioridade (above the fold)
      placeholder="blur"  // exibe blur enquanto carrega
      blurDataURL="data:image/jpeg;base64,..."
    />
  )
}
```

**O que `<Image>` faz automaticamente:**
- Converte para WebP/AVIF
- Serve tamanhos responsivos via `srcset`
- Lazy loading por padrão
- Previne Cumulative Layout Shift (CLS)
- Otimização via CDN Vercel ou servidor próprio

**Quando usar:** Em toda imagem do projeto. Evite `<img>` nativo.

---

#### `<Link>` — next/link

Substitui a tag `<a>` com navegação client-side e prefetching:

```tsx
import Link from 'next/link'

// Navegação simples
<Link href="/about">Sobre</Link>

// Com objeto de URL (query params)
<Link href={{ pathname: '/search', query: { q: 'nextjs' } }}>
  Buscar Next.js
</Link>

// Substituir history (sem voltar)
<Link href="/login" replace>Login</Link>

// Scroll para o topo ao navegar (padrão: true)
<Link href="/page" scroll={false}>Sem scroll</Link>

// Habilitar prefetch explícito (Next.js 15+: desabilitado por padrão)
<Link href="/heavy-page" prefetch={true}>Página pesada</Link>
```

**Quando usar:** Em toda navegação interna. Use `<a>` apenas para links externos.

---

#### `<Script>` — next/script

Controla carregamento de scripts de terceiros:

```tsx
import Script from 'next/script'

// afterInteractive: carrega após hidratação (padrão para analytics)
<Script src="https://analytics.example.com/script.js" strategy="afterInteractive" />

// lazyOnload: carrega no tempo ocioso (low priority)
<Script src="https://widget.example.com/chat.js" strategy="lazyOnload" />

// beforeInteractive: carrega antes da hidratação (crítico)
<Script src="/critical-polyfill.js" strategy="beforeInteractive" />
```

---

#### `<Form>` — next/form (Next.js 15+)

Estende o `<form>` HTML com client-side navigation para submits que resultam em nova página:

```tsx
import Form from 'next/form'

export default function SearchPage() {
  return (
    <Form action="/results">
      {/* Prefetch automático de /results ao entrar no viewport */}
      <input name="q" placeholder="Buscar..." />
      <button type="submit">Buscar</button>
    </Form>
  )
}
```

---

### Hooks Principais

#### `useRouter` — next/navigation

Navegação programática em Client Components:

```tsx
'use client'
import { useRouter } from 'next/navigation'

export default function LogoutButton() {
  const router = useRouter()

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })

    router.push('/login')        // navega para /login
    router.replace('/login')     // navega sem adicionar ao histórico
    router.back()                // volta no histórico
    router.forward()             // avança no histórico
    router.refresh()             // revalida dados da rota atual no servidor
    router.prefetch('/dashboard') // pré-busca uma rota
  }

  return <button onClick={handleLogout}>Sair</button>
}
```

> ⚠️ **Atenção:** `useRouter` deve ser importado de `next/navigation` (App Router), **não** de `next/router` (Pages Router).

---

#### `usePathname` — next/navigation

Retorna o pathname atual:

```tsx
'use client'
import { usePathname } from 'next/navigation'
import Link from 'next/link'

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/blog', label: 'Blog' },
  { href: '/about', label: 'Sobre' },
]

export default function Navbar() {
  const pathname = usePathname()

  return (
    <nav>
      {navLinks.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          className={pathname === href ? 'active' : ''}
        >
          {label}
        </Link>
      ))}
    </nav>
  )
}
```

---

#### `useSearchParams` — next/navigation

Lê query parameters da URL de forma reativa:

```tsx
'use client'
import { useSearchParams } from 'next/navigation'

export default function SearchResults() {
  const searchParams = useSearchParams()
  const query = searchParams.get('q')     // ?q=nextjs → "nextjs"
  const page = searchParams.get('page')   // ?page=2 → "2"

  return <div>Buscando por: {query}</div>
}
```

> ⚠️ Componentes usando `useSearchParams` devem ser envolvidos com `<Suspense>` no Server Component pai, pois tornam a página dinâmica.

---

#### `useParams` — next/navigation

Lê parâmetros dinâmicos da rota:

```tsx
'use client'
import { useParams } from 'next/navigation'

// Para a rota app/blog/[slug]/[id]/page.tsx
export default function BlogPost() {
  const params = useParams<{ slug: string; id: string }>()
  // params.slug, params.id disponíveis

  return <div>Post: {params.slug}</div>
}
```

---

#### `useFormStatus` e `useFormState` — react-dom

Para feedbacks de Server Actions:

```tsx
'use client'
import { useFormStatus } from 'react-dom'

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <button type="submit" disabled={pending}>
      {pending ? 'Enviando...' : 'Enviar'}
    </button>
  )
}
```

---

#### Acessando dados de rota em Server Components

Em Server Components, `params` e `searchParams` chegam como **Promises** (Next.js 16):

```tsx
// app/blog/[slug]/page.tsx
export default async function BlogPost({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ tab?: string }>
}) {
  const { slug } = await params
  const { tab } = await searchParams

  const post = await fetchPost(slug)
  return <Article post={post} activeTab={tab} />
}
```

---

### Tabela de Quando Usar Cada Hook/Componente

| Recurso | Quando usar |
|---|---|
| `<Image>` | Toda imagem estática ou remota no projeto |
| `<Link>` | Toda navegação interna |
| `<Script>` | Scripts de terceiros (analytics, chat, etc.) |
| `<Form>` | Formulários de busca/filtro que navegam para nova URL |
| `useRouter` | Navegação programática (após ação do usuário) |
| `usePathname` | Destacar link ativo na navbar |
| `useSearchParams` | Ler filtros/paginação da URL |
| `useParams` | Ler segmentos dinâmicos em Client Components |

---

## 6. Sistema de Cache

O cache do Next.js tem **4 camadas independentes** que trabalham juntas. No Next.js 15+, o comportamento padrão mudou para **sem cache**, dando mais controle ao desenvolvedor.

### Visão Geral das 4 Camadas

```
Request          Server                      Browser
   │                │                           │
   │                ▼                           │
   │     ┌─────────────────────┐                │
   │     │  1. Request         │                │
   │     │     Memoization     │                │
   │     │  (por requisição)   │                │
   │     └─────────────────────┘                │
   │                │                           │
   │                ▼                           │
   │     ┌─────────────────────┐                │
   │     │  2. Data Cache      │                │
   │     │  (persistente,      │                │
   │     │   entre deploys)    │                │
   │     └─────────────────────┘                │
   │                │                           │
   │                ▼                           │
   │     ┌─────────────────────┐                │
   │     │  3. Full Route      │                │
   │     │     Cache           │                │
   │     │  (HTML + RSC        │                │
   │     │   gerado no build)  │                │
   │     └─────────────────────┘                │
   │                                            │
   │                             ┌──────────────┴──┐
   │                             │  4. Router Cache│
   │                             │  (memória do    │
   │                             │   browser,      │
   │                             │   por sessão)   │
   │                             └─────────────────┘
```

---

### Camada 1: Request Memoization

**Escopo:** Uma única requisição do servidor  
**Duração:** Vida da requisição  
**Onde:** Memória do processo Node.js

Evita chamadas duplicadas à mesma URL dentro da mesma renderização de uma página. Usa `React.cache` internamente.

```tsx
// lib/user.ts
import { cache } from 'react'

// Mesmo chamado de múltiplos componentes na mesma requisição,
// o fetch é feito apenas UMA vez
export const getUser = cache(async (id: string) => {
  return fetch(`/api/users/${id}`).then(r => r.json())
})

// Componente A chama getUser('123')
// Componente B chama getUser('123') → retorna o mesmo resultado em cache
// → fetch real acontece apenas 1 vez
```

---

### Camada 2: Data Cache

**Escopo:** Entre requisições, entre deploys  
**Duração:** Até revalidação explícita  
**Onde:** Sistema de arquivos / edge (persistente)

Controla o comportamento do `fetch`:

```tsx
// ❌ Sem cache (padrão no Next.js 15+)
const data = await fetch('https://api.example.com/data')

// ✅ Cache permanente (equivalente ao SSG do Next.js 14)
const data = await fetch('https://api.example.com/data', {
  cache: 'force-cache'
})

// ✅ ISR — revalida a cada 60 segundos
const data = await fetch('https://api.example.com/data', {
  next: { revalidate: 60 }
})

// ✅ Cache com tag para revalidação sob demanda
const data = await fetch('https://api.example.com/posts', {
  next: { tags: ['posts'] }
})
```

**Revalidação sob demanda:**

```ts
// Em uma Server Action ou Route Handler
import { revalidateTag, revalidatePath } from 'next/cache'

// Invalida todos os fetches com a tag 'posts'
revalidateTag('posts')

// Invalida o cache de uma rota específica
revalidatePath('/blog')
```

---

### Camada 3: Full Route Cache

**Escopo:** Gerado em build time  
**Duração:** Até próximo deploy ou revalidação  
**Onde:** Servidor / CDN

Armazena o HTML renderizado + RSC Payload de rotas estáticas. É automaticamente invalidado quando o Data Cache é revalidado.

```tsx
// Controle por segmento de rota:

// Forçar renderização estática (SSG completo)
export const dynamic = 'force-static'

// Forçar renderização dinâmica (sem cache de rota)
export const dynamic = 'force-dynamic'

// ISR — revalida a rota completa a cada 30 segundos
export const revalidate = 30
```

---

### Camada 4: Router Cache

**Escopo:** Sessão do browser (por usuário)  
**Duração:** Sessão ativa  
**Onde:** Memória do browser (in-memory)

Armazena RSC Payloads já visitados para navegação instantânea. No Next.js 15+, **páginas não são pré-cacheadas** — apenas layouts compartilhados.

```tsx
'use client'
import { useRouter } from 'next/navigation'

// Forçar revalidação do Router Cache para a rota atual
const router = useRouter()
router.refresh() // Limpa o cache e rebusca do servidor
```

---

### `use cache` directive (Next.js 15+ experimental / 16 estável)

Nova forma granular de cachear partes específicas da aplicação:

```tsx
// Cachear uma função de busca de dados
async function getPosts() {
  'use cache'
  // Por padrão: 5min client stale, 15min server revalidate
  return db.posts.findMany()
}

// Cachear um componente inteiro
async function HeavyComponent() {
  'use cache'
  const data = await expensiveComputation()
  return <div>{data}</div>
}

// Cachear uma rota completa
export default async function Page() {
  'use cache'
  // ...
}
```

---

### Resumo das 4 Camadas

| Camada | Onde | Duração | Invalidar com |
|---|---|---|---|
| Request Memoization | Memória Node.js | 1 requisição | Automático |
| Data Cache | Servidor/CDN | Permanente (até revalidar) | `revalidateTag()`, `revalidatePath()` |
| Full Route Cache | Servidor/CDN | Até deploy/revalidação | Depende do Data Cache |
| Router Cache | Browser (memória) | Sessão ativa | `router.refresh()`, `revalidatePath()` |

### Fluxo de interações entre camadas

```
revalidateTag('posts')
       ↓
  Data Cache invalidado
       ↓
  Full Route Cache invalidado (pois depende dos dados)
       ↓
  Próxima visita → servidor re-renderiza
       ↓
  Router Cache do browser ainda válido até router.refresh()
```

---

## Boas Práticas Gerais

**Prefira Server Components.** Use Client Components apenas quando precisar de estado, eventos ou APIs do browser. Isso reduz o JavaScript enviado ao cliente e melhora performance.

**Isole interatividade.** Mova `"use client"` para os componentes folha mais específicos possíveis, não para layouts ou páginas inteiras.

**No Next.js 15+, cache é opt-in.** Ao contrário do v14, nada é cacheado por padrão. Seja explícito com `cache: 'force-cache'`, `next: { revalidate }` ou `'use cache'`.

**Use Server Actions para mutations.** Evite criar Route Handlers apenas para operações de escrita — Server Actions são mais simples, seguros e integrados com o sistema de revalidação.

**Prefira `revalidateTag` a `revalidatePath`.** Tags são mais granulares e evitam invalidações desnecessárias de cache.

**Use `<Suspense>` para streaming.** Quebre páginas com dados lentos em múltiplas fronteiras de Suspense para melhorar o Time to First Byte percebido.

---

*Guia baseado na documentação oficial do Next.js 15.x/16.x — [nextjs.org/docs](https://nextjs.org/docs)*
