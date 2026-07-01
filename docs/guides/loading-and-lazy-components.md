---
title: Loading, Suspense e Componentes Lazy
description: Guia prático para escolher e implementar estratégias de loading, streaming, lazy loading, dynamic imports e fallbacks no Next.js App Router
---

# Loading, Suspense e Componentes Lazy

Este guia explica quando usar cada estratégia de carregamento no Causi: `loading.tsx`, `React Suspense`, `next/dynamic`, componentes lazy, fallbacks locais e skeletons.

O objetivo é evitar dois problemas comuns:

1. Usar `Suspense` onde o `loading.tsx` resolveria melhor.
2. Usar `dynamic()` em componentes pequenos, adicionando complexidade sem ganho real.

---

## Resumo rápido

| Situação | Estratégia recomendada |
|----------|------------------------|
| Loading de uma rota ou segmento inteiro | `loading.tsx` |
| Loading de uma parte específica da página | `<Suspense fallback={...}>` |
| Componente pesado que não deve entrar no bundle inicial | `dynamic()` |
| Componente que depende de `window`, `document`, `canvas`, WebGL ou browser APIs | `dynamic(..., { ssr: false })` |
| Vários componentes lazy compartilhando o mesmo fallback | `dynamic(..., { suspense: true })` + `<Suspense>` |
| Um componente lazy isolado com skeleton próprio | `dynamic(..., { loading: () => ... })` |
| Dados carregados no Server Component | `async/await` no Server Component + `loading.tsx` ou `<Suspense>` |
| Dados carregados no Client Component sem Suspense | Estado local: `isLoading`, `isPending`, skeleton manual |
| Imagens | `next/image`, que já usa lazy loading por padrão |

---

## Regra mental

Antes de escolher uma estratégia, pergunte:

> O que está carregando: uma rota, uma seção, um componente pesado, dados ou um script externo?

Use esta regra:

- **Rota carregando** → `loading.tsx`
- **Seção carregando** → `<Suspense>`
- **Componente pesado carregando** → `dynamic()`
- **Componente browser-only** → `dynamic(..., { ssr: false })`
- **Mutation ou ação do usuário** → `useTransition`, `useFormStatus`, estado `isLoading` ou `isPending`
- **Script externo** → `next/script`

---

## Conceitos principais

### O que é loading?

Loading é qualquer estado temporário exibido enquanto algo ainda não está pronto.

Exemplos:

- A rota ainda está renderizando.
- Um componente grande ainda não foi baixado.
- Dados ainda estão sendo buscados.
- Uma Server Action ainda está processando.
- Um gráfico ainda não foi hidratado no cliente.

Um bom loading deve:

- Mostrar estrutura visual próxima da UI final.
- Evitar layout shift.
- Ser rápido de renderizar.
- Não depender de dados que ainda não existem.
- Não bloquear partes da tela que já poderiam aparecer.

---

### O que é fallback?

Fallback é a UI provisória exibida enquanto algo carrega.

Exemplos de fallback:

- Skeleton
- Spinner
- Texto "Carregando..."
- Card vazio com shimmer
- Placeholder de tabela
- Placeholder de gráfico

No Causi, prefira **skeletons estruturais** em vez de spinners genéricos sempre que possível.

Bom:

    <Card>
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-8 w-20" />
      <Skeleton className="h-48 w-full" />
    </Card>

Evite usar apenas:

    <p>Carregando...</p>

Use texto simples apenas em casos muito pequenos ou internos.

---

### O que é um componente lazy?

Um componente lazy é um componente que **não entra no bundle inicial** da página.

O JavaScript dele é separado em outro chunk e só é baixado quando o componente precisa aparecer.

Import estático:

```tsx
import HeavyChart from "./heavy-chart"

export function Dashboard() {
  return <HeavyChart />
}
```

Neste caso, `HeavyChart` entra no bundle da rota.

Import dinâmico:

```tsx
import dynamic from "next/dynamic"

const HeavyChart = dynamic(() => import("./heavy-chart"))

export function Dashboard() {
  return <HeavyChart />
}
```

Neste caso, `HeavyChart` vira um chunk separado.

---

## Estratégia 1 — `loading.tsx`

### O que é

`loading.tsx` é um arquivo especial do App Router do Next.js.

Ele define o fallback de carregamento para uma rota ou segmento de rota.

Exemplo:

  app/
    (app)/
      dashboard/
        page.tsx
        loading.tsx

Quando o usuário navega para `/dashboard`, o Next.js pode renderizar `loading.tsx` imediatamente enquanto o conteúdo real da rota ainda está sendo preparado.

---

### Quando usar

Use `loading.tsx` quando o loading representa uma **transição de página ou segmento**.

Casos recomendados:

- Dashboard principal.
- Página de conversas.
- Página de oportunidades.
- Página de pessoas.
- Página de configurações.
- Rotas que fazem data fetching server-side.
- Rotas protegidas que dependem de sessão no layout ou page.
- Rotas com Server Components que podem demorar.

---

### Quando não usar

Não use `loading.tsx` para:

- Loading de um único card.
- Loading de um modal.
- Loading de um gráfico específico.
- Loading de um botão após clique.
- Loading de uma mutation.

Nesses casos, use fallback local, `Suspense`, `useTransition`, `useFormStatus` ou estado local.

---

### Como usar

Crie um arquivo `loading.tsx` no mesmo segmento da rota.

Exemplo:

```tsx
// src/app/(app)/dashboard/loading.tsx

import { Skeleton } from "@/components/ui/skeleton"

export default function DashboardLoading() {
  return (
    <div className="flex h-full flex-col">
      <header className="border-b px-6 py-4">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="mt-3 h-9 w-64" />
      </header>

      <main className="space-y-6 p-6">
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>

        <Skeleton className="h-80 rounded-xl" />
      </main>
    </div>
  )
}
```

---

### Impacto

Vantagens:

- Melhor UX em navegações.
- Integração nativa com App Router.
- Funciona bem com streaming.
- Mostra algo rapidamente enquanto a rota carrega.
- Evita tela em branco.

Custos:

- Pode duplicar skeletons se você também colocar `Suspense` no mesmo nível.
- Se o skeleton for pesado demais, ele pode prejudicar a experiência.
- Não substitui fallbacks internos para widgets específicos.

---

### Recomendação para o Causi

Use `loading.tsx` para rotas principais dentro de `src/app/(app)` quando houver:

- Server Components.
- Data fetching no servidor.
- Checagem de sessão/permissão.
- Layout pesado.
- Experiência visual importante durante navegação.

Exemplos de bons candidatos:

- `src/app/(app)/dashboard/loading.tsx`
- `src/app/(app)/conversas/loading.tsx`
- `src/app/(app)/(oportunidades)/oportunidades/loading.tsx`

**Contatos (`/pessoas`, `/organizacoes`) — loading em duas fases:** enquanto o RSC da rota ainda não está pronto (sessão, `searchParams`, hidratação do shell), o utilizador vê o [`loading.tsx` padrão de `(app)`](../../src/app/(app)/loading.tsx) (logo Causi). Depois que o `page.client.tsx` monta, o fetch da listagem **não** bloqueia o shell: skeletons internos aparecem via `<Suspense fallback={<XxxTableSkeleton />}>` e no badge (`PersonsCount` / `OrganizationsCount`) até o `dataPromise` resolver. Ver [implementations/contacts.md](../implementations/contacts.md) secção 2.

---

## Estratégia 2 — `<Suspense fallback={...}>`

### O que é

`Suspense` é uma API do React usada para mostrar um fallback enquanto um componente filho ainda não está pronto.

Exemplo:

```tsx
import { Suspense } from "react"

export default function DashboardPage() {
  return (
    <main>
      <h1>Dashboard</h1>

      <Suspense fallback={<MetricsSkeleton />}>
        <MetricsSection />
      </Suspense>
    </main>
  )
}
```

---

### Quando usar

Use `Suspense` quando o loading é de uma **parte específica da interface**, não da rota inteira.

Casos recomendados:

- Uma seção de métricas.
- Um gráfico.
- Uma tabela.
- Um card que busca dados separadamente.
- Um componente importado dinamicamente.
- Vários componentes lazy que devem compartilhar o mesmo fallback.
- Streaming incremental de Server Components.

---

### Quando não usar

Evite `Suspense` quando:

- O fallback é da rota inteira. Prefira `loading.tsx`.
- O componente não suspende de fato.
- O loading vem de um `useEffect` com estado manual.
- O componente é pequeno e não há benefício em criar boundary.
- O fallback só adiciona complexidade visual.

Importante:

`Suspense` não aparece automaticamente para qualquer `useEffect` ou qualquer estado `isLoading`.

Este exemplo não usa Suspense de verdade:

```tsx
"use client"

export function UsersList() {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchUsers().finally(() => setIsLoading(false))
  }, [])

  if (isLoading) {
    return <UsersSkeleton />
  }

  return <UsersTable />
}
```

Neste caso, o loading é controlado manualmente pelo componente.

---

### Como usar com Server Components

Server Components podem buscar dados com `async/await`.

Você pode dividir a página em partes e envolver seções mais lentas com `Suspense`.

```tsx
import { Suspense } from "react"

export default function DashboardPage() {
  return (
    <main className="space-y-6">
      <DashboardHeader />

      <Suspense fallback={<MetricsSkeleton />}>
        <MetricsSection />
      </Suspense>

      <Suspense fallback={<ChartSkeleton />}>
        <ConversationsChart />
      </Suspense>
    </main>
  )
}

async function MetricsSection() {
  const metrics = await getMetrics()

  return <MetricsGrid metrics={metrics} />
}
```

Resultado:

- O header pode aparecer antes.
- A seção de métricas carrega quando estiver pronta.
- O gráfico carrega independentemente.

---

### Como usar com Client Components lazy

```tsx
"use client"

import { Suspense } from "react"
import dynamic from "next/dynamic"

const HeavyChart = dynamic(() => import("./heavy-chart"), {
  suspense: true,
})

export function DashboardCharts() {
  return (
    <Suspense fallback={<ChartSkeleton />}>
      <HeavyChart />
    </Suspense>
  )
}
```

---

### Impacto

Vantagens:

- Permite streaming de partes da página.
- Melhora percepção de velocidade.
- Evita bloquear a página inteira por uma seção lenta.
- Permite fallbacks diferentes por seção.
- Coordena carregamento de código e dados quando usado corretamente.

Custos:

- Mais boundaries significam mais complexidade.
- Fallbacks demais podem gerar uma experiência fragmentada.
- Usado sem necessidade, pode deixar a árvore difícil de entender.

---

### Recomendação para o Causi

Use `Suspense` para seções independentes e potencialmente lentas.

Exemplos:

- `MetricsSection`
- `ConversationsChart`
- `OriginsCard`
- `StageBreakdownCard`
- Tabelas grandes
- Cards que dependem de RPCs específicas
- Componentes importados via `dynamic()`

Evite colocar um único `Suspense` no `page.tsx` apenas para envolver uma página client-side inteira, se já existe `loading.tsx` para o segmento e não há streaming real no servidor.

---

## Estratégia 3 — `dynamic()` com `loading`

### O que é

`dynamic()` é a API do Next.js para importação dinâmica de componentes.

Com a opção `loading`, você define um fallback diretamente no próprio `dynamic()`.

```tsx
import dynamic from "next/dynamic"

const HeavyChart = dynamic(() => import("./heavy-chart"), {
  loading: () => <ChartSkeleton />,
})

export function Dashboard() {
  return <HeavyChart />
}
```

---

### Quando usar

Use `dynamic()` com `loading` quando:

- O componente é pesado.
- O componente é isolado.
- Ele tem um skeleton próprio.
- Você não precisa coordenar vários componentes com o mesmo fallback.
- Você quer menos boilerplate do que `Suspense`.

Exemplos:

- Um gráfico específico.
- Um editor de texto rico.
- Um mapa.
- Um modal raro.
- Um componente de calendário grande.

---

### Quando não usar

Evite `dynamic()` com `loading` quando:

- Vários componentes precisam compartilhar um único fallback.
- Você já está usando um boundary de `Suspense`.
- O componente é pequeno.
- O componente aparece sempre above the fold e é essencial para o primeiro paint.
- O componente poderia ser um Server Component sem JavaScript no cliente.

---

### Exemplo prático

```tsx
import dynamic from "next/dynamic"
import { ChartSkeleton } from "./chart-skeleton"

const ConversationsChart = dynamic(() => import("./conversations-chart"), {
  loading: () => <ChartSkeleton />,
})

export function ConversationsSection() {
  return (
    <section className="rounded-xl border bg-card">
      <header className="border-b px-6 py-4">
        <h2 className="text-sm font-medium">Conversas</h2>
      </header>

      <ConversationsChart />
    </section>
  )
}
```

---

### Impacto

Vantagens:

- Reduz o bundle inicial.
- Simples de implementar.
- Bom para componentes independentes.
- Evita criar `Suspense` manualmente.

Custos:

- Cada componente controla seu próprio fallback.
- Não coordena múltiplos lazy components.
- Pode gerar vários skeletons aparecendo em tempos diferentes.
- Se usado em excesso, fragmenta a experiência.

---

## Estratégia 4 — `dynamic()` com `suspense: true` + `<Suspense>`

### O que é

Nesta estratégia, o `dynamic()` informa ao Next.js que o carregamento do componente será controlado pelo `Suspense` do React.

```tsx
"use client"

import { Suspense } from "react"
import dynamic from "next/dynamic"

const HeavyChart = dynamic(() => import("./heavy-chart"), {
  suspense: true,
})

export function DashboardChart() {
  return (
    <Suspense fallback={<ChartSkeleton />}>
      <HeavyChart />
    </Suspense>
  )
}
```

---

### Quando usar

Use quando você quer que o fallback seja controlado por um boundary de `Suspense`.

Casos recomendados:

- Vários componentes lazy com um fallback compartilhado.
- Um componente lazy que também carrega dados via Suspense.
- Uma seção que deve aparecer inteira de uma vez.
- Você quer padronizar fallbacks por seção.
- Você já usa Suspense para streaming ou dados.

---

### Exemplo com fallback compartilhado

```tsx
"use client"

import { Suspense } from "react"
import dynamic from "next/dynamic"

const HeavyChart = dynamic(() => import("./heavy-chart"), {
  suspense: true,
})

const HeavyTable = dynamic(() => import("./heavy-table"), {
  suspense: true,
})

export function AnalyticsSection() {
  return (
    <Suspense fallback={<AnalyticsSkeleton />}>
      <HeavyChart />
      <HeavyTable />
    </Suspense>
  )
}
```

Neste caso, `AnalyticsSkeleton` cobre os dois componentes.

Com `dynamic(..., { loading })`, cada componente teria seu próprio fallback separado.

---

### Comparativo: `suspense: true` vs `loading`

| Critério | `dynamic()` + `suspense: true` + `<Suspense>` | `dynamic()` + `loading` |
|----------|-----------------------------------------------|--------------------------|
| Quem controla o fallback | React Suspense | Next dynamic |
| Fallback compartilhado | Sim | Não |
| Fallback por componente | Sim | Sim |
| Boilerplate | Maior | Menor |
| Composição com dados que suspendem | Melhor | Limitada |
| Melhor para | Seções compostas | Componentes isolados |

---

### Quando não usar

Evite esta estratégia quando:

- Só há um componente simples.
- O fallback é exclusivo daquele componente.
- Você não precisa de composição.
- O componente não é pesado.
- `dynamic(..., { loading })` resolveria com menos código.

---

## Estratégia 5 — `dynamic(..., { ssr: false })`

### O que é

`ssr: false` desativa a renderização server-side do componente.

Isso significa que o componente só será renderizado no browser.

```tsx
import dynamic from "next/dynamic"

const BrowserOnlyChart = dynamic(() => import("./browser-only-chart"), {
  ssr: false,
  loading: () => <ChartSkeleton />,
})
```

---

### Quando usar

Use `ssr: false` apenas quando o componente não consegue rodar no servidor.

Casos comuns:

- Usa `window`.
- Usa `document`.
- Usa `localStorage` durante render.
- Usa `canvas`.
- Usa WebGL.
- Usa bibliotecas que quebram em SSR.
- Depende de APIs exclusivas do browser.

Exemplos:

- Editor visual.
- Mapa interativo.
- Gráfico que acessa `window` no import.
- Widget externo.
- Player que depende do DOM.

---

### Quando não usar

Não use `ssr: false` por padrão.

Evite quando:

- O componente pode renderizar no servidor.
- O componente é importante para SEO.
- O componente aparece above the fold.
- O conteúdo inicial deveria estar no HTML.
- Você está usando apenas para "resolver erro" sem entender a causa.

`ssr: false` pode mascarar problemas e piorar a performance percebida.

---

### Impacto

Vantagens:

- Evita erros de SSR em bibliotecas browser-only.
- Reduz trabalho do servidor.
- Pode diminuir o bundle inicial renderizado na rota.

Custos:

- O HTML inicial não contém aquele componente.
- Pode causar layout shift se o fallback não tiver tamanho fixo.
- Pode piorar percepção de velocidade.
- Pode atrasar interatividade.
- Não deve ser usado em conteúdo essencial.

---

### Recomendação para o Causi

Use `ssr: false` com cautela.

Bons candidatos:

- Gráficos que dependam de browser APIs.
- Editores ricos.
- Modais muito pesados e raros.
- Integrações visuais externas.

Evite em:

- Header.
- Sidebar.
- Conteúdo textual principal.
- Cards simples.
- Listagens que poderiam ser Server Components.

---

## Estratégia 6 — Estado manual de loading em Client Components

### O que é

Nem todo loading precisa de `Suspense`.

Em Client Components, muitos carregamentos são controlados por estado local.

Exemplo:

```tsx
"use client"

import { useEffect, useState } from "react"

export function ChannelsList() {
  const [channels, setChannels] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadChannels() {
      try {
        const data = await getChannels()
        setChannels(data)
      } finally {
        setIsLoading(false)
      }
    }

    loadChannels()
  }, [])

  if (isLoading) {
    return <ChannelsSkeleton />
  }

  return <ChannelsGrid channels={channels} />
}
```

---

### Quando usar

Use estado manual quando:

- O carregamento acontece após interação do usuário.
- Você usa `useEffect`.
- Você usa uma lib sem Suspense.
- Você carrega dados client-side por escolha arquitetural.
- Você precisa controlar loading, erro e retry manualmente.

---

### Quando não usar

Evite estado manual quando:

- Os dados podem ser buscados no Server Component.
- A rota inteira depende desses dados.
- O usuário não precisa de interatividade para iniciar o fetch.
- O loading poderia ser melhor resolvido com `loading.tsx` ou streaming.

No Causi, prefira buscar dados iniciais no servidor quando possível, respeitando RLS e `account_id`.

---

### Impacto

Vantagens:

- Simples para casos interativos.
- Controle explícito.
- Bom para ações iniciadas pelo usuário.
- Funciona com qualquer Promise.

Custos:

- O HTML inicial não vem com os dados.
- Pode causar flicker.
- Pode duplicar lógica de erro/loading.
- Pode atrasar o conteúdo até a hidratação.

---

## Estratégia 7 — `useTransition`

### O que é

`useTransition` é um hook do React para marcar atualizações como não urgentes.

Ele é útil para navegações, filtros, refreshes e atualizações que podem mostrar um pending state sem bloquear a UI.

```tsx
"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

export function RefreshButton() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  return (
    <Button
      disabled={isPending}
      onClick={() => {
        startTransition(() => {
          router.refresh()
        })
      }}
    >
      {isPending ? "Atualizando..." : "Atualizar"}
    </Button>
  )
}
```

---

### Quando usar

Use `useTransition` quando:

- Você chama `router.refresh()`.
- Você muda filtros que atualizam a rota.
- Você navega programaticamente.
- Você quer mostrar pending sem travar a UI.
- Você quer evitar estados de loading manuais complexos.

---

### Quando não usar

Não use `useTransition` para:

- Loading inicial da rota.
- Skeleton de página inteira.
- Fetch manual simples que já possui `isLoading`.
- Server Action em formulário, quando `useFormStatus` resolver melhor.

---

## Estratégia 8 — `useFormStatus`

### O que é

`useFormStatus` é usado em formulários com Server Actions para saber se o formulário está enviando.

O hook deve ser usado dentro de um componente filho do `<form>`.

```tsx
"use client"

import { useFormStatus } from "react-dom"
import { Button } from "@/components/ui/button"

export function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Salvando..." : "Salvar"}
    </Button>
  )
}
```

Uso:

```tsx
import { SubmitButton } from "./submit-button"
import { saveProfileAction } from "./actions"

export function ProfileForm() {
  return (
    <form action={saveProfileAction}>
      <input name="name" />
      <SubmitButton />
    </form>
  )
}
```

---

### Quando usar

Use `useFormStatus` quando:

- O formulário usa Server Action.
- Você precisa desabilitar botão durante submit.
- Você quer alterar label do botão.
- Você quer mostrar loading dentro do formulário.

---

### Quando não usar

Não use para:

- Loading de rota.
- Loading de componente lazy.
- Fetch client-side sem `<form action={...}>`.
- Mutations que não usam formulário.

---

## Estratégia 9 — `next/image`

### O que é

O componente `Image` do Next.js já possui lazy loading por padrão para imagens fora da viewport.

```tsx
import Image from "next/image"

export function UserAvatar() {
  return (
    <Image
      src="/avatar.png"
      alt="Foto do usuário"
      width={40}
      height={40}
    />
  )
}
```

---

### Quando usar

Use `next/image` para imagens renderizadas pela aplicação.

Benefícios:

- Lazy loading automático.
- Otimização de tamanho.
- Prevenção de layout shift quando `width` e `height` são definidos.
- Melhor performance.

---

### Quando usar `priority`

Use `priority` apenas para imagens críticas above the fold.

    <Image
      src="/hero.png"
      alt="Imagem principal"
      width={1200}
      height={600}
      priority
    />

Não use `priority` em listas, avatares repetidos ou imagens abaixo da dobra.

---

## Estratégia 10 — `next/script`

### O que é

`next/script` controla o carregamento de scripts externos.

    import Script from "next/script"

    export function AnalyticsScript() {
      return (
        <Script
          src="https://example.com/analytics.js"
          strategy="afterInteractive"
        />
      )
    }

---

### Estratégias principais

| Estratégia | Quando usar |
|------------|-------------|
| `beforeInteractive` | Script crítico que precisa carregar antes da hidratação |
| `afterInteractive` | Script importante após a página ficar interativa |
| `lazyOnload` | Script não crítico, pode carregar em tempo ocioso |
| `worker` | Casos avançados, quando suportado e validado |

---

### Recomendação

Para scripts externos não críticos, prefira `lazyOnload`.

    <Script
      src="https://example.com/chat-widget.js"
      strategy="lazyOnload"
    />

Evite carregar scripts de terceiros diretamente em Client Components com `useEffect`, salvo necessidade específica.

---

## Como escolher na prática

### Fluxo de decisão

1. É uma rota ou segmento inteiro carregando?
   - Sim → use `loading.tsx`.
   - Não → continue.

2. É uma seção interna que pode carregar separadamente?
   - Sim → use `<Suspense fallback={...}>`.
   - Não → continue.

3. O componente é pesado e não precisa estar no bundle inicial?
   - Sim → use `dynamic()`.
   - Não → import estático.

4. O componente depende de browser APIs?
   - Sim → use `dynamic(..., { ssr: false })`.
   - Não → mantenha SSR quando possível.

5. Vários lazy components precisam compartilhar o mesmo skeleton?
   - Sim → use `dynamic(..., { suspense: true })` + `<Suspense>`.
   - Não → use `dynamic(..., { loading })`.

6. É uma ação do usuário?
   - Formulário com Server Action → use `useFormStatus`.
   - Refresh/navegação/filtro → use `useTransition`.
   - Fetch client-side manual → use estado `isLoading`.

---

## Padrões recomendados no Causi

### Padrão A — Página com Server Component e `loading.tsx`

Use para rotas principais protegidas.

Estrutura:

    src/app/(app)/dashboard/
      page.tsx
      loading.tsx
      client.page.tsx

Exemplo:

    // page.tsx

    import DashboardClientPage from "./client.page"

    export default async function DashboardPage() {
      return <DashboardClientPage />
    }

E o skeleton da rota fica em:

    // loading.tsx

    export default function DashboardLoading() {
      return <DashboardSkeleton />
    }

Use quando:

- A rota precisa de sessão.
- A rota pode buscar dados no servidor.
- A experiência de navegação precisa de skeleton.
- A página é importante no fluxo principal.

---

### Padrão B — Server Page com seções em Suspense

Use quando a página possui seções independentes.

    import { Suspense } from "react"

    export default function DashboardPage() {
      return (
        <main className="space-y-6">
          <DashboardHeader />

          <Suspense fallback={<MetricsSkeleton />}>
            <MetricsSection />
          </Suspense>

          <Suspense fallback={<ChartSkeleton />}>
            <ConversationsChart />
          </Suspense>
        </main>
      )
    }

Use quando:

- Cada seção pode carregar separadamente.
- Você quer streaming progressivo.
- Uma seção lenta não deve bloquear a página inteira.

---

### Padrão C — Client Component pesado com `dynamic(..., { loading })`

Use para componente isolado.

    "use client"

    import dynamic from "next/dynamic"

    const RichTextEditor = dynamic(() => import("./rich-text-editor"), {
      ssr: false,
      loading: () => <EditorSkeleton />,
    })

    export function MessageTemplateEditor() {
      return <RichTextEditor />
    }

Use quando:

- O componente é pesado.
- Ele é client-only.
- Ele tem fallback próprio.
- Não precisa compartilhar loading com outros componentes.

---

### Padrão D — Vários lazy components com fallback compartilhado

Use quando uma seção inteira deve carregar junta.

    "use client"

    import { Suspense } from "react"
    import dynamic from "next/dynamic"

    const Chart = dynamic(() => import("./chart"), {
      suspense: true,
    })

    const Table = dynamic(() => import("./table"), {
      suspense: true,
    })

    export function ReportsSection() {
      return (
        <Suspense fallback={<ReportsSkeleton />}>
          <Chart />
          <Table />
        </Suspense>
      )
    }

Use quando:

- Você quer um único skeleton para a seção.
- Os componentes fazem parte da mesma experiência visual.
- Aparecer um antes do outro causaria layout estranho.

---

### Padrão E — Botão com pending state em Server Action

Use para formulários.

    "use client"

    import { useFormStatus } from "react-dom"
    import { Button } from "@/components/ui/button"

    export function SaveButton() {
      const { pending } = useFormStatus()

      return (
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando..." : "Salvar"}
        </Button>
      )
    }

---

## Supabase, sessão e loading

No Causi, a sessão é carregada no servidor e disponibilizada para Client Components via `SessionProvider`.

Isso afeta as decisões de loading:

- Dados que dependem de autenticação e cookies devem preferir Server Components, Server Actions ou Route Handlers.
- Client Components podem consumir `useSession()` para dados já carregados.
- Não use loading client-side para proteger rota sensível.
- Proteção de rota deve acontecer no middleware/proxy, layout ou page server-side.
- Fallback visual não é mecanismo de segurança.

Exemplo recomendado:

    export default async function ChannelsPage() {
      const session = await getSession()
      requireSession(session)

      return <ChannelsClientPage />
    }

Neste caso:

- O servidor valida a sessão.
- A UI client-side recebe apenas o que precisa.
- O loading da rota fica em `loading.tsx`.

---

## Skeletons

### O que faz um bom skeleton

Um bom skeleton deve imitar a estrutura da UI final.

Bom:

    export function DashboardSkeleton() {
      return (
        <div className="space-y-6 p-6">
          <div className="grid gap-4 md:grid-cols-3">
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
          </div>

          <Skeleton className="h-80 rounded-xl" />
        </div>
      )
    }

Ruim:

    export function DashboardSkeleton() {
      return <p>Carregando...</p>
    }

---

### Evite layout shift

Sempre reserve espaço aproximado para a UI final.

Se um gráfico final tem 320px de altura, o skeleton deve ter altura parecida:

    <Skeleton className="h-80 w-full rounded-xl" />

Evite skeletons pequenos para componentes grandes.

---

### Skeleton de rota vs skeleton de componente

| Tipo | Onde fica | Exemplo |
|------|-----------|---------|
| Skeleton de rota | `loading.tsx` | Página inteira |
| Skeleton de seção | Perto da seção | Métricas, gráfico, tabela |
| Skeleton de componente | Perto do componente | Editor, modal, chart |
| Pending state | Dentro do componente interativo | Botão, formulário |

---

## Antipadrões

### 1. Usar `Suspense` sem algo que suspende

Evite:

    <Suspense fallback={<Skeleton />}>
      <SimpleClientComponent />
    </Suspense>

Se `SimpleClientComponent` não usa lazy loading, não usa dados com Suspense e não suspende, o fallback não terá utilidade real.

---

### 2. Colocar a página inteira client-side sem necessidade

Evite transformar uma rota inteira em `"use client"` se apenas um botão precisa de interatividade.

Prefira:

    // page.tsx — Server Component

    import { NewDealButton } from "./new-deal-button"

    export default async function DealsPage() {
      const deals = await getDeals()

      return (
        <main>
          <DealsList deals={deals} />
          <NewDealButton />
        </main>
      )
    }

---

### 3. Usar `ssr: false` como solução padrão

Evite:

    const Component = dynamic(() => import("./component"), {
      ssr: false,
    })

Use apenas quando o componente realmente não pode renderizar no servidor.

---

### 4. Criar skeletons demais

Muitos skeletons independentes podem deixar a tela piscando em blocos.

Se os elementos pertencem à mesma experiência visual, prefira um skeleton compartilhado.

---

### 5. Lazy loading em componente pequeno

Evite dynamic import em componentes simples:

    const Badge = dynamic(() => import("./badge"))

Isso adiciona overhead sem ganho relevante.

---

### 6. Loading de segurança no cliente

Evite proteger dados sensíveis assim:

    "use client"

    export function AdminPage() {
      const session = useSession()

      if (!session.role.isAdmin) {
        return null
      }

      return <AdminContent />
    }

Isso pode evitar exibição visual, mas não é a camada correta de segurança.

Prefira checagem no servidor:

    export default async function AdminPage() {
      const session = await getSession()
      requireAdmin(session)

      return <AdminContent />
    }

---

## Checklist antes de criar um loading

Antes de implementar, responda:

- O loading é da rota inteira?
- O loading é de uma seção específica?
- O componente é realmente pesado?
- O componente precisa mesmo ser client-side?
- O componente quebra em SSR?
- O fallback preserva o espaço da UI final?
- O skeleton usa tokens do design system?
- Existe risco de duplicar fallback com `loading.tsx`?
- O loading está sendo usado como segurança? Se sim, está errado.
- A estratégia melhora a experiência ou só adiciona complexidade?

---

## Guia de decisão por exemplo

### Dashboard

Recomendado:

- `loading.tsx` para skeleton da página.
- `Suspense` para seções com dados independentes.
- `dynamic()` para gráficos pesados, se eles aumentarem muito o bundle.
- `useTransition` para filtros que disparam `router.refresh()` ou navegação.
- `useSession()` para consumir snapshot de sessão já carregado.

---

### Conversas

Recomendado:

- `loading.tsx` para a rota.
- Skeleton da lista de conversas.
- Suspense para painel de conversa ou informações laterais, se carregarem separadamente.
- Estado manual para ações em tempo real ou interações locais.
- Evitar lazy loading da estrutura principal se ela é essencial para a tela.

---

### Canais

Recomendado:

- `loading.tsx` se a listagem passar a buscar dados no servidor.
- `useFormStatus` em formulários de criação/edição.
- `dynamic()` para modais pesados ou integrações externas.
- Estado manual para busca/filtro client-side simples.

---

### Formulários

Recomendado:

- `useFormStatus` para Server Actions.
- Estado `isSubmitting` do `react-hook-form` quando o submit é client-side.
- Skeleton apenas quando o formulário depende de dados iniciais demorados.
- Não usar `loading.tsx` para loading de submit.

---

### Modais e drawers

Recomendado:

- Import estático se o modal é usado sempre ou é leve.
- `dynamic()` se o modal é pesado e raramente aberto.
- `dynamic(..., { loading })` se o modal tem fallback próprio.
- Evitar `ssr: false` salvo dependência real de browser API.

---

## Convenções para o Causi

### Nome de arquivos

Use nomes em inglês e kebab-case:

- `dashboard-skeleton.tsx`
- `metrics-section-skeleton.tsx`
- `chart-skeleton.tsx`
- `conversation-list-skeleton.tsx`
- `loading.tsx`

---

### Onde colocar skeletons

Skeleton específico de rota:

    src/app/(app)/dashboard/loading.tsx

Skeleton reutilizável de feature:

    src/components/dashboard/dashboard-skeleton.tsx
    src/components/dashboard/chart-skeleton.tsx

Skeleton de componente muito específico:

    src/components/dashboard/conversations-chart-skeleton.tsx

---

### Preferência visual

Use componentes e tokens do design system:

- `Skeleton` de `src/components/ui/skeleton`
- `bg-card`
- `bg-muted`
- `border-border`
- `text-muted-foreground`
- `rounded-xl`

Evite classes fixas como:

- `bg-gray-100`
- `text-gray-500`
- `border-gray-200`

---

## Tabela final de decisão

| Necessidade | Use |
|-------------|-----|
| Mostrar fallback ao navegar para uma rota | `loading.tsx` |
| Mostrar fallback para uma seção interna | `<Suspense fallback={...}>` |
| Separar componente pesado do bundle inicial | `dynamic()` |
| Componente só funciona no browser | `dynamic(..., { ssr: false })` |
| Um lazy component isolado | `dynamic(..., { loading })` |
| Vários lazy components com fallback único | `dynamic(..., { suspense: true })` + `<Suspense>` |
| Submit de formulário com Server Action | `useFormStatus` |
| Refresh/navegação/filtro com pending state | `useTransition` |
| Fetch client-side manual | `useState` com `isLoading` |
| Imagem abaixo da dobra | `next/image` padrão |
| Imagem crítica above the fold | `next/image` com `priority` |
| Script externo não crítico | `next/script` com `lazyOnload` |

---

## Conclusão

Use a estratégia mais simples que resolve o problema correto.

Na maioria dos casos:

1. `loading.tsx` para rotas.
2. `Suspense` para seções.
3. `dynamic()` para componentes pesados.
4. `ssr: false` apenas para componentes browser-only.
5. `useFormStatus` e `useTransition` para pending states de interações.
6. Estado manual quando o loading realmente acontece no cliente.

A melhor arquitetura evita loading desnecessário, mantém o máximo possível no servidor e envia JavaScript ao browser apenas quando há interatividade real.
