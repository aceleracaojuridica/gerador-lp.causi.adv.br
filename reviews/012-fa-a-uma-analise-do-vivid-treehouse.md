# IA como decisora de layout + remoção de Templates

## Contexto

Hoje a criação de uma landing page combina três fontes de decisão: (1) a logo enviada gera a paleta de cores via extração determinística no navegador, (2) a IA (OpenAI) já gera a copy inteira e já rankeia semanticamente as imagens de cenário, mas (3) o **layout** (qual variante de cada seção — hero, dor, solução, sobre, equipe, áreas, etapas — e qual tom claro/escuro) vem de um **Template** pré-fabricado que o advogado escolhe manualmente de uma grade de 4 opções fixas.

O dono do produto quer eliminar essa escolha manual de Template porque ela produz combinações genéricas, desconectadas do conteúdo e da paleta específicos de cada LP, e quer que a IA decida — dentro do conjunto de variantes já existentes — qual combinação melhor serve aquele advogado/tema, do mesmo jeito que já decide a copy e as imagens. A IA nunca inventa uma variante nova; ela escolhe entre as opções que já existem no catálogo (`variants.ts`), com garantia estrutural de que a escolha é sempre um ID válido.

Investigação confirmou que a preocupação de "contraste incorreto" do Template é resolvida arquiteturalmente por design (`docs/guides/variant-design-system.md`): toda variante de toda seção já é obrigada a funcionar em ambos os tons, e os overlays de imagem (`colors.ts`) já garantem legibilidade de texto sobre qualquer foto. O ganho real de remover Template não é "consertar contraste" — é substituir uma escolha genérica de preset por uma escolha bespoke, adaptada ao tema/paleta/conteúdo de cada LP.

Decisões de produto já confirmadas com o usuário:
- Extração de paleta continua **100% determinística** (algoritmo HSL atual em `colors.ts`) — sem chamada de IA nessa etapa.
- A "foto" mencionada pelo usuário é a **logo já existente** no wizard — nenhum campo novo de upload.
- O `ModeloPicker` do editor é **removido sem substituto** — a escolha de layout acontece uma vez, na criação; o editor mantém só o ajuste manual seção-por-seção que já existe.
- Tags de "mood" nas imagens do catálogo ficam para uma v2 — nesta entrega a paleta extraída entra apenas como contexto textual no prompt de ranking de imagens.

## Arquitetura alvo

```
Wizard "Imagens" (sem mudança de UI além de remover a grade de templates)
  └─ upload de logo → extractPalette() [client, canvas, já existe, sem mudança]
       └─ Theme extraído
            └─ POST /api/gerar-copy (paralelo):
                 ├─ callOpenAiForCopy()            [gpt-4o, já existe, sem mudança de contrato]
                 ├─ chooseLayoutWithAi()            [NOVO — gpt-4o-mini, structured output]
                 └─ pickSystemImagesWithAiRanking()  [já existe, ganha paletteHint textual]
            devolve { copy, images, layout }
            └─ POST /api/gerar-lp: salva copy + layout + images, tudo já resolvido
```

## Peça 1 — Escolha de variante + tom por seção via IA (a peça nova)

**Novo arquivo**: `src/lib/landing-pages/lp-generate-layout.ts` (padrão espelhando `lp-generate-copy.ts` + o fallback de `system-default-images.ts`).

- **Schema de resposta estruturada** (não reaproveitar o `layoutSchema` de `src/forms/LpEditorForm/schema.ts` — aquele é permissivo para formulário e incompatível com `strict: true` de structured outputs). Criar `aiLayoutSchema` próprio no novo arquivo, usando `z.enum(HERO_VARIANTS)`, `z.enum(DOR_VARIANTS)`, `z.enum(SOLUCAO_VARIANTS)`, `z.enum(SOBRE_VARIANTS)`, `z.enum(EQUIPE_VARIANTS).nullable()`, `z.enum(AREAS_VARIANTS)`, `z.enum(ETAPAS_VARIANTS)` + um objeto `tones` com `z.enum(["light","dark"])` por seção (todas importadas de `src/lib/landing-pages/variants.ts` — nunca podem divergir dos IDs reais).
- **Antes de codar**: validar se `zodResponseFormat` (`openai/helpers/zod`) funciona direto com zod v4.3.6 instalado no projeto; se não, montar `response_format: { type: "json_schema", json_schema: { name, schema: z.toJSONSchema(aiLayoutSchema), strict: true } }` usando a conversão nativa do zod v4. Isso é um spike técnico curto, não uma decisão de produto.
- **Prompt**: serializar `HERO_VARIANT_OPTIONS`, `DOR_VARIANT_OPTIONS`, `SOLUCAO_VARIANT_OPTIONS`, `SOBRE_VARIANT_OPTIONS`, `AREAS_VARIANT_OPTIONS`, `ETAPAS_VARIANT_OPTIONS` (cada uma já com `id`+`label`+`intent` em `variants.ts`) como menu de opções por seção. Para `equipe`, filtrar `EQUIPE_VARIANT_OPTIONS` por `getAvailableEquipeVariants(lawyerCount)` **antes** de montar o prompt (nunca oferecer à IA uma opção inelegível); se `lawyerCount === 0`, omitir a seção do prompt e forçar `equipe: null` no resultado independentemente do que a IA disser. Contexto adicional: `tema`, `about`, paleta extraída (hex, como texto descritivo), presença de vídeo, presença de métricas reais (`office.metrics`).
- **Regra de vídeo**: manter o override determinístico que já existe em `/api/gerar-lp` (força `HERO_VARIANT_VIDEO_EMBEDDED` se houver `videoId`) — não duplicar essa lógica no prompt, só documentar no prompt que isso é aplicado automaticamente depois.
- **Fallback determinístico**: `chooseLayoutDeterministic(input)` — parte de `DEFAULT_LAYOUT`, aplica `getAutoEquipeVariant(lawyerCount)`, aplica a regra de vídeo. `chooseLayoutWithAi()` tenta a chamada de IA, valida a resposta de novo em código com `isEquipeVariantAllowed()` (defesa em profundidade além do `z.enum` fechado), e cai no fallback determinístico em qualquer erro/timeout/resposta inválida — mesmo padrão já usado em `pickSystemImagesWithAiRanking`.
- **Modelo**: `gpt-4o-mini` (mesma escolha de custo/latência já validada no ranking de imagens; a tarefa é escolher entre poucas opções por um menu curto, não exige o raciocínio de `gpt-4o`).

## Peça 2 — Integração no pipeline

- `src/app/api/gerar-copy/route.ts`: rodar `callOpenAiForCopy(...)` e `chooseLayoutWithAi(...)` em `Promise.all` (paralelo — a chamada de layout é mais curta que a de copy, não aumenta a latência total). Incluir `layout` no `Response.json({ copy, images, layout })`.
- `src/app/api/gerar-lp/route.ts`: hoje usa `p.layout ?? DEFAULT_LAYOUT` (linha ~207) vindo do template escolhido no wizard. Trocar por: se `p.layout` já veio no payload (porque o wizard chamou `/api/gerar-copy` antes), usá-lo direto; se não (fluxo de geração direta, sem preview — já existe esse branch hoje para `copy`, linhas ~121-138), chamar `chooseLayoutWithAi` ali também, no mesmo padrão do branch de copy. Manter inalterada a regra de override de vídeo (linhas ~216-224).
- `src/lib/landing-pages/system-default-images.ts`: estender `pickSystemImagesWithAiRanking`/`rankSystemImagesByAi`/`buildRankerPrompt` para aceitar um `paletteHint?: string` opcional (função nova `describeThemeMood(theme: Theme): string`, classificação simples de hue/lightness em rótulos como "sóbrio"/"caloroso"/"moderno" a partir do `Theme` já extraído) e incluir esse hint na string de contexto enviada à IA, ao lado do `tema`. Isso é o ganho de "imagens com contraste/clima correto" desta entrega — sem precisar remarcar o catálogo (fica para v2).

## Peça 3 — Remoção completa de Templates

**Remover integralmente:**
- `src/app/templates/page.tsx`, `src/app/templates/[id]/page.tsx`, `src/app/templates/template-material-card.tsx`, `src/app/templates/templates-gallery.css` (rota pública de galeria)
- `src/lib/landing-pages/templates.ts` (`TEMPLATES`, `LpTemplate`, `getTemplate`, `DEFAULT_TEMPLATE_ID`, `templatePreviewSrc`)
- `src/components/Builder/create/template-card.tsx` (`TemplateCard`)
- `public/templates/*.png` (confirmar caminho exato via Glob antes de apagar)
- `ModeloPicker` inteiro em `src/components/Builder/editor/panels/layout-panel.tsx`

**Editar:**
- `src/forms/LandingPageCreateForm/landing-page-create-form.tsx`: remover imports/estado de template (`TEMPLATES`, `DEFAULT_TEMPLATE_ID`, `getTemplate`, `selectedTemplateId`, `TemplateCard`), remover o bloco JSX "Estrutura inicial"; `savePayload.layout` passa a vir do `layout` devolvido por `/api/gerar-copy` (guardar em estado ao lado de `generatedCopy`/`generatedImages`, que já existem em `generateAndSaveLandingPage()`).
- `src/components/Builder/editor/editor-shell.tsx`: remover import de `TEMPLATES`, o cálculo de `currentTemplateId`, a entrada `{ id: "modelo", ... }` de `editorSections`, o `case "modelo":` e a renderização de `<ModeloPicker />`.
- `src/components/Builder/editor/constants.ts`: remover `"modelo"` de `DetailSectionId` e de `DETAIL_SECTION_IDS`.
- `src/hooks/use-lp-editor-form.ts`: remover import de `LpTemplate`, a função `applyTemplate()` e sua entrada no objeto retornado pelo hook.
- `src/lib/supabase/proxy.ts`: remover as duas linhas de `isPublicRoute` que isentavam `/templates` e `/templates/*`.

**Manter sem alteração** (conceitos distintos de Template):
- `src/lib/landing-pages/palettes.ts` e os dois `PalettePicker` (wizard e editor) — são só cor, não layout; seguem como override manual pós-extração.
- `src/components/Builder/editor/section-variant-picker.tsx` e os `*_VARIANT_OPTIONS` reexportados em `constants.ts` — pickers granulares por seção no editor, continuam existindo para ajuste manual pós-geração.
- `"templates"` em `RESERVED_SEGMENTS` (`src/lib/landing-pages/public-routing.ts`) — sem custo manter reservado, evita colisão futura com o slug de uma LP publicada.

**Checagem final antes do PR**: `grep -rn "from \"@/lib/landing-pages/templates\""` e `grep -rn "templates-gallery"` em `src/` para garantir que nada ficou pendurado fora da lista acima (falsos positivos já identificados e a ignorar: `src/lib/media/paths.ts`/`types.ts` — "certificate_template", feature de LMS; `src/lib/constants/agents.ts` — templates de texto de agente IA; `src/app/(auth)/template.tsx` — convenção de rota do Next.js, não relacionado).

## Ordem de implementação

1. `lp-generate-layout.ts` (Peça 1) — implementar e testar isoladamente (script/rota de debug) antes de integrar.
2. `system-default-images.ts` — adicionar `paletteHint`/`describeThemeMood` (Peça 2, independente do resto, pode ser feito em paralelo ao passo 1).
3. `gerar-copy/route.ts` — integrar `chooseLayoutWithAi` em paralelo à copy, devolver `layout` na resposta.
4. `gerar-lp/route.ts` — consumir `p.layout` resolvido ou chamar `chooseLayoutWithAi` no branch sem preview prévio.
5. Wizard (`landing-page-create-form.tsx`) — consumir `layout` da resposta de `/api/gerar-copy`, remover a UI de templates.
6. Remoção de Templates (Peça 3) — rota pública, `templates.ts`, `TemplateCard`, `ModeloPicker`, `applyTemplate`, `DetailSectionId: "modelo"`, `currentTemplateId`, isenção em `proxy.ts`. Feito por último, depois que os passos 3-5 já funcionam com a nova fonte de `layout`.

## Verificação end-to-end

- Rodar o wizard completo (`/nova`) do zero: enviar uma logo colorida, preencher tema/about, confirmar que a página final vem com uma combinação de variantes coerente com o tema (ex.: tema "Direito Previdenciário" com 3 advogados deve produzir `equipe: split_alternating`, nunca `solo_portrait`).
- Testar o caso `lawyerCount === 0`: confirmar que a seção equipe fica ausente/oculta e a IA nunca retorna um `equipe` inválido.
- Testar com `OPENAI_API_KEY` temporariamente inválida/ausente: confirmar que `chooseLayoutWithAi` cai no fallback determinístico sem quebrar a criação da LP (mesmo comportamento hoje já testável em `pickSystemImagesWithAiRanking`).
- Confirmar visualmente que `/templates` e `/templates/[id]` retornam 404 (rota removida) e que o editor de uma LP existente não mostra mais a seção "Modelo".
- Rodar `pnpm build`/typecheck para garantir que nenhuma referência a `templates.ts`/`LpTemplate` ficou pendurada.

---

Plano executado. A criação de LP agora centraliza as decisões da IA no pipeline, sem escolha manual de template.

## O que mudou

### 1. Escolha de layout via IA (`lp-generate-layout.ts`)
- Nova função `chooseLayoutWithAi()` usa `gpt-4o-mini` com JSON estruturado validado por `aiLayoutSchema` (variantes reais de `variants.ts`)
- Contexto no prompt: tema, about, paleta da logo, quantidade de advogados, vídeo e métricas
- `chooseLayoutDeterministic()` como fallback (mesmo padrão do ranking de imagens)
- Override de vídeo: `HERO_VARIANT_VIDEO_EMBEDDED` quando há `videoId`

### 2. Pipeline integrado
- **`/api/gerar-copy`**: roda copy + layout em `Promise.all`; retorna `{ copy, images, layout }`; passa `paletteHint` ao ranker de imagens
- **`/api/gerar-lp`**: usa `layout` do payload ou chama `chooseLayoutWithAi` no fluxo direto
- **`describeThemeMood()`**: classifica a paleta (ex.: "sóbrio, paleta escura") para melhorar o ranking semântico de imagens

### 3. Wizard (`/nova`)
- Removida a grade "Estrutura inicial" (4 templates)
- Envia `theme`, `lawyerCount` e `videoId` para `/api/gerar-copy`
- Salva a LP com o `layout` devolvido pela IA

### 4. Templates removidos
- Rotas `/templates` e `/templates/[id]`
- `templates.ts`, `TemplateCard`, `ModeloPicker`, `applyTemplate`
- Seção "Modelo" do editor
- Assets em `public/templates/`

## Premissa mantida (conforme o plano)

A **extração de paleta continua 100% determinística** via `extractPalette()` no navegador — não há chamada de IA para cores. A IA usa a paleta já extraída como contexto para escolher layout e imagens.

## Verificação

- `pnpm build` passou
- `/templates` não aparece mais nas rotas
- Nenhuma referência pendente a `templates.ts` / `LpTemplate` em `src/`

## Fluxo atual

```
Logo → extractPalette() [cliente, determinístico]
  └─ POST /api/gerar-copy (paralelo):
       ├─ callOpenAiForCopy()           → copy
       ├─ chooseLayoutWithAi()          → layout
       └─ pickSystemImagesWithAiRanking(paletteHint) → images
  └─ POST /api/gerar-lp → salva tudo
```

No editor, o advogado ainda pode ajustar variantes seção a seção pelos pickers granulares existentes — só não há mais preset global de "Modelo".dd