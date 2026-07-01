# Landing Pages

Documentação da feature de criação, edição e publicação de landing pages jurídicas.

## Visão geral

O advogado preenche um formulário, a IA gera a copy e o advogado escolhe **variações por seção** no passo Layout. O sistema salva um **snapshot JSON** (`LpSchema`). O editor e o site publicado usam o **mesmo renderer React** (`LandingPreview`). Não há HTML no banco.

**Centro da feature:** a LP é composta por **seções com variações**. Cada seção (Hero, Dor, Solução, etc.) tem variantes de layout independentes. O template (`lib/templates.ts`) é apenas um preset que copia valores iniciais para `schema.layout` — ver [../guides/templates-vs-variants.md](../guides/templates-vs-variants.md).

Cada escritório pode criar **N landing pages** sem limite.

---

## Conceitos fundamentais

### Seções

Blocos fixos da página. Cada seção tem conteúdo (copy gerada pela IA) e uma variação de layout selecionável.

| Seção | Tipo | Obrigatória |
|-------|------|-------------|
| `Hero` | Com variação | Sim (sempre a primeira) |
| `Dor` | Com variação | Sim |
| `Solução` | Com variação | Sim |
| `Sobre` | Com variação | Sim |
| `Equipe` | Com variação | Sim (se houver advogados cadastrados) |
| `Áreas` | Com variação | Opcional (toggle) |
| `Etapas` | Com variação | Opcional (toggle) |
| `FAQ` | Sem variação | Opcional (toggle) |
| `CTA Final` | Sem variação | Opcional (toggle, oculto por padrão) |
| `Footer` | Sem variação | Sim (sempre a última) |
| `LeadPopup` | Sem variação | Configurável |
| `Seções customizadas` | `cards` ou `texto` | Opcional (criadas no editor) |

**Ordem:** Hero e Footer são fixos; as seções do meio têm ordem configurável (`schema.layout.order`).

---

### Variações

Alternativas visuais de layout para uma seção. O mesmo conteúdo (copy) é renderizado de formas distintas. A variação ativa fica registrada em `schema.layout`.

#### Hero — `HeroVariant`

| Variação | Descrição |
|----------|-----------|
| `centered` | Texto centralizado com imagem de fundo (padrão do template Clássico) |
| `split` | Texto à esquerda, imagem à direita (50/50) |
| `video` | Texto à esquerda, vídeo YouTube incorporado à direita |
| `stats` | Texto com métricas em destaque (ícone + número + legenda) |

#### Dor — `DorVariant`

| Variação | Descrição |
|----------|-----------|
| `comImagem` | Imagem de cena + cards de dores na parte inferior |
| `soCards` | Apenas cards de dores, sem imagem (layout mais compacto) |

#### Solução — `SolucaoVariant`

| Variação | Descrição |
|----------|-----------|
| `comImagem` | Imagem de cena + cards da solução |
| `soCards` | Apenas cards da solução |
| `destaque` | Cards alternando entre destaque accent e neutro |

#### Sobre — `SobreVariant`

| Variação | Descrição |
|----------|-----------|
| `fotoLista` | Foto do advogado à esquerda + lista de diferenciais à direita |
| `overlay` | Foto de fundo em fullbleed com texto e foto do advogado sobrepostos |
| `duasColunas` | Foto full-height à esquerda, texto à direita (duas colunas) |

#### Áreas — `AreasVariant`

| Variação | Descrição |
|----------|-----------|
| `grid` | Grade de cards com ícone e título (2 colunas) |
| `lista` | Faixas horizontais expansíveis |

#### Etapas — `EtapasVariant`

| Variação | Descrição |
|----------|-----------|
| `numerado` | Passos numerados em linha horizontal com ícone circular dourado |
| `timeline` | Linha do tempo vertical com guia lateral e pontos de marcação |

#### Equipe — `EquipeVariant`

| Variação | Descrição |
|----------|-----------|
| `splitAlternado` | Foto grande alternando lado a lado com texto (1–3 sócios) |
| `retratoElegante` | Grid de retratos verticais com gradiente e nome na base (4–6 sócios) |

> Se `equipe` não for definida no layout, a variação é escolhida automaticamente: ≤3 advogados → `splitAlternado`; ≥4 → `retratoElegante`.

---

### Tom (tone)

Cada seção tem um tom independente de fundo: `light` (creme/branco) ou `dark` (cor da marca). Configurado em `schema.layout.tones`.

```typescript
type SectionTones = {
  hero: Tone;
  dor: Tone;
  solucao: Tone;
  sobre: Tone;
  equipe: Tone;
  areas: Tone;
  etapas: Tone;
  faq: Tone;
  ctaFinal: Tone;
};
```

Tom e variação são independentes: a mesma variação de layout pode ter fundo claro ou escuro.

---

### Templates

Grupos pré-definidos de variações + paleta de cores. O advogado escolhe um template na criação, mas pode alterar cada seção individualmente no editor após a criação.

**Papel do template:** ponto de partida visual, não um molde fixo. Ele pré-seleciona variações e define a paleta; tudo é editável depois.

#### Templates disponíveis (`lib/templates.ts`)

**Clássico** (`classic-light`) — Azul marinho com dourado. Sóbrio e profissional.

| Seção | Variação | Tom |
|-------|----------|-----|
| Hero | `centered` | light |
| Dor | `comImagem` | light |
| Solução | `soCards` | dark |
| Sobre | `fotoLista` | light |
| Áreas | `grid` | dark |
| Etapas | `numerado` | light |

**Moderno** (`modern-dark`) — Tons escuros com destaque dourado. Elegante e marcante.

| Seção | Variação | Tom |
|-------|----------|-----|
| Hero | `split` | dark |
| Dor | `soCards` | dark |
| Solução | `comImagem` | light |
| Sobre | `overlay` | dark |
| Áreas | `lista` | light |
| Etapas | `timeline` | dark |

**Acolhedor** (`warm-neutral`) — Tons de caramelo e bege. Próximo e humano.

| Seção | Variação | Tom |
|-------|----------|-----|
| Hero | `stats` | light |
| Dor | `comImagem` | light |
| Solução | `destaque` | dark |
| Sobre | `duasColunas` | light |
| Áreas | `grid` | light |
| Etapas | `numerado` | dark |

---

## Identificador e URL pública

Cada escritório tem um **subdomínio fixo**; cada landing page tem um **slug** (path). A URL pública é:

`https://{office_subdomain}.{NEXT_PUBLIC_APP_DOMAIN}/{slug}` — ex.: `darlley-dev.causi.adv.br/previdenciario`

| Campo | Origem | Escopo | Exemplo |
|-------|--------|--------|---------|
| `office_subdomain` | Nome da conta Causi (`session.account.name` → kebab-case) | Fixo por conta, persistido em `landing_pages` | `darlley-dev` |
| `slug` | Tema da LP na criação (`slugFromOfficeName(tema)`) | Único por `account_id` | `previdenciario` |

A raiz do subdomínio (`darlley-dev.causi.adv.br/`) redireciona para `https://causi.adv.br`. O app do gerador **não** serve LPs em `causi.adv.br/{slug}` (404).

### Quando é definido

| Momento | O que acontece |
|---------|----------------|
| **Wizard `/nova`** | Advogado informa escritório e tema — ainda **não** há slug de LP |
| **`POST /api/gerar-lp`** | Servidor deriva `slug` do tema e `office_subdomain` do nome da conta; grava na primeira persistência |
| **Editor `/lp/[slug]`** | Slug de LP já existe; botão "Ver site" usa `{office_subdomain}.{domain}/{slug}` |
| **Publicação** | Mesmos identificadores; apenas muda `status` para `published` |

O slug da LP **não é editável** pelo advogado. Nasce uma vez na geração e permanece fixo.

### Estratégia de unicidade

**Slug da LP (por conta):**

| Passo | Regra |
|-------|-------|
| 1. Base | Tema → kebab-case (`slugFromOfficeName`) |
| 2. Colisão na conta | Sufixo `-2`, `-3`, … até `LP_SLUG_MAX_SUFFIX` |
| 3. Banco | `UNIQUE (account_id, slug)` |

**Subdomínio do escritório (global entre contas):**

| Passo | Regra |
|-------|-------|
| 1. Base | Nome da conta → kebab-case |
| 2. Colisão entre contas | Sufixo numérico incremental |
| 3. Persistência | Mesmo valor em todas as LPs da conta (`landing_pages.office_subdomain`) |

---

## Fluxo do usuário

```mermaid
flowchart TD
  A[Galeria /] --> B[/nova — wizard 3 passos]
  B --> C[Escritório Contato Imagens + preset opcional]
  C --> D[POST /api/gerar-copy]
  D --> E[POST /api/gerar-lp]
  E --> F[Editor /lp/slug]
  F --> G[VariantPicker + saveLpAction]
  G --> H[Publicar — status=published]
  H --> I[escritorio.causi.adv.br/slug]
```

Ver também [../guides/templates-vs-variants.md](../guides/templates-vs-variants.md).

---

## Geração por IA

### Wizard: copy e criação

**Arquivo:** `app/api/gerar-copy/route.ts`

No passo final (Imagens), ao clicar em **Criar e editar**, o wizard chama `POST /api/gerar-copy` e em seguida `POST /api/gerar-lp`. O advogado pode escolher um preset opcional de layout; as cores vêm da logo.

### Persistência final

**Arquivo:** `app/api/gerar-lp/route.ts`

### Pipeline

1. **Slug da LP** — `slugFromOfficeName(tema)` + `allocateUniqueLpSlug()` escopado à conta.
2. **office_subdomain** — `resolveOfficeSubdomain(session)` a partir do nome da conta.
3. **Layout** — Usa `layout` explícito do wizard (copiado do preset escolhido ou default). Sobrescreve `hero: "video"` se houver `videoId`.
4. **Theme** — Paleta enviada pelo wizard (extraída da logo ou padrão).
5. **Copy** — Reutiliza copy pré-gerada (`/api/gerar-copy`) ou chama GPT-4o inline.
6. **Imagens** — Reutiliza imagens do wizard ou Unsplash + `imageBank`.
7. **Schema** — `buildSchema(office, theme, tema, layout, …)` monta o JSON completo.
8. **Persistência** — `saveLp(session, { slug, officeSubdomain, name, tema, schema })`.

---

## Editor (`/lp/[slug]`)

**Arquivos:** `app/lp/[slug]/page.tsx`, `LpStudio.tsx`, `Editor.tsx`

### Controles por seção

O editor expõe para cada seção:

| Controle | Componente | Persiste em |
|----------|------------|-------------|
| Variação de layout | `VariantPicker` | `schema.layout.<seção>` |
| Tom claro/escuro | Toggle | `schema.layout.tones.<seção>` |
| Textos (copy) | campos inline | `schema.<seção>.*` |
| Imagem de cena | upload/Unsplash | `schema.office.sectionImages.<seção>` |

### `VariantPicker`

Componente central do editor. Exibe miniaturas esquemáticas (wireframes) de cada variação disponível para a seção ativa. Ao selecionar, atualiza `schema.layout` e o preview ao vivo reflete a mudança imediatamente.

### Preview = publicação

`LandingPreview` recebe `LpSchema` e renderiza todas as seções com as variações registradas em `schema.layout`. O preview no editor **é** o que o visitante verá — mesma árvore de componentes, mesmas variações.

### Outros recursos do editor

| Recurso | Onde |
|---------|------|
| Simples / Avançado | `Editor.tsx` |
| Reordenar seções | drag & drop sobre `schema.layout.order` |
| Ligar/desligar seções | toggle de `schema.layout.hidden` |
| Adicionar seção customizada | cria item em `schema.customSections` |
| Trocar template | reaplica `layout` + `theme` do novo template; mantém copy |
| Paleta de cores | `PalettePicker` → `schema.theme` |
| Tipografia | `schema.office.fonts` (heading + body) |
| Cantos dos cards/botões | `schema.office.cardRadius`, `schema.office.buttons.radius` |
| Popup de lead | configura `schema.office.buttons.popup.questions` |
| Tags de conversão | `schema.office.tags` (GTM, Pixel) |
| Domínio personalizado | `schema.office.domain` |
| Política de privacidade | `schema.office.privacyPolicy` |
| Salvar | `saveLpAction` → `lps.schema` |

---

## Schema JSON (`lib/schema.ts`)

### `Layout` — estado atual das variações

```typescript
type Layout = {
  hero: HeroVariant;       // "centered" | "split" | "video" | "stats"
  dor: DorVariant;         // "comImagem" | "soCards"
  solucao: SolucaoVariant; // "comImagem" | "soCards" | "destaque"
  sobre: SobreVariant;     // "fotoLista" | "overlay" | "duasColunas"
  equipe?: EquipeVariant;  // "splitAlternado" | "retratoElegante" | auto
  areas: AreasVariant;     // "grid" | "lista"
  etapas: EtapasVariant;   // "numerado" | "timeline"
  tones: SectionTones;     // light | dark por seção
  hidden?: Partial<Record<ToggleableSection, boolean>>;
  order?: string[];        // ordem das seções do meio
};
```

### `LpSchema` — o que vai no banco

```typescript
type LpSchema = {
  theme: Theme;              // paleta de cores ativa
  office: Office;            // dados do escritório
  layout: Layout;            // variações e tons por seção (snapshot)
  videoId?: string;          // YouTube (usado pelo hero "video")
  hero: HeroContent;
  dor: DorContent;
  solucao: SolucaoContent;
  areas: AreasContent;
  etapas: EtapasContent;
  faq: FaqContent;
  ctaFinal: CtaFinalContent;
  seo?: SeoMeta;             // gerado pela IA na criação
  customSections?: CustomSection[];
};
```

`schema.layout` é a **fonte da verdade** para as variações ativas. Apenas o schema completo é persistido — nenhum id de preset.

---

## Galeria (`/`)

**Arquivo:** `app/page.tsx`

- Lista LPs via `listLps(session.user.id)`.
- Exibe nome, tema e thumbnail de cada LP.
- Links: Nova página, Contatos, configurações globais.
- Guard: `requireLpAccess`.

---

## Formulário multi-step (`/nova`)

**Arquivos:** `app/(app)/nova/page.tsx`, `forms/LandingPageCreateForm/landing-page-create-form.tsx`, `components/Builder/template-card.tsx`

### Passos

| # | Nome | Campos principais |
|---|------|-------------------|
| 1 | Escritório | Tema jurídico, nome, sobre, diferenciais |
| 2 | Contato | WhatsApp, e-mail, endereço, redes sociais |
| 3 | Imagens | Logo, fotos, vídeo YouTube, paleta, preset opcional de layout |

### Submissão

1. Passo 3: **Criar e editar** → `POST /api/gerar-copy` e `POST /api/gerar-lp` com `layout` do preset escolhido (default `classic-light`).
2. Redirect → `/lp/{slug}?novo=1`.

---

## Publicação e subdomínio (MVP)

### Modelo multi-tenant simples

Uma LP publicada = uma linha em `lps`. Multi-tenancy por **`slug`**, não por deploy separado.

### Fluxo de publicação

```mermaid
sequenceDiagram
  participant Advogado
  participant Editor
  participant DB as landing_pages
  participant Proxy as src/proxy.ts
  participant Page as subdomains/escritorio/slug

  Advogado->>Editor: Publicar
  Editor->>DB: status=published
  Note over Proxy,Page: Visitante acessa escritorio.causi.adv.br/previdenciario
  Proxy->>Proxy: host → office_subdomain; path → slug
  Proxy->>Page: rewrite /escritorio/previdenciario
  Page->>DB: getLpPublic(office_subdomain, slug)
  DB-->>Page: LpSchema
  Page->>Page: LandingPreview(schema)
```

1. **Proxy:** `{office}.causi.adv.br/{slug}` → rewrite interno `/{office}/{slug}` (sem auth). Raiz do subdomínio → redirect `causi.adv.br`.
2. **Query:** `landing_pages WHERE office_subdomain = ? AND slug = ? AND status = 'published'`.
3. **Render:** Server Component + `LandingPreview` — `schema.layout` define as variações.
4. **Leads:** `POST /api/lead` na mesma origem do subdomínio.

---

## Persistência

**Arquivo:** `lib/lpStore.ts`

| Função | Operação |
|--------|----------|
| `listLps` | slug, officeSubdomain, name, tema |
| `getLp` | LP completa + `migrate()` |
| `saveLp` | upsert `(account_id, slug)` com `office_subdomain` |
| `deleteLp` | remove por slug (RLS por conta) |
| `getLpPublic` | LP por `office_subdomain` + `slug` sem autenticação |
| `resolveOfficeSubdomain` | subdomínio fixo do escritório a partir do nome da conta |

---

## Componentes de seção (`components/Sections/`)

O renderer despacha para a variação correta dentro de cada componente de seção:

```typescript
// Exemplo: Hero despacha pela variação em schema.layout.hero
function Hero({ schema }) {
  switch (schema.layout.hero) {
    case "centered":  return <HeroCentered ... />;
    case "split":     return <HeroSplit ... />;
    case "video":     return <HeroVideo ... />;
    case "stats":     return <HeroStats ... />;
  }
}
```

Mesmo padrão em `Dor`, `Solucao`, `Sobre`, `Areas`, `Etapas`, `Equipe`.

---

## Gaps conhecidos

| Gap | Nota |
|-----|------|
| "Trocar template" no editor | `TemplatePicker` compacto existe; ação de re-aplicar layout ainda não implementada |
| `Editor.tsx` grande | Refatorar após MVP |
| `POST /api/lead` | Popup demo funciona; captura real não implementada |

---

## Referências

- [../guides/templates-vs-variants.md](../guides/templates-vs-variants.md) — template vs `schema.layout` (referência canônica)
- [prd.md](../prd.md) — requisitos RF-04, RF-06
- [database.md](../database.md) — schema `lps`
- [api.md](../api.md) — `POST /api/gerar-lp`
- [server-actions.md](../server-actions.md) — CRUD `lps` via Server Actions
- [features/leads.md](leads.md) — popup e captura
- `lib/schema.ts` — tipos `Layout`, `LpSchema`, variantes
- `lib/templates.ts` — templates e `getTemplate()`
- `components/Builder/variant-picker.tsx` — `VariantPicker` e miniaturas
