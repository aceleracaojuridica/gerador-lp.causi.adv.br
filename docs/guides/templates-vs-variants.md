# Templates vs Variants

Referência canônica sobre o papel dos templates e das variants de seção no gerador de landing pages.

## Dois conceitos diferentes

| Conceito | O que é | Onde vive |
|---|---|---|
| **Template** | Preset de layout usado como ponto de partida visual | `src/lib/landing-pages/templates.ts` |
| **Variant de seção** | Escolha individual de layout por seção | `schema.layout.<secao>` |

O produto renderiza pela combinação de variants registradas em `schema.layout`.

O template existe para preencher esse layout inicial no wizard e para reaplicar uma combinação pronta no editor.

## O que realmente persiste

O banco salva o schema completo da landing page em `landing_pages.schema`.

O que dirige preview e publicação é o snapshot salvo em `schema.layout`, por exemplo:

```json
{
  "layout": {
    "hero": "causi_lp_section_hero_split_media",
    "dor": "causi_lp_section_dor_with_image_cards",
    "solucao": "causi_lp_section_solucao_image_icon_list",
    "sobre": "causi_lp_section_sobre_photo_list",
    "areas": "causi_lp_section_areas_grid_icon_cards",
    "etapas": "causi_lp_section_etapas_numbered_steps",
    "tones": {
      "hero": "light",
      "dor": "light",
      "solucao": "dark"
    }
  }
}
```

Nenhum `template.id` é persistido como fonte de verdade de runtime.

## Fonte da verdade de variants

O catálogo canônico fica em `src/lib/landing-pages/variants.ts`.

Esse arquivo define:

- ids semânticos com prefixo `causi_`
- arrays `*_VARIANTS`
- labels e intents do editor
- `legacyIds` para leitura retrocompatível
- normalizadores por seção
- regras específicas de elegibilidade de `equipe`

`schema.ts`, `schema/types.ts`, `LpEditorForm/schema.ts` e o editor reutilizam esse catálogo.

## Papel do template no wizard

No wizard:

- o usuário escolhe um template opcional
- o template fornece `layout` inicial
- a paleta usada na LP vem da logo ou da `theme` enviada no payload
- `POST /api/gerar-lp` recebe `layout` explícito e persiste o schema resultante

O endpoint `src/app/api/gerar-lp/route.ts` usa o `layout` recebido ou `DEFAULT_LAYOUT`.

Se houver `videoId`, o endpoint força `hero = HERO_VARIANT_VIDEO_EMBEDDED`.

## Papel do template no editor

No editor, o `ModeloPicker` usa `form.applyTemplate(template)`.

O comportamento atual é:

- reaplica `template.layout`
- preserva `layout.order`
- mescla `layout.hidden` atual com `template.layout.hidden`
- não altera textos
- não altera imagens
- não altera `theme`

O texto do próprio `ModeloPicker` descreve esse comportamento: aplica layouts e fundos das seções, mantendo textos e imagens.

## Como a página decide o layout final

`LandingPreview` recebe o `LpSchema` completo e passa as variants de `schema.layout` para cada seção.

Exemplo simplificado:

```tsx
<Hero
  content={schema.hero}
  variant={schema.layout.hero}
  tone={schema.layout.tones.hero}
/>
```

O componente da seção faz o dispatch da variant:

```tsx
switch (props.variant) {
  case HERO_VARIANT_SPLIT_MEDIA:
    return <HeroSplit {...props} />;
  case HERO_VARIANT_VIDEO_EMBEDDED:
    return <HeroVideo {...props} />;
  default:
    return <HeroCentered {...props} />;
}
```

O mesmo princípio vale para `Dor`, `Solucao`, `Sobre`, `Areas`, `Etapas` e `Equipe`.

## Compatibilidade com LPs antigas

LPs persistidas com ids legados continuam funcionando porque `src/lib/landing-pages/lp-store.ts` normaliza o schema na leitura.

Fluxo atual:

1. `getLp()` ou `getLpPublic()` carrega a linha do banco
2. `migrate()` normaliza `layout.hero`, `layout.dor`, `layout.solucao`, `layout.sobre`, `layout.equipe`, `layout.areas` e `layout.etapas`
3. o editor e o preview passam a trabalhar só com ids canônicos

Por isso, template e renderização atuais podem conviver com dados antigos sem regravar o banco imediatamente.

## Templates disponíveis hoje

Os presets atuais são:

| Template | `id` |
|---|---|
| Clássico | `classic-light` |
| Moderno | `modern-dark` |
| Autoridade | `autoridade` |
| Acolhedor | `warm-neutral` |

Cada um define uma combinação de:

- variant por seção
- tom por seção em `layout.tones`
- visibilidade inicial em `layout.hidden`

## Fluxo completo

```mermaid
flowchart TD
  subgraph wizard [Wizard /nova]
    W1[Usuário escolhe template opcional]
    W2[Frontend envia layout inicial]
    W3[POST /api/gerar-lp]
  end
  subgraph editor [Editor /lp/[slug]]
    E1[ModeloPicker ou picker por seção]
    E2[saveLpAction salva schema]
  end
  subgraph public [Publicação]
    P1[getLpPublic]
    P2[migrate normaliza variants]
    P3[LandingPreview renderiza schema.layout]
  end
  W1 --> W2 --> W3
  W3 --> E1 --> E2
  E2 --> P1 --> P2 --> P3
```

## Exemplo prático

1. O wizard cria a LP com o template `modern-dark`.
2. O payload leva uma combinação de variants como `hero split`, `sobre overlay`, `etapas timeline`.
3. A LP é salva com esses valores em `schema.layout`.
4. No editor, o usuário troca apenas `hero` para `causi_lp_section_hero_stats_authority`.
5. A publicação passa a renderizar o hero com métricas, independentemente do template original.

## Quando usar template e quando usar variant

Use template quando:

- quiser um ponto de partida rápido
- quiser trocar várias seções de uma vez
- quiser aplicar uma composição pronta de tons e layouts

Use variant quando:

- quiser controlar uma seção isoladamente
- precisar respeitar regras de negócio específicas, como `equipe`
- quiser refinar o layout sem mexer no restante da LP

## Caso especial: `equipe`

A seção `equipe` não é só estética; ela possui regra de elegibilidade.

Hoje o editor:

- bloqueia ativação com `0` advogados
- permite apenas `Retrato solo` com `1` advogado
- permite apenas variants de equipe com `2+`
- oculta a seção se a combinação atual ficar inválida
- exibe toast discreto e um bloco centralizado de avisos

Isso reforça a diferença entre:

- template: preset visual
- variant: estado real de layout com regra de negócio embutida

## Onde cada peça vive

| Responsabilidade | Arquivo |
|---|---|
| Catálogo canônico de variants | `src/lib/landing-pages/variants.ts` |
| Contrato `Layout` e `LpSchema` | `src/lib/landing-pages/schema.ts` |
| Defaults espelhados do schema | `src/lib/landing-pages/schema/defaults.ts` |
| Templates | `src/lib/landing-pages/templates.ts` |
| Normalização retrocompatível | `src/lib/landing-pages/lp-store.ts` |
| Validação Zod do editor | `src/forms/LpEditorForm/schema.ts` |
| Reexport das opções no editor | `src/components/Builder/editor/constants.ts` |
| Aplicação de template no editor | `src/hooks/use-lp-editor-form.ts` |
| Renderer compartilhado | `src/components/Preview/landing-preview.tsx` |

## Referências

- [create-variant.md](./create-variant.md)
- [landing-pages.md](../features/landing-pages.md)
