# Landing Pages

Documentação da feature de criação, edição e publicação de landing pages jurídicas.

## Visão geral

Cada landing page é um snapshot JSON serializável (`LpSchema`) salvo em `landing_pages.schema`.

O produto não persiste HTML. O que o banco guarda é:

- identidade e configuração do escritório
- copy das seções
- tema ativo
- estado de layout por seção em `schema.layout`

O preview do editor e a página publicada usam o mesmo renderer React: `src/components/Preview/landing-preview.tsx`.

## Núcleo da feature

A landing page é montada por seções fixas e seções opcionais.

Cada seção pode depender de:

- conteúdo textual
- imagens do escritório
- tom claro ou escuro
- variant visual específica

A fonte da verdade para variants é `src/lib/landing-pages/variants.ts`.

## Seções da LP

| Seção | Tipo | Observação |
|---|---|---|
| `hero` | com variant | sempre no topo |
| `dor` | com variant | parte fixa do miolo |
| `solucao` | com variant | parte fixa do miolo |
| `sobre` | com variant | parte fixa do miolo |
| `equipe` | com variant | controlada por toggle e por regra de elegibilidade |
| `areas` | com variant | opcional por toggle |
| `etapas` | com variant | opcional por toggle |
| `faq` | sem variant | opcional por toggle |
| `ctaFinal` | sem variant | opcional por toggle, default oculto |
| `footer` | sem variant | sempre no fim |
| `customSections` | cards ou texto | opcionais, criadas no editor |

Hero e Footer são fixos. A ordem do miolo vive em `schema.layout.order`.

## Variants atuais

As variants persistidas usam ids semânticos com prefixo `causi_`.

### Hero

| Label | ID |
|---|---|
| Centralizado | `causi_lp_section_hero_centered_focus` |
| Split 50/50 | `causi_lp_section_hero_split_media` |
| Vídeo + Foto | `causi_lp_section_hero_video_embedded` |
| Com métricas | `causi_lp_section_hero_stats_authority` |
| Recorte | `causi_lp_section_hero_cutout_portrait` |

### Dor

| Label | ID |
|---|---|
| Com imagem | `causi_lp_section_dor_with_image_cards` |
| Só cards | `causi_lp_section_dor_cards_compact` |
| Lista | `causi_lp_section_dor_image_list` |

### Solução

| Label | ID |
|---|---|
| Com imagem | `causi_lp_section_solucao_with_image_cards` |
| Só cards | `causi_lp_section_solucao_cards_compact` |
| Lista | `causi_lp_section_solucao_image_list` |

### Sobre

| Label | ID |
|---|---|
| Foto + lista | `causi_lp_section_sobre_photo_list` |
| Imagem + overlay | `causi_lp_section_sobre_overlay_portrait` |
| Duas colunas | `causi_lp_section_sobre_two_columns_portrait` |

### Equipe

| Label | ID |
|---|---|
| Split alternado | `causi_lp_section_equipe_split_alternating` |
| Retrato elegante | `causi_lp_section_equipe_portrait_grid` |
| Retrato solo | `causi_lp_section_equipe_solo_portrait` |

### Áreas

| Label | ID |
|---|---|
| Grade | `causi_lp_section_areas_grid_icon_cards` |
| Lista | `causi_lp_section_areas_list_bands` |

### Etapas

| Label | ID |
|---|---|
| Numerado | `causi_lp_section_etapas_numbered_steps` |
| Linha do tempo | `causi_lp_section_etapas_timeline_flow` |

## Regra especial da seção `equipe`

`Equipe` é a única seção cujo layout depende também da quantidade de advogados.

Regras atuais:

| Advogados | Variants liberadas | Fallback automático com `layout.equipe` vazio |
|---|---|---|
| `0` | nenhuma | nenhum |
| `1` | `causi_lp_section_equipe_solo_portrait` | nenhum |
| `2-3` | `split_alternating`, `portrait_grid` | `split_alternating` |
| `4+` | `split_alternating`, `portrait_grid` | `portrait_grid` |

Comportamento do editor:

- ao ativar `equipe` com `1` advogado, o editor aplica `Retrato solo`
- ao ativar `equipe` com `0` advogados, o editor bloqueia a ação e mostra toast
- se a section ficar incompatível com a quantidade atual de advogados, o editor oculta a seção automaticamente
- o painel lateral mostra um bloco de avisos discretos para estados incompatíveis

Comportamento do renderer:

- `src/components/Sections/equipe.tsx` só renderiza quando a combinação `lawyerCount + variant` for válida
- se `layout.equipe` vier vazio, o auto só vale para `2+`
- o caso solo exige variant explícita

## Tom por seção

Cada seção usa um `tone` independente em `schema.layout.tones`.

```ts
type SectionTones = {
  hero: "light" | "dark";
  dor: "light" | "dark";
  solucao: "light" | "dark";
  sobre: "light" | "dark";
  equipe: "light" | "dark";
  areas: "light" | "dark";
  etapas: "light" | "dark";
  faq: "light" | "dark";
  ctaFinal: "light" | "dark";
};
```

Tom e variant são independentes.

## Templates

Templates são presets de layout definidos em `src/lib/landing-pages/templates.ts`.

Templates disponíveis hoje:

| Nome | `id` |
|---|---|
| Clássico | `classic-light` |
| Moderno | `modern-dark` |
| Autoridade | `autoridade` |
| Acolhedor | `warm-neutral` |

Cada template traz:

- combinação de variants por seção
- tons por seção
- `hidden` inicial
- `theme` usado nas prévias estáticas do template

Na feature, o papel do template é:

- no wizard: fornecer o layout inicial
- no editor: reaplicar uma composição de layouts

No editor, `applyTemplate()` reaplica apenas `layout`, preservando `order` e mesclando `hidden`. Textos, imagens e `theme` não são trocados nessa ação.

## Criação da LP

Arquivos centrais:

- `src/app/api/gerar-copy/route.ts`
- `src/app/api/gerar-lp/route.ts`
- `src/lib/landing-pages/lp-account-generation-context.ts`
- `src/lib/landing-pages/resolve-section-images.ts`

Fluxo:

1. o wizard coleta dados do escritório, contato e imagens
2. ao enviar a logo, as cores são extraídas (`extractPalette`); o usuário pode aplicar uma paleta pronta (`PalettePicker`) ou clicar na varinha (`SugerirPaletasButton` → `suggestSimilarPaletteAction`) para gerar e aplicar imediatamente 1 Theme semelhante à base — cada clique pede uma variação distinta da atual
3. `POST /api/gerar-copy` produz copy, layout (variants) e imagens de cenário
4. `POST /api/gerar-lp` monta o `Office`, resolve slug, resolve subdomínio e gera o `LpSchema` (reaproveita copy/images/layout pré-gerados quando enviados)
5. o schema é salvo como draft
6. o usuário é redirecionado para `/lp/[slug]`

Contexto das LPs existentes da conta (draft + published):

- o prompt recebe **somente** URL pública + descrição semântica (`tema` + SEO title/description)
- teto duro de exemplos/caracteres — sem `schema`, variants ou copy de seções
- prioriza LPs com tema semelhante ao formulário
- se a conta não tiver LPs, a geração segue só com os fatos do wizard

Detalhes do `POST /api/gerar-copy` / regeneração em `gerar-lp`:

- copy e layout usam o portfólio leve da conta como mapa institucional (sem copiar texto)
- se houver `videoId`, força `hero = causi_lp_section_hero_video_embedded`
- resolução de imagens (`resolveSectionImages`):
  1. galeria da conta (`lp_account_images` com `section_tags`) + catálogo global (`lp_system_images`) com ranking semântico por IA
  2. slots vazios: Unsplash ao vivo via `imageQueries` gerados pela copy (`buscarImagensUnsplash`)
  3. banco curado local (`image-bank`) só como rede de segurança
- monta o schema com `buildSchema()` e normaliza SEO com `normalizeSeo()`

## Editor

Arquivos centrais:

- `src/components/Builder/editor/editor-shell.tsx`
- `src/hooks/use-lp-editor-form.ts`
- `src/forms/LpEditorForm/schema.ts`

O editor permite:

- trocar variant por seção
- trocar tone por seção
- ligar e desligar seções opcionais
- reordenar o miolo em `layout.order`
- aplicar template
- editar textos e imagens
- configurar paleta, tipografia, botões, popup, tracking, domínio e SEO

Os catálogos de options do editor vêm de `src/components/Builder/editor/constants.ts`, que reexporta o catálogo de `variants.ts`.

## Preview e publicação

`LandingPreview` é o renderer compartilhado entre:

- preview no editor
- página publicada

Fluxo da publicação:

1. a LP é marcada como `published`
2. o acesso público resolve `office_subdomain + slug`
3. `getLpPublic()` carrega a LP
4. `migrate()` normaliza variants legadas para ids canônicos
5. `LandingPreview` renderiza o schema já migrado

Isso mantém editor e produção alinhados.

## Compatibilidade retroativa

O projeto mantém compatibilidade com ids legados por meio de:

- `legacyIds` em `src/lib/landing-pages/variants.ts`
- normalizadores como `normalizeHeroVariant()`
- `migrate()` em `src/lib/landing-pages/lp-store.ts`

LPs antigas com valores como `split`, `fotoLista`, `timeline` ou `retratoElegante` continuam sendo lidas e convertidas para os ids canônicos atuais.

## Persistência e identificação pública

A URL pública segue:

```text
https://{office_subdomain}.{NEXT_PUBLIC_APP_DOMAIN}/{slug}
```

Exemplo:

```text
https://garcia-e-kleeman.causi.adv.br/previdenciario
```

Regras:

- `slug` é derivado do tema e precisa ser único por conta
- `office_subdomain` é canônico em `lp_accounts.office_subdomain` e único globalmente
- primeira resolução usa `account.name` do Causi slugificado; depois usa sempre o valor persistido
- owner pode alterar em `/configuracoes`; a alteração propaga para todas as LPs da conta

## Estrutura do schema

O contrato principal vive em `src/lib/landing-pages/schema.ts`.

Trechos principais:

```ts
type Layout = {
  hero: HeroVariant;
  dor: DorVariant;
  solucao: SolucaoVariant;
  sobre: SobreVariant;
  equipe?: EquipeVariant;
  areas: AreasVariant;
  etapas: EtapasVariant;
  tones: SectionTones;
  hidden?: Partial<Record<ToggleableSection, boolean>>;
  order?: string[];
};
```

```ts
type LpSchema = {
  theme: Theme;
  office: Office;
  layout: Layout;
  videoId?: string;
  hero: HeroContent;
  dor: DorContent;
  solucao: SolucaoContent;
  areas: AreasContent;
  etapas: EtapasContent;
  faq: FaqContent;
  ctaFinal: CtaFinalContent;
  seo?: SeoMeta;
  customSections?: CustomSection[];
};
```

`schema.layout` é a fonte da verdade para o layout ativo.

## Onde cada peça vive

| Responsabilidade | Arquivo |
|---|---|
| Contrato principal da feature | `src/lib/landing-pages/schema.ts` |
| Defaults espelhados | `src/lib/landing-pages/schema/defaults.ts` |
| Catálogo de variants | `src/lib/landing-pages/variants.ts` |
| Templates | `src/lib/landing-pages/templates.ts` |
| Persistência e migração | `src/lib/landing-pages/lp-store.ts` |
| Validação do editor | `src/forms/LpEditorForm/schema.ts` |
| Estado e ações do editor | `src/hooks/use-lp-editor-form.ts` |
| Shell do editor | `src/components/Builder/editor/editor-shell.tsx` |
| Renderer compartilhado | `src/components/Preview/landing-preview.tsx` |

## Fluxo resumido

```mermaid
flowchart TD
  A[Galeria] --> B[Wizard /nova]
  B --> C[gerar-copy]
  C --> D[gerar-lp]
  D --> E[Editor /lp/[slug]]
  E --> F[saveLpAction]
  F --> G[Publicação]
  G --> H[getLpPublic]
  H --> I[migrate]
  I --> J[LandingPreview]
```

## Referências

- [templates-vs-variants.md](../guides/templates-vs-variants.md)
- [create-variant.md](../guides/create-variant.md)
- [lp-editor-architecture.md](lp-editor-architecture.md)
