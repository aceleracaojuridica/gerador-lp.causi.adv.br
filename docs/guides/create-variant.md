# Como Criar Uma Variant

Guia canônico para adicionar uma nova variação de seção no gerador de landing pages.

## Fonte da verdade

A modelagem de variants vive em `src/lib/landing-pages/variants.ts`.

Esse arquivo concentra:

- IDs canônicos persistidos no schema
- labels e intents usados pelo editor
- compatibilidade com IDs legados via `legacyIds`
- normalizadores usados na leitura de LPs antigas
- regras específicas de elegibilidade da seção `equipe`

O restante do sistema consome esse catálogo.

## Convenção de ID

Cada variant deve usar um identificador estável e semântico:

```text
causi_lp_section_<secao>_<layout>
```

Regras:

- `causi`: namespace do produto
- `lp`: domínio da feature
- `section`: tipo do artefato
- `<secao>`: `hero`, `dor`, `solucao`, `sobre`, `equipe`, `areas`, `etapas`
- `<layout>`: estrutura visual real, não nome comercial

Boas práticas:

- prefira descrever estrutura e conteúdo dominante
- evite ids genéricos como `split`, `grid`, `lista`
- evite ids comerciais como `premium`, `moderno`, `acolhedor`
- use `label` para nome humano e `intent` para contexto editorial

Exemplo:

```ts
export const HERO_VARIANT_SPLIT_MEDIA =
  "causi_lp_section_hero_split_media" as const;

export const HERO_VARIANT_OPTIONS = [
  {
    id: HERO_VARIANT_SPLIT_MEDIA,
    label: "Split 50/50",
    intent: "Equilibra texto e mídia com leitura rápida.",
    legacyIds: ["split"],
  },
] as const;
```

## Checklist obrigatório

Ao criar qualquer variant nova, atualize estes pontos:

1. `src/lib/landing-pages/variants.ts`
2. `src/lib/landing-pages/schema.ts`
3. `src/lib/landing-pages/schema/types.ts`
4. `src/forms/LpEditorForm/schema.ts`
5. `src/components/Sections/<secao>.tsx`
6. `src/lib/landing-pages/templates.ts` se algum template usar a nova variant
7. `docs/guides/templates-vs-variants.md`
8. `docs/features/landing-pages.md`

Se a variant for exibida no editor, o catálogo visual já vem de `variants.ts` via reexport em `src/components/Builder/editor/constants.ts`.

## Passo a passo

### 1. Declarar o ID e a metadata

Adicione no catálogo da seção em `src/lib/landing-pages/variants.ts`:

- constante do ID
- array `*_VARIANTS`
- type derivado
- item em `*_VARIANT_OPTIONS`
- `legacyIds` se houver compatibilidade com nomes antigos

Exemplo de estrutura já usada no projeto:

```ts
export const EQUIPE_VARIANT_SOLO_PORTRAIT =
  "causi_lp_section_equipe_solo_portrait" as const;

export const EQUIPE_VARIANT_OPTIONS = [
  {
    id: EQUIPE_VARIANT_SOLO_PORTRAIT,
    label: "Retrato solo",
    intent: "Apresenta um único advogado em destaque institucional.",
  },
] as const;
```

### 2. Propagar o tipo canônico

O contrato de domínio precisa continuar alinhado em três pontos:

- `src/lib/landing-pages/schema.ts`
- `src/lib/landing-pages/schema/types.ts`
- `src/forms/LpEditorForm/schema.ts`

No estado atual do projeto:

- `schema.ts` reexporta os types vindos de `variants.ts`
- `schema/types.ts` também reexporta os mesmos types
- o Zod do editor usa `z.enum(HERO_VARIANTS)`, `z.enum(EQUIPE_VARIANTS)` e equivalentes

Isso evita divergência entre runtime, TypeScript e validação de persistência.

### 3. Ajustar o schema persistido

Se a nova variant puder ser usada como padrão:

- atualize `DEFAULT_LAYOUT` em `src/lib/landing-pages/schema.ts`
- atualize `DEFAULT_LAYOUT` espelhado em `src/lib/landing-pages/schema/defaults.ts`

Se a variant não for default, não toque nesses valores.

## 4. Garantir compatibilidade retroativa

LPs antigas podem ter ids legados salvos no banco.

Para manter compatibilidade:

- registre `legacyIds` em `src/lib/landing-pages/variants.ts`
- mantenha o normalizador da seção, como `normalizeHeroVariant()`
- garanta que `migrate()` em `src/lib/landing-pages/lp-store.ts` use esse normalizador

No runtime atual, `migrate()` normaliza todas as variants persistidas antes do editor e do preview consumirem o schema.

## 5. Implementar o renderer da seção

Cada seção faz o dispatch da variant dentro de `src/components/Sections/<secao>.tsx`.

Você precisa:

- importar o ID novo
- atualizar a resolução/fallback da seção
- adicionar o branch visual correspondente

Exemplo do padrão atual:

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

Para `equipe`, o componente não usa `switch`; ele resolve a variant e então despacha entre `SoloPortrait`, `SplitAlternado` e `RetratoElegante`.

## 6. Conferir o editor

O editor consome as opções via `src/components/Builder/editor/constants.ts`, que hoje só reexporta o catálogo de `variants.ts`.

Na prática, você normalmente não precisa cadastrar labels duas vezes.

Só será necessário mexer no editor quando a variant exigir regra de disponibilidade, fallback ou aviso específico.

Os pontos centrais ficam em:

- `src/components/Builder/editor/editor-shell.tsx`
- `src/components/Builder/editor/section-variant-picker.tsx`

## 7. Atualizar templates apenas se fizer sentido

Templates vivem em `src/lib/landing-pages/templates.ts`.

Atualize um template somente se a nova variant fizer parte de um preset de layout.

Não existe obrigação de toda variant aparecer em template.

## 8. Validar criação, editor e publicação

Uma variant nova precisa funcionar em três fluxos:

1. criação de LP via `src/app/api/gerar-lp/route.ts`
2. preview no editor via `src/components/Preview/landing-preview.tsx`
3. site publicado, que usa o mesmo renderer

Se o componente da seção e o schema estiverem corretos, preview e publicação tendem a ficar alinhados automaticamente porque compartilham `LandingPreview`.

## Regra especial da seção `equipe`

`Equipe` possui elegibilidade por quantidade de advogados.

Fonte da regra:

- `src/lib/landing-pages/variants.ts`
- `src/components/Builder/editor/editor-shell.tsx`
- `src/components/Sections/equipe.tsx`

Estado atual:

| Quantidade de advogados | Variant disponível no editor | Fallback automático quando `layout.equipe` está vazio | Comportamento |
|---|---|---|---|
| `0` | nenhuma | nenhuma | seção não pode ser ativada |
| `1` | `causi_lp_section_equipe_solo_portrait` | nenhuma | editor pode aplicar a variant solo ao ativar a seção |
| `2-3` | `causi_lp_section_equipe_split_alternating`, `causi_lp_section_equipe_portrait_grid` | `causi_lp_section_equipe_split_alternating` | preview renderiza equipe enxuta |
| `4+` | `causi_lp_section_equipe_split_alternating`, `causi_lp_section_equipe_portrait_grid` | `causi_lp_section_equipe_portrait_grid` | preview prioriza grade |

Detalhes importantes:

- `getAvailableEquipeVariants()` define quais options aparecem
- `getAutoEquipeVariant()` resolve fallback automático apenas para `2+`
- `getToggleEquipeVariant()` aplica `Retrato solo` ao ativar a seção com `1` advogado
- `isEquipeVariantAllowed()` valida se a combinação atual pode continuar ativa
- `editor-shell.tsx` oculta a seção automaticamente quando a combinação fica inválida
- o editor mostra toast discreto e um bloco centralizado de avisos no painel lateral

Essa é a regra atual do produto. Ao criar uma nova `EquipeVariant`, atualize essas funções deliberadamente.

## Fluxo mínimo para adicionar uma variant

Se a nova variant não tiver regras especiais, o caminho mínimo costuma ser:

1. declarar o id e metadata em `variants.ts`
2. propagar os unions e enums
3. implementar o branch visual da seção
4. atualizar template, se necessário
5. validar preview, save e publicação
6. atualizar a documentação

## Arquivos de referência

- `src/lib/landing-pages/variants.ts`
- `src/lib/landing-pages/schema.ts`
- `src/lib/landing-pages/schema/types.ts`
- `src/lib/landing-pages/schema/defaults.ts`
- `src/forms/LpEditorForm/schema.ts`
- `src/lib/landing-pages/lp-store.ts`
- `src/components/Builder/editor/editor-shell.tsx`
- `src/components/Preview/landing-preview.tsx`
- `src/lib/landing-pages/templates.ts`
