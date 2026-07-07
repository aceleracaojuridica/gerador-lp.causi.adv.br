# Validação de Scripts + Iframes Embedded (Google Calendar, Maps, YouTube)

## Contexto

O projeto já possui campos `tags.head / body / footer` para scripts personalizados — tanto nas **configurações globais** (`GlobalConfigForm`) quanto nas **integrações por LP** (`IntegracoesPanel`). Ambos são textareas livres sem qualquer validação de segurança.

Além disso, o `CustomSection` (seção criada pelo usuário) hoje suporta apenas `kind: "cards" | "texto"`. A nova funcionalidade adiciona `kind: "youtube"` para embutir vídeos do YouTube, e os iframes de **Google Calendar** e **Google Maps** ganham campos próprios em painéis específicos.

---

## User Review Required

> [!IMPORTANT]
> **Decisão de escopo para o Calendar:** O Google Calendar tem dois modos (Botão Popup e Incorporação de página). O plano propõe suportar **ambos** via campo de embed isolado (não via script livre). O botão popup do Google Calendar usa `<script>` externo de `calendar.google.com` — este é o único script de terceiro que seria permitido no novo allow-list. Confirme se deseja suporte ao modo botão popup ou apenas ao iframe.

> [!WARNING]
> **Scripts personalizados (`tags.head/body/footer`)** continuarão existindo para casos avançados, mas passarão a ter validação de allow-list. Scripts **não** de domínios confiáveis serão rejeitados na camada Zod com mensagem clara. Isso pode bloquear scripts que usuários já tenham configurado. É necessário comunicar a mudança.

> [!IMPORTANT]
> **Google Maps:** O campo `office.mapsUrl` já existe e gera um link "Ver no mapa" no rodapé. O novo campo `office.mapsEmbedUrl` (iframe embed) é **separado** — um é o link, outro é o src do iframe. Confirme se é preferível um campo único que detecte automaticamente (link vs embed) ou dois campos distintos.

---

## Open Questions

1. **Calendar — modo Botão:** Suportar apenas iframe (incorporação de página) ou também o botão popup com script externo?
2. **Maps embed:** Campo único com auto-detecção ou dois campos (`mapsUrl` para link, `mapsEmbedUrl` para iframe)?
3. **Posição do Maps:** A proposta é uma seção dedicada **acima do footer** (entre FAQ e Footer). Isso pode ser ativado/desativado pelo usuário. Confirmar?
4. **Seção YouTube customizada:** Hoje o `videoId` existe no LpSchema mas serve ao Hero (variant vídeo). A nova seção YouTube seria **separada** (`CustomSection kind: "youtube"`), com título + video. Confirmar essa separação?

---

## Estratégia de Segurança

### Scripts personalizados (tags.head / body / footer)

**Abordagem: Allow-list de domínios por validação Zod**

O HTML/JS é parseado via regex para extrair todos os `src=` e `href=` de tags `<script>` e `<link>`. Domínios não autorizados falham na validação com mensagem descritiva.

**Allow-list proposta:**
```
DOMÍNIOS PERMITIDOS:
- *.google-analytics.com
- *.googletagmanager.com
- *.googlesyndication.com
- *.googleadservices.com
- *.doubleclick.net
- *.facebook.net (Meta Pixel)
- *.cloudflare.com (Turnstile)
- connect.facebook.net
- snap.licdn.com (LinkedIn Insight)
- sc-static.net (Snapchat)
- *.tiktok.com (TikTok Pixel)
- calendar.google.com (Google Calendar scheduling button)
```

**Também bloqueado:**
- Tags `<script>` com código inline que contenha `fetch(`, `XMLHttpRequest`, `eval(`, `document.cookie`, `localStorage`, `sessionStorage` — indica exfiltração de dados
- Qualquer `src=` apontando para IP direto (não hostname)
- Protocolos não-HTTPS

### Iframes (Google Calendar, Maps, YouTube)

Iframes são **campos estruturados** (não texto livre). O usuário cola o código HTML do iframe → nós extraímos o `src` e validamos contra o domínio esperado. O iframe é reconstruído programaticamente com atributos seguros (`sandbox`, `referrerpolicy`). Usuário nunca injeta HTML cru de iframe.

---

## Proposed Changes

### 1. Validação de scripts — nova utility

#### [NEW] `src/lib/landing-pages/validation/script-validator.ts`
Exporta:
- `ALLOWED_SCRIPT_DOMAINS: string[]` — allow-list de domínios
- `validateCustomScript(html: string): { valid: boolean; errors: string[] }` — valida o HTML de tags
- `parseSrcFromScriptTags(html: string): string[]` — extrai URLs de src/href

---

### 2. Schemas Zod — validação de scripts

#### [MODIFY] `src/forms/GlobalConfigForm/schema.ts`
- Adicionar `tagsSchema` com `.refine()` que chama `validateCustomScript`
- Campo `tags.head`, `tags.body`, `tags.footer` passam a usar `tagsSchema`

#### [MODIFY] `src/lib/landing-pages/validation/zod-primitives.ts`
- Adicionar `customScriptTagSchema` reutilizável (usado nos dois forms)

---

### 3. Schema do LpSchema — novos campos

#### [MODIFY] `src/lib/landing-pages/schema.ts`
- `Office` ganha:
  - `mapsEmbedUrl?: string` — src do iframe do Google Maps
  - `calendarEmbedUrl?: string` — src do iframe do Google Calendar
  - `calendarMode?: "iframe" | "button"` — modo de exibição

#### [MODIFY] `src/forms/LpEditorForm/schema.ts`
- `officeSchema` ganha `mapsEmbedUrl`, `calendarEmbedUrl`, `calendarMode`
- `EMPTY_OFFICE` atualizado
- `lpEditorDefaultValues` atualizado
- `customSectionSchema` ganha `kind: "youtube"` (além de `"cards"` e `"texto"`)
  - campos adicionais: `youtubeId: string` (ID do vídeo)

#### [MODIFY] `src/lib/landing-pages/schema.ts` (tipo `CustomSection`)
- `CustomSection.kind` passa a aceitar `"youtube"`
- Adicionar campo opcional `youtubeId?: string`

---

### 4. Componentes de seção — renderização dos embeds

#### [NEW] `src/components/Sections/maps-embed.tsx`
Seção de mapa acima do footer (ativável/desativável). Ocupa largura total (`w-full`), altura 400px no mobile, 500px no desktop. Aceita `src` (validado) e renderiza iframe com:
```html
<iframe
  src={mapsEmbedSrc}
  width="100%" height="100%"
  style="border:0"
  allowFullScreen
  loading="lazy"
  referrerPolicy="strict-origin-when-cross-origin"
  sandbox="allow-scripts allow-same-origin allow-popups"
/>
```

#### [NEW] `src/components/Sections/calendar-embed.tsx`
Renderiza:
- modo `"iframe"`: iframe do Google Calendar Appointments (como `maps-embed`)
- modo `"button"`: botão com popup (carrega script do `calendar.google.com` de forma segura via `next/script strategy="lazyOnload"`)

#### [MODIFY] `src/components/Sections/custom-section.tsx`
- Adicionar `kind === "youtube"` → renderiza título (h2) + iframe do YouTube
- YouTube ID é validado via `extractYouTubeId()` antes de montar o src

---

### 5. Editor — painéis de UI

#### [MODIFY] `src/components/Builder/editor/panels/footer-panel.tsx`
- Novo `<FieldGroup title="Google Maps (mapa incorporado)">` com:
  - Campo `mapsEmbedUrl`: cola o iframe do Google Maps → extrai e valida o `src`
  - Toggle on/off para mostrar o mapa

#### [MODIFY] `src/components/Builder/editor/panels/integracoes-panel.tsx`
- Novo `<FieldGroup title="Google Calendar">` com:
  - Segmented `calendarMode`: "iframe" | "button"
  - Campo `calendarEmbedUrl`: cola o iframe/script do Google Calendar → extrai e valida o src (ou URL do agendamento)
  - Preview inline do modo selecionado

#### [MODIFY] `src/components/Builder/editor/editor-shell.tsx`
- Adicionar painel para seções custom do tipo `"youtube"` no editor de seção
- No formulário de nova seção customizada, adicionar opção `"youtube"` com campo de URL/ID do vídeo

---

### 6. Preview — renderização dos novos elementos

#### [MODIFY] `src/components/Preview/landing-preview.tsx`
- Importar `MapsEmbed` e `CalendarEmbed`
- Renderizar `MapsEmbed` entre o último item de `order` e o `Footer` (se `office.mapsEmbedUrl` preenchido)
- `renderItem` para `"custom:*"` com `kind === "youtube"` já é tratado via `CustomSection` atualizado

---

### 7. Configurações globais — scripts

#### [MODIFY] `src/forms/GlobalConfigForm/sections/scripts-config-form.tsx`
- Adicionar `<FormMessage />` abaixo de cada textarea para exibir os erros de validação
- Adicionar banner de aviso sobre domínios permitidos

---

## Utility: Extração de src de iframes

```ts
// src/lib/landing-pages/validation/iframe-extractor.ts

/** Extrai o src de um código de iframe colado pelo usuário. */
export function extractIframeSrc(html: string): string | null {
  const match = html.match(/src=["']([^"']+)["']/i);
  return match?.[1] ?? null;
}

/** Valida que o src pertence ao domínio esperado. */
export function validateIframeDomain(src: string, expectedDomain: string): boolean {
  try {
    const url = new URL(src);
    return url.hostname === expectedDomain || url.hostname.endsWith(`.${expectedDomain}`);
  } catch {
    return false;
  }
}
```

---

## Fluxo de UX — campos de iframe

```
Usuário cola HTML do iframe no editor
          ↓
Nós extraímos src com extractIframeSrc()
          ↓
Validamos domínio com validateIframeDomain()
          ↓
✅ Válido → salvamos só o src (não o HTML bruto)
❌ Inválido → exibimos erro inline "Domínio não reconhecido. Aceito: calendar.google.com"
```

Isso garante que o HTML injetado na LP publicada é sempre gerado por nós (seguro), não pelo usuário.

---

## Ordem de renderização no LpSchema

```
[Hero]
[Seções do meio em order[]]
  ↙ custom sections (cards | texto | youtube)
[FAQ]
[CTA Final]
[Maps Embed]   ← novo, ativável
[Footer]
```

**Calendar** entra na seção **Contato / CTA Final** — botão secundário personalizado ou iframe abaixo do CTA.

---

## Verification Plan

### Automated (lint/build)
```bash
pnpm build   # sem erros de tipo
pnpm lint    # Biome sem warnings
```

### Manual
1. **Script malicioso rejeitado:** colar `<script src="https://evil.com/track.js">` → erro de validação
2. **Script legítimo aceito:** colar snippet do GTM → sem erro
3. **Maps embed:** colar iframe do Google Maps → mapa aparece no preview acima do footer
4. **Calendar iframe:** colar iframe do Google Calendar → aparece na seção de integrações
5. **YouTube section:** criar seção custom tipo YouTube, colar link do vídeo → vídeo aparece na LP
6. **Tipos TypeScript:** todos os campos novos tipados corretamente em `LpSchema`
