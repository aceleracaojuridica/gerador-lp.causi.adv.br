# Metadados e indexação das Landing Pages

## Propósito

As landing pages do Gerador Causi são pensadas para **tráfego pago** (Google Ads, Meta Ads) e **compartilhamento de link** (WhatsApp, preview em redes). O link é colocado diretamente na campanha.

Os metadados (`title`, `description`, Open Graph) existem para apoiar anúncios e previews de link. Por padrão as LPs saem com **`noindex, follow`**: não competem organicamente com o site institucional do escritório.

**Indexação orgânica é opcional.** O advogado ativa **"Aparecer no Google?"** no painel Integrações do editor; só então a seção SEO fica visível para personalizar título, descrição e imagem OG.

| Plataforma | O que usa | Quem cuida |
|------------|-----------|------------|
| Google Ads | Quality Score — relevância entre anúncio, palavra-chave e página | IA + fallbacks automáticos |
| Meta Ads / WhatsApp | Open Graph (`og:*`) — preview do link | Hero/logo + metadados gerados |
| Google (busca) | Título, descrição, JSON-LD `LegalService` | Só quando `indexable: true` |
| App interno (login, painel) | `noindex, nofollow` + `robots.txt` Disallow | Sempre bloqueado |

---

## Onde vive no produto

| Camada | Local |
|--------|-------|
| Schema | `LpSchema.seo` em `lib/landing-pages/schema.ts` |
| Lógica | `lib/landing-pages/seo.ts` — `buildDefaultSeo`, `normalizeSeo`, `resolveSeo` |
| Geração IA | `POST /api/gerar-lp` — IA gera `title` e `description` |
| Toggle indexação | Painel **Integrações** do editor — "Aparecer no Google?" |
| SEO avançado | Painel **SEO** do editor — visível só com indexação ativa |
| Página pública | `app/(subdomains)/[escritorio]/[slug]/page.tsx` — `generateMetadata` + JSON-LD condicional |
| App interno | `app/robots.ts` + metadata `noindex` nos layouts `(app)` e `(auth)` |

---

## Tipo `SeoMeta` (`LpSchema.seo`)

```typescript
type SeoMeta = {
  title: string;
  description: string;
  ogImage?: string;
  ogTitle?: string;
  ogDescription?: string;
  favicon?: string;
  keywords?: string;
  siteName?: string;
  canonicalUrl?: string;
  indexable?: boolean; // false por padrão
};
```

---

## Comportamento de indexação

| `indexable` | Comportamento |
|-------------|---------------|
| `false` (padrão) | `noindex, follow`; JSON-LD não é emitido; seção SEO oculta no editor |
| `true` | `index, follow`; JSON-LD `LegalService`; seção SEO visível no editor |

---

## Rastreamento de campanhas (separado dos metadados)

Pixels e tags usam toggles por provedor (`ga4`, `gtm`, `metaPixel`, `googleAds`).

| Camada | Onde | Comportamento |
|--------|------|---------------|
| Padrão da conta | `lp_account_settings.tracking_providers` / `tracking_scripts` | Configurações → Trackeamento / Scripts |
| Override por LP | `schema.office.tracking` / `schema.office.tags` | Editor → Integrações; campo vazio herda |
| Página publicada | live-merge | `getLpPublic` + `applyGlobalConfigToOffice({ marketingOnly: true })` → `LandingPageTracking` |

Regra de herança: ID de provedor vazio na LP herda id e `enabled` da conta; snippet `head`/`body`/`footer` vazio herda da conta. Snippets em texto puro (sem ofuscação); JS sem wrapper `<script>` é executado via `next/script`.

---

## Captcha (Turnstile global)

Proteção dos formulários de lead usa **uma única configuração** via `.env`:

- `NEXT_PUBLIC_TURNSTILE_SITE_KEY` — widget no cliente
- `TURNSTILE_SECRET_KEY` — validação server-side em `submitLeadAction`

Não há configuração por conta ou por landing page.
