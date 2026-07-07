Eu criei uma nova landing page 

page.client.tsx
  mas as iamgens que foram selecionadas fsão sempre as mesmas, talvez pela variant com links estaticos, mas as iamgens devem sempre vir via:
1 - Outras iuamgens da conta armazenadas no Supabase Storage
2 - requisição de API externa do Unsplash
3 - LLM Memory (opcional)


Ainda não ficou bom, na minha primeira landing page não tinhamos nenhuma imagem no supabase storage, então provaelmente a iamgem selecionada foi via API do unsplash, mas a imagem escolhida para a seção "Escritorio" (sobre) foi a de um gabnete dos estados unidos, isso não é semantico, é totalmente aleatorio, e pode ser prejudicial.

Temos que selecionar iamgens semanticas via API, abseado no contexto sobre o escritorio real com informações da landig page.

Viewed lp-generate-copy.ts:1-144
Viewed unsplash.ts:1-118

Agora entendo o problema completo. Deixa eu analisar antes de propor uma solução:

**Situação atual:**
- A IA **já gera `imageQueries` semanticamente** no prompt (linha 78 de `lp-generate-copy.ts`)
- Mas a função `buscarUma` busca apenas a **1ª foto** da query (`per_page=1`), sem aleatoriedade — retorna sempre a mesma imagem de ranking #1 do Unsplash para aquela query
- A regra de `sobre` no prompt diz: *"sempre ambiente de escritório"* — muito genérico, pode retornar qualquer gabinete do mundo

**Raiz do problema:** A query do `sobre` não inclui nenhum contexto brasileiro ou jurídico específico — a IA simplesmente gera algo como `"law firm office"` sem considerar que é para um escritório de advocacia brasileiro.

Vou melhorar em duas frentes:
1. **Prompt:** refinar as regras de `imageQueries` para queries mais específicas e com contexto brasileiro/jurídico
2. **Busca:** adicionar aleatoriedade como em `buscarUmaImagem` para não prender sempre no resultado #1

Edited lp-generate-copy.ts

Agora melhoro a função `buscarUma` para pegar um resultado aleatório entre os primeiros resultados (em vez de sempre o #1):

Edited unsplash.ts
Ran command: `pnpm lint "src/lib/landing-pages/unsplash.ts" "src/lib/landing-pages/lp-generate-copy.ts"`

Dois arquivos modificados, zero erros de lint.

---

### O que foi corrigido

**Raiz do problema em duas camadas:**

**1 — Queries da IA eram vagas demais** ([lp-generate-copy.ts](file:///c:/Users/bonaf/darlley/gerador-lp.causi.com.br/src/lib/landing-pages/lp-generate-copy.ts#L78-L87))

A regra antiga dizia apenas *"ambiente de escritório"* para o slot `sobre`, sem nenhuma restrição cultural. O modelo devolvia algo como `"law firm interior"` e o Unsplash retornava o gabinete americano #1 em popularidade.

Agora as regras são específicas por seção, com contexto emocional e restrições explícitas:
- **`hero`**: cena que representa **a dor do público-alvo**, não tribunal nem escritório
- **`dor`**: momento de **tensão ou incerteza** antes de buscar ajuda  
- **`sobre`**: escritório **moderno e discreto**, com proibição explícita de símbolos americanos (Capitólio, bandeira, plenário)
- **`solucao`**: cena de **acolhimento/orientação**, não triunfo ou martelo

**2 — Unsplash sempre retornava a foto #1** ([unsplash.ts](file:///c:/Users/bonaf/darlley/gerador-lp.causi.com.br/src/lib/landing-pages/unsplash.ts#L37-L60))

`per_page=1` travava na mesma imagem de maior ranking para qualquer query. Agora busca os **top 10 resultados** e sorteia aleatoriamente entre eles — mais variedade e menos repetição entre LPs geradas para o mesmo tema.

Agora entendo os dois problemas. Deixa eu confirmar a lógica do image-bank para entender o fallback:

Searched for "imagemAleatoria\|imagensDoTema\|IMAGE_BANK\|export function"
Listed directory landing-pages
Viewed image-bank.ts:1-152

Agora entendo completamente os dois problemas:

**Problema 1 — `gerar-copy/route.ts`**: Quando o usuário tem imagens na galeria, o código usa `slotIndex % galleryPaths.length`. Se há apenas **1 imagem**, todos os slots ficam com a mesma imagem (0%1=0, 1%1=0, 2%1=0, 3%1=0).

**Problema 2 — `imagem/route.ts` ("IA Escolhe")**: Prioridade 2 sempre pega `limit(1)` da galeria — sem considerar o slot nem a imagem atual — então clica repetidas vezes e sempre retorna a mesma.

## Fixes

### Fix 1 — `gerar-copy/route.ts`

Quando há poucas imagens na galeria, precisamos que cada slot use uma imagem diferente, e cair no Unsplash/banco curado se necessário para evitar duplicatas.

Edited route.ts

### Fix 2 — `imagem/route.ts` ("IA Escolhe")

O problema aqui é que a Prioridade 2 sempre retorna a **primeira** imagem da galeria, sem considerar qual slot está sendo pedido nem qual imagem já está em uso. Precisamos: (a) usar um offset por slot para distribuir as imagens da galeria, e (b) excluir a imagem atual (`current`).

Edited route.ts

Agora vou verificar o resultado final do arquivo `imagem/route.ts` para garantir que a variável `slotIndex` não ficou inutilizada (estava sendo calculada mas também usada agora):

Viewed route.ts:1-126

Arquivos estão corretos. Dois bugs corrigidos:

---

## Resumo das correções

### `gerar-copy/route.ts` — Geração inicial da landing page

**Antes:** `galleryPaths[slotIndex % length]` → com 1 imagem na galeria, todos os 4 slots recebiam `index[0]` (mesma foto).

**Depois:** Cada slot usa `galleryPaths[slotIndex]` diretamente. Se `slotIndex >= galleryPaths.length` (mais slots do que fotos), o slot cai no Unsplash / banco curado — garantindo variação mesmo com apenas 1 imagem enviada.

---

### `imagem/route.ts` — Botão "IA Escolhe"

**Antes:** Prioridade 2 pegava `limit(1)` da galeria sem nenhum critério → sempre retornava a mesma foto em qualquer clique, em qualquer seção.

**Depois:**
- **Prioridade 1** agora compara com `body.current` e só usa a imagem se for diferente da atual.
- **Prioridade 2** busca todas as imagens da conta, filtra a imagem atual, e usa `slotIndex % candidates.length` para distribuir — cada seção (`hero`, `dor`, `sobre`, `solucao`) aponta para um offset diferente, garantindo variação por seção.

Vou primeiro ver como a Unsplash está sendo usada hoje antes de alterar.

Viewed unsplash.ts:1-122

Entendido. O plano é claro:

- **`gerar-copy`** (criação): mantém galeria do Supabase → Unsplash → banco curado (ok)
- **`imagem`** ("IA Escolhe" no editor): ignora galeria, vai direto ao `/photos/random` da Unsplash — sempre nova, sempre aleatória

### 1. Adicionar `buscarImagemAleatoria` no unsplash.ts

Edited unsplash.ts

### 2. Reescrever `imagem/route.ts` — usar só Unsplash random no editor

Edited route.ts

### 3. Remover imports não usados do `gerar-copy/route.ts` que foram deixados da versão anterior

Viewed route.ts:1-115

O `gerar-copy` está limpo e correto. Ambos os arquivos estão prontos.

---

## O que foi feito

### [`unsplash.ts`](file:///c:/Users/bonaf/darlley/gerador-lp.causi.com.br/src/lib/landing-pages/unsplash.ts)
Nova função `buscarImagemAleatoria` usando `/photos/random`:
- Endpoint diferente do search — retorna 1 foto genuinamente aleatória a cada chamada
- `cache: "no-store"` garante que o Next.js nunca cacheia a resposta
- Logs completos para debug (status HTTP, query, URL retornada)

### [`imagem/route.ts`](file:///c:/Users/bonaf\darlley/gerador-lp.causi.com.br/src/app/api/imagem/route.ts) — "IA Escolhe" no editor
Reescrito: **galeria do Supabase removida completamente**:
1. Monta query combinando área jurídica + intenção da seção
2. Chama `buscarImagemAleatoria` (Unsplash `/photos/random`)
3. Se caiu na mesma imagem (improvável), tenta mais uma vez
4. Fallback final: banco local curado (`imagemAleatoria`)

### [`gerar-copy/route.ts`](file:///c:/Users/bonaf/darlley/gerador-lp.causi.com.br/src/app/api/gerar-copy/route.ts) — Criação inicial
Mantido: galeria do Supabase → Unsplash → banco curado (comportamento correto para criação).