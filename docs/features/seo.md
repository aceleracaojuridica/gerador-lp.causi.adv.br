# Metadados automáticos das Landing Pages

## Propósito

As landing pages do Gerador Causi são pensadas para **tráfego pago** (Google Ads, Meta Ads) e **compartilhamento de link** (WhatsApp, preview em redes). O link é colocado diretamente na campanha — **não há objetivo de tráfego orgânico**.

Os metadados (`title`, `description`, Open Graph) existem para apoiar anúncios e previews de link, não para ranqueamento no Google. Por padrão as LPs saem com **`noindex, follow`**: não competem organicamente com o site institucional do escritório, mas o Google ainda pode rastrear para medir qualidade de anúncios.

**O advogado não configura nada.** A IA gera título e descrição na criação da LP; o servidor completa imagem de preview, favicon e demais fallbacks. Basta publicar e vincular o link na campanha.

| Plataforma | O que usa | Quem cuida |
|------------|-----------|------------|
| Google Ads | Quality Score — relevância entre anúncio, palavra-chave e página (`title`, `description`, velocidade) | IA + fallbacks automáticos |
| Meta Ads / WhatsApp | Open Graph (`og:*`) — preview do link | Hero/logo do escritório + metadados gerados |
| Google (busca) | Título e descrição no SERP (se indexável); JSON-LD `LegalService` | Automático; `indexable: false` por padrão |
| Ambas | Core Web Vitals (LCP, CLS, INP) | Next.js SSR + componentes otimizados |

---

## Onde vive no produto

| Camada | Local |
|--------|-------|
| Schema | `LpSchema.seo` em `lib/schema.ts` |
| Lógica | `lib/seo.ts` — `buildDefaultSeo`, `normalizeSeo`, `resolveSeo` |
| Geração IA | `POST /api/gerar-lp` — IA gera `title` e `description`; o servidor completa o restante |
| Página pública | `app/[slug]/page.tsx` — `generateMetadata` + JSON-LD |
| Galeria | `LpCard` — prévia de link (Open Graph) na listagem via `lib/lpPreview.ts` |
| Migração | `lib/lpStore.ts` — LPs antigas recebem SEO normalizado ao carregar |

Não há seção no editor: metadados são **transparentes** para o advogado.

---

## Tipo `SeoMeta` (`LpSchema.seo`)

```typescript
type SeoMeta = {
  title: string;           // 50–60 chars — keyword do tema + " | " + nome do escritório
  description: string;     // 140–155 chars — benefício concreto + CTA suave
  ogImage?: string;        // Preview Meta/WhatsApp — hero ou logo
  ogTitle?: string;        // Vazio = usa `title`
  ogDescription?: string;  // Vazio = usa `description`
  favicon?: string;        // Vazio = logo do escritório
  keywords?: string;       // Palavras-chave separadas por vírgula
  siteName?: string;       // og:site_name; vazio = nome do escritório
  canonicalUrl?: string;   // Vazio = URL pública automática
  indexable?: boolean;     // false por padrão (noindex para tráfego pago)
};
```

Campos opcionais usam **fallbacks automáticos** via `resolveSeo()`:

| Campo | Fallback |
|-------|----------|
| `ogImage` | `office.sectionImages.hero` → `office.logoSrc` |
| `favicon` | `office.logoSrc` |
| `ogTitle` / `ogDescription` | `title` / `description` |
| `siteName` | `office.name` |
| `canonicalUrl` | `https://{slug}.{NEXT_PUBLIC_APP_DOMAIN}` |
| `title` / `description` | Gerados por `buildDefaultSeo()` a partir do tema, cidade, hero |

---

## Geração automática (`POST /api/gerar-lp`)

1. A IA retorna `seo.title` e `seo.description` no JSON da copy (regras no system prompt).
2. Após montar o schema e buscar imagens, o servidor chama `normalizeSeo()` com:
   - `ogImage` = imagem do hero (Unsplash/banco curado)
   - `favicon` = logo enviada no cadastro
   - `keywords`, `siteName`, `indexable: false` — preenchidos por `buildDefaultSeo()`

A LP **já sai pronta** para vincular em campanhas.

### Regras de título (IA)

1. Palavra-chave do tema **no início** — alinhamento com o anúncio pago.
2. Separador ` | ` + nome curto do escritório ao final (quando couber).
3. 50–60 caracteres (limite técnico: 60 em `SEO_TITLE_MAX`).
4. Sem promessa de resultado (Provimento OAB 205/2021).

**Exemplos:**

| Tema | Título |
|------|--------|
| Direito Trabalhista | `Direito Trabalhista em SP \| Escritório Oliveira` |
| INSS Negado | `Benefício Negado pelo INSS? Advogado Previdenciário` |
| Divórcio | `Divórcio e Guarda de Filhos \| Advocacia de Família` |

### Regras de description (IA)

1. 140–155 caracteres (limite técnico: 155 em `SEO_DESC_MAX`).
2. Benefício concreto para quem clicou no anúncio.
3. CTA suave ao final: "Consulte um especialista." / "Analise seu caso."
4. Sem promessa de resultado.

---

## Página pública e metadados

**URL publicada:** `https://{slug}.{NEXT_PUBLIC_APP_DOMAIN}` (ex.: `escritorio-silva.causi.adv.br`).

O middleware resolve o subdomínio e reescreve para `app/[slug]/page.tsx`.

`generateMetadata` usa `resolveSeo(lp.schema, slug)` e emite:

```typescript
{
  title,
  description,
  keywords,
  robots: indexable ? { index: true, follow: true } : { index: false, follow: true },
  alternates: { canonical },
  icons: { icon, apple },
  openGraph: { title, description, images, siteName, url, locale: "pt_BR" },
  twitter: { card: "summary_large_image", title, description, images },
}
```

**Imagem OG:** `seo.ogImage` ou hero. Proporção recomendada pelo Meta: **1200×630 px** (≈ 1,91:1).

---

## Structured Data — Schema.org `LegalService`

JSON-LD inline em `app/[slug]/page.tsx`:

```json
{
  "@context": "https://schema.org",
  "@type": "LegalService",
  "name": "Nome completo do escritório",
  "description": "Meta description resolvida",
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "Cidade",
    "streetAddress": "Endereço",
    "addressCountry": "BR"
  },
  "telephone": "+55XXXXXXXXXXX",
  "email": "contato@escritorio.com.br",
  "areaServed": "Cidade ou Estado",
  "url": "https://slug.causi.adv.br"
}
```

---

## Rastreamento de conversão (separado dos metadados)

Scripts de campanha (GTM, Pixel Meta, gtag) ficam em **configuração global** (`user_settings.tracking_tags`) ou, por LP, em `office.tags: ConversionTags`:

| Campo | Posição |
|-------|---------|
| `tags.head` | `<head>` — GTM, gtag, verificação |
| `tags.body` | Início do `<body>` — `<noscript>` GTM |
| `tags.footer` | Fim da página — Pixel Meta, Analytics |

No preview do editor esses scripts **não** são executados.

---

## Galeria — listagem de LPs

Em `app/(studio)/page.tsx`, cada card (`LpCard`) exibe uma **prévia de link** (formato Open Graph), não a imagem fixa do template:

1. **Imagem** — `seo.ogImage` → hero → logo; se nenhuma existir, usa o preview do template escolhido
2. **Título e descrição** — `resolveSeo(schema, slug)`
3. **Subdomínio** — `{slug}.causi.adv.br`
4. **Nome do site** — `seo.siteName` ou nome do escritório

A lógica vive em `lib/lpPreview.ts` (`buildLpListPreview`) e o componente visual em `LinkSharePreview` / `LpLinkPreviewCard`.

---

## Robots e indexação

| `indexable` | Comportamento |
|-------------|---------------|
| `false` (padrão) | `noindex, follow` — não indexa organicamente; permite rastreamento para Quality Score |
| `true` | `index, follow` — permite aparecer no Google organicamente |

Indexação orgânica não é o caso de uso; o padrão `false` atende campanhas pagas.

---

## Performance (Core Web Vitals)

| Métrica | Impacto | Status |
|---------|---------|--------|
| LCP | Quality Score + conversão | ✓ Next.js SSR |
| CLS | Quality Score | ✓ Tailwind com dimensões fixas |
| INP | UX pós-clique | ✓ componentes leves |
| Fontes | LCP | ✓ `next/font` com `display: swap` |
| Imagens OG | Preview de link | ✓ hero/logo + WebP no Storage |

---

## Checklist antes de veicular em campanha

O advogado só precisa verificar o conteúdo visível da página:

- [ ] WhatsApp e contato preenchidos
- [ ] Cidade preenchida (JSON-LD + copy local)
- [ ] Tags de conversão (GTM / Pixel Meta) nas configurações globais
- [ ] LP **publicada** e acessível em `{slug}.causi.adv.br`

Título, descrição e preview de link são gerados automaticamente — não exigem ação manual.

---

## Referências

- [prd.md](../prd.md) — RF-09
- [features/landing-pages.md](landing-pages.md) — seções e renderer
- [database.md](../database.md) — tabela `landing_pages`, coluna `schema`
- [api.md](../api.md) — `POST /api/gerar-lp`
- `lib/seo.ts` — funções utilitárias
