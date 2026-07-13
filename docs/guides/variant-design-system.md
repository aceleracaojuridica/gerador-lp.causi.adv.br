# Design System — Variantes de Seção

Guia canônico de design para criação e refatoração de variantes visuais no Gerador de Landing Pages Causi.
O guia técnico de registro (IDs, TypeScript, arquivos) está em [`create-variant.md`](./create-variant.md).

---

## 1. Princípios inegociáveis da marca

O produto serve advogados regulados pelo Provimento OAB 205/2021. Qualquer variante deve comunicar:

| Princípio | O que é | O que não é |
|---|---|---|
| **Sério, não genérico** | Vitrine de escritório jurídico | Landing page de SaaS ou app de consumo |
| **Premium, não ostentoso** | Espaço branco generoso, tipografia ajustada, detalhes finos | Gradientes vibrantes, emojis, ícones 3D, sombras pesadas |
| **Confiável, não frio** | Autoridade com acolhimento | Burocrático ou distante |
| **Discreto nos ornamentos** | Textura de estúdio, opacidade 5–12% | Elementos decorativos que chamam atenção para si mesmos |

### Anti-padrões — proibido em qualquer variante

- Gradientes coloridos saturados (roxo→rosa, azul→ciano vibrante).
- Emojis como ícone — sempre ícones de linha (stroke), peso consistente, biblioteca única.
- Sombras drop-shadow pesadas ou cards "flutuando" agressivamente.
- Bordas arredondadas excessivas em blocos grandes (pill-shape lê como produto de consumo).
- Cards com fundo branco puro sobre fundo branco puro sem separação sutil.
- Glassmorphism exagerado, blur decorativo sem função, texturas pesadas ou ruído.
- Numeração decorativa (01/02/03) quando o conteúdo não é uma sequência real ordenada.
- Estatísticas, casos ou taxas de êxito inventados — números só aparecem se vierem dos dados reais do escritório.

---

## 2. Sistema de tokens (o que NUNCA varia entre variantes)

Toda variante **consome** tokens do `theme` da LP — nunca define cor, fonte ou raio própria.

### 2.1 Paleta de papéis

| Papel | Função | Jamais |
|---|---|---|
| `brand` | Cor principal (extraída da logo). Fundo de seções tom `dark`, botões primários, destaques. | Fundo preto puro (`#000`) ou branco puro (`#fff`) |
| `brandDark` | Variação mais escura de `brand` — para hover de botões e gradientes tonais sutis. | Substituído por preto ou cinza genérico |
| `accent` | Cor complementar (dourado, terracota, etc.). Bordas finas, ícone, sublinhado de destaque — 1 elemento por seção no máximo. | Fundo de bloco grande inteiro |
| `accentSoft` | Versão rebaixada de `accent` — fundos de chips, badges, destaques leves. | Tom principal de seção |
| `ink` | Texto sobre fundo claro. | |
| `cream` | Fundo claro — nunca `#FFFFFF` puro, sempre off-white levemente quente (ex. `#fdfcfa`, `#f9f8f6`). | Branco puro |
| `inkOnBrand` | Texto sobre fundo `brand` — claro quente, nunca branco puro. | |

Regras de alternância de tom entre seções:

- Seções alternam `light`/`dark` para criar ritmo de leitura.
- A alternância é controlada pelo editor (`tones`), não fixada por variante.
- Toda variante precisa funcionar bem nos dois tons.

### 2.2 Tipografia

Fontes vêm do `theme` (importadas do Google Fonts). A escala de tamanhos é fixa e compartilhada por todas as variantes:

| Papel | Fonte | Desktop | Mobile | Uso |
|---|---|---|---|---|
| `heading` (serif) | Playfair Display | 40px | 30px | Títulos de seção (h2 — somente h1 no Hero) |
| `body` (sans) | Montserrat | 20px | 18px | Corpo, cards, nav, botões |
| `eyebrow` | Montserrat | 14px uppercase, tracking amplo | 14px | Subtítulo acima do título — obrigatório em toda seção |
| `cardTitle` | Montserrat semibold | 24px | 20px | Título dentro de cards |
| `faqAnswer` | Montserrat | 18px | 16px | Respostas de accordion |

**Regra inviolável em toda variante:** `eyebrow uppercase → título serif → corpo sans`.

Essa sequência de três níveis é a assinatura tipográfica do produto. Deve aparecer em toda seção, em toda variante — é o que faz duas variantes de seções diferentes parecerem da mesma família visual mesmo com layouts opostos.

Sem underlines em texto corrido — exceção única: link de Política de Privacidade no rodapé e no popup de contato.

### 2.3 Espaçamento, raio e sombra

- Escala em múltiplos de 4px/8px.
- Padding vertical de seção: mínimo **80px** desktop / **48px** mobile — o respiro é o sinal de premium.
- Raio: 4px em botões/inputs, 8–12px em cards. Nunca `0` (brutalista) nem `>16px` (consumer app) como padrão.
- Sombra: no máximo um nível sutil (`0 1px 3px rgba(0,0,0,0.08)`) para separar cards. Nunca múltiplas sombras ou sombras coloridas.

### 2.4 Elemento decorativo de fundo

Cada seção deve ter **no máximo um** ornamento de fundo (arco, linha curva, gradiente tonal, traço geométrico):

- Opacidade: **5–12%** (em CTA intermediário: 4–6%).
- Cor: sempre `brand` ou `accent` do tema — nunca cor nova.
- Nunca interativo, nunca animado continuamente.
- Posição: cantos ou atrás de imagens — **nunca atrás de texto de corpo**.
- Esse motivo decorativo é o "traço de estúdio" que amarra visualmente todas as seções entre si.

### 2.5 Logo

- Tamanho: **230px** desktop / **180px** mobile.
- Aparece **somente no Hero** — nunca no meio da página nem no rodapé.
- Com fundo transparente: integrado suavemente em qualquer fundo claro ou escuro.

---

## 3. O que PODE e o que NÃO PODE variar entre variantes

**Fixo em toda variante (não reinventar):**
- Paleta, papéis de cor, tipografia, escala de espaçamento, raio, sombra, motivo decorativo, sequência eyebrow → título → corpo.

**Variável de verdade (o que justifica a variante existir):**
- Proporção e posição de mídia (imagem/vídeo) vs. texto.
- Número e disposição de cards/blocos.
- Direção de leitura: horizontal, vertical, diagonal, alternado.
- Densidade de informação: compacta vs. expandida.
- Ênfase visual: o que "pesa mais" na composição — foto, número, texto.

> Uma variante que só muda cor ou fonte **não é uma variante válida** — isso quebraria a coerência entre seções.

---

## 4. Especificações por seção

### 4.1 Hero

| Variante | Diferença estrutural | Proporção desktop | Mobile |
|---|---|---|---|
| `centered_focus` | Mensagem centralizada, sem mídia lateral. Foco total em texto + CTA. | 100% texto | Igual |
| `split_media` | Divisão texto/mídia, leitura horizontal rápida. | ~50/50 | Imagem abaixo do texto |
| `video_embedded` | Vídeo como prova social; hierarquia: vídeo próximo ao texto, sem disputar o CTA. | Vídeo em coluna direita | Vídeo abaixo do texto |
| `stats_authority` | Assimétrico: texto+CTA (58%) + foto em card com borda `accent` (30%) + 3 métricas reais na base esquerda. | 58/30 + base | Sem foto lateral; métricas abaixo do botão |
| `cutout_portrait` | Retrato do advogado em recorte (cutout) como elemento gráfico central; texto ao redor. | Imagem sobreposta / sem moldura | Retrato acima do texto |

Regras específicas do Hero:

- É a **única** seção com logo do escritório.
- `stats_authority`: métricas (anos de atuação, casos atendidos, premiações) **nunca são inventadas** — vêm dos dados reais do escritório.
- Overlay gradiente em variante com imagem full-width: tonal, nunca cor sólida chapada.

### 4.2 Dor

Tom obrigatório: reconhecer o problema do cliente com empatia **antes** de apresentar a solução — nunca alarmista.

| Variante | Diferença estrutural | Mobile |
|---|---|---|
| `with_image_cards` | Superior: 2 colunas (texto de empatia + imagem). Inferior: 3 cards de dor com ícone, título e 1–2 frases. | Imagem acima, cards empilhados |
| `cards_compact` | Sem bloco de imagem — só cards. Para quando não há imagem contextual de qualidade. | Cards empilhados |

### 4.3 Solução

| Variante | Diferença estrutural | Mobile |
|---|---|---|
| `with_image_cards` | Apoio visual + cards, tom propositivo. Estrutura espelhada da Dor com imagem. | Imagem acima, cards abaixo |
| `cards_compact` | Só cards, leitura rápida. Mínimo 4 cards em número par. | Cards empilhados |
| `image_list` | Header + solução em lista enxuta (bullets, 2 colunas, sem ícones) ao lado da imagem. Layout compartilhado com a Dor (`ImageListBlock`). | Lista acima, imagem abaixo |

### 4.4 Sobre

| Variante | Diferença estrutural | Mobile |
|---|---|---|
| `photo_list` | Esquerda (38%): foto com fundo `brand`. Direita (62%): eyebrow, título, 4 diferenciais com ícone circular. Primeiro diferencial destacado (fundo `brand`), demais com borda sutil. | Foto acima, lista abaixo |
| `overlay_portrait` | Texto sobreposto ao retrato. Única variante onde texto e imagem ocupam o mesmo plano — exige scrim/gradiente sutil atrás do texto, nunca cor sólida. Contraste AA garantido. | Texto abaixo da imagem |
| `two_columns_portrait` | Colunas separadas e equilibradas, sem sobreposição. | Colunas empilhadas |

### 4.5 Equipe

As três variantes são funcionalmente determinadas por `getAutoEquipeVariant()` — mas visualmente precisam parecer a mesma família (mesmo tratamento de retrato: enquadramento, moldura, consistência de cor).

| Variante | Uso | Mobile |
|---|---|---|
| `solo_portrait` | Um único advogado em destaque institucional. Exclusiva para estrutura solo (1 advogado). | Retrato centralizado, texto abaixo |
| `split_alternating` | Alterna retrato/texto por advogado. Para equipes enxutas (2–3). | Empilhamento alternado |
| `portrait_grid` | Grade de retratos. Para equipes maiores (4+). | Grade 2 colunas |

### 4.6 Áreas

| Variante | Diferença estrutural |
|---|---|
| `grid_icon_cards` | Cards em grade com ícone — leitura rápida, escaneável. |
| `list_bands` | Faixas de leitura vertical, mais editorial — adequado para 2–4 áreas com texto mais denso. |

### 4.7 Etapas

Numeração é válida aqui porque o conteúdo **é** uma sequência real ordenada. 4 etapas como padrão.

| Variante | Diferença estrutural |
|---|---|
| `numbered_steps` | Passos numerados lado a lado, sem ícones decorativos. |
| `timeline_flow` | Linha do tempo vertical conectando as etapas com traço fino — o motivo decorativo da seção pode ser o próprio conector. |

### 4.8 Seções sem variação de layout

**FAQ:** Um único layout. Accordion com fundo `brand` no item aberto. Sem underline em nenhum estado.

**CTA Intermediário:** Fundo `brand` escuro, centralizado. Ícone (WhatsApp ou envelope), título, texto 2–3 linhas, botão CTA. Ornamento: arcos 4–6% opacidade. Inserido entre a seção de valores e o FAQ.

**Footer:** Sempre fundo `brand`. Texto `inkOnBrand`. Motivo decorativo em opacidade mínima (5%). Sem logo. Duas colunas: atendimento / contato. Ícones SVG para redes sociais — nunca texto ou imagens estáticas. Link "Criado por Causi" obrigatório.

---

## 5. Comportamento responsivo

Regras transversais de reflow mobile — aplicam-se a toda variante:

| Padrão desktop | Comportamento mobile |
|---|---|
| Split imagem + texto | Imagem acima, texto abaixo |
| Grid de cards | 1 coluna empilhada |
| Métricas na base do Hero `stats_authority` | Abaixo do CTA, sem foto lateral |
| Accordion de FAQ | Mantém accordion |
| Coluna de diferenciais (Sobre `photo_list`) | Lista abaixo da foto |

---

## 6. Motion — uso mínimo e deliberado

- Reveal de entrada ao scroll: fade + translate leve (~200–300ms, sem bounce). Nunca em todos os elementos ao mesmo tempo.
- Hover em cards/botões: mudança sutil de sombra ou leve elevação. Nunca escala, rotação ou cor exagerada.
- Nunca animação contínua/ambiente (partículas, gradientes animados, ícones pulsando).
- `prefers-reduced-motion` deve ser respeitado em todas as variantes sem exceção.

---

## 7. Popup de contato

Acionado por qualquer CTA ou botão flutuante de WhatsApp (canto inferior direito).

- Campos: Nome + Telefone com máscara + botão "Enviar e continuar no WhatsApp".
- Validação: campos vazios bloqueiam envio com mensagem de erro inline.
- Cores: botão em `brand`, texto em `inkOnBrand`.
- Texto com link para Política de Privacidade (único underline permitido no produto).

---

## 8. Checklist de aceite para qualquer variante nova ou refatorada

Valide nesta ordem antes de considerar a variante pronta:

1. **Tokens, não valores fixos** — zero hex hardcoded, zero `font-family` no componente.
2. **Sequência eyebrow → título serif → corpo sans** presente?
3. **Contraste AA (4.5:1)** garantido testando mentalmente com paleta clara e paleta escura?
4. **Um único motivo decorativo**, opacidade 5–12%, sem competir com texto?
5. **Diferença estrutural real** em relação às outras variantes da mesma seção?
6. **Convivência com qualquer variante de seção vizinha** — parece a mesma marca em qualquer combinação?
7. **Responsivo** — reflow mobile definido explicitamente (não apenas "encolher")?
8. **Sem estatística inventada** — números só vêm dos dados reais do escritório?
9. **Sem elemento decorativo sem função** — se remover não muda o significado, corte?
10. **Acessibilidade básica** — foco visível, alt em imagens, h1 só no Hero, h2 nas demais?

---

## 9. Referências

- [`create-variant.md`](./create-variant.md) — guia técnico de registro (IDs, TypeScript, arquivos)
- `src/lib/landing-pages/variants.ts` — catálogo canônico de IDs e metadata
- `src/lib/landing-pages/schema.ts` — tipos e `DEFAULT_LAYOUT`
- `src/components/Sections/` — implementações visuais de cada seção
- `src/lib/landing-pages/templates.ts` — presets que combinam variantes
