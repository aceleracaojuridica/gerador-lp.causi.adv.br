# Análise e Plano de Melhorias UX — Editor de Landing Pages

## Context

O editor é o núcleo do produto — onde o usuário passa mais tempo. Ele deve funcionar como um CMS completo: criar, editar e publicar LPs. A análise identificou **lacunas críticas** (SEO sem UI, template sem troca pós-criação, tipografia sem UI) e **falhas de navegação** (modo Simples x Avançado confuso, back button inconsistente, EditorSectionNav ausente no modo Simples, CTA de "Contato" que abandona o padrão visual).

O objetivo é tornar a navegação **sólida e previsível**: o usuário sempre sabe onde está, como voltar, e o que pode editar.

---

## Diagnóstico: O que está quebrado hoje

### 1. Navegação dual confusa (Simples vs Avançado)
- O toggle "Simples/Avançado" não é visível o suficiente e o texto explicativo é pequeno.
- Ao clicar em **"Contato e rodapé"** no bento do modo Simples, o usuário entra na vista de detalhe do modo Avançado (visualmente diferente — sem EditorSectionNav, sem o grid de bento). O back button retorna à lista corretamente mas a transição é abrupta.
- Ao entrar no detalhe de qualquer seção no modo Simples, **EditorSectionNav não aparece** (linha 621: `detailSection && fullEditor`). Isso priva o usuário de saber onde está e de navegar entre seções sem voltar ao início.

### 2. Funcionalidades críticas ausentes do editor
| Recurso | Existe no schema? | Tem UI? |
|---------|-------------------|---------|
| SEO / Meta tags (title, description, keywords, ogImage, favicon, indexable) | ✅ `SeoMeta` | ❌ |
| Tipografia (fonts.heading, fonts.body) | ✅ | ❌ |
| Aplicar template pós-criação | Templates em `templates.ts` | ❌ |
| Ocultar seção Equipe | `layout.hidden` | ❌ (só áreas, etapas, faq, ctaFinal têm toggle) |
| Tags de conversão (Google Ads, Pixel) | `office.tags` | ❌ |

### 3. "Mudar sequência" só no modo Avançado
- O botão de reordenação aparece apenas em `fullEditor`. Usuário no modo Simples não tem acesso.

### 4. Sem seção "Modelo/Template" no editor
- Template é escolhido na criação (`/nova`) e fica **bloqueado**. Não há como aplicar um preset de layout diferente depois.
- Usuário teria que mudar 7 variantes + 9 tones manualmente para "mudar de template".

### 5. Hierarquia visual do header inconsistente
- O header mostra `office.name || name` em quase todos os estados. Em detalhe de seção (modo Avançado), deveria mostrar o **nome da seção** para orientar o usuário.

---

## Plano de Implementação

### Fase 1 — Correções de Navegação (Quick Wins)

**Arquivo principal:** `src/components/Builder/editor.tsx`

#### 1a. EditorSectionNav sempre visível em detail mode
```
Linha ~621:
ANTES: {detailSection && fullEditor ? <EditorSectionNav ... />}
DEPOIS: {detailSection ? <EditorSectionNav ... />}
```
Isso garante que, mesmo no modo Simples ao entrar em detalhe (via "Contato"), o usuário veja os pills de navegação de seção.

#### 1b. Header: mostrar nome da seção em detail mode (sempre, não só no fullEditor)
```
Linha ~604:
ANTES: detailSection && fullEditor ? office.name : detailSection ? label : office.name
DEPOIS: detailSection ? (editorSections.find(s => s.id === detailSection)?.label ?? ...) : office.name
```
O header fica contextual para o usuário saber onde está.

#### 1c. "Mudar sequência" acessível em ambos os modos
Mover o botão para fora do bloco `{fullEditor ? ...}`. Ele deve aparecer logo abaixo do ModeToggle, sempre visível.

#### 1d. Adicionar "equipe" ao `layout.hidden`
Adicionar toggle de visibilidade para a seção "Equipe" no accordion (igual aos de áreas/etapas/faq/ctaFinal).
- Atualizar schema em `src/lib/landing-pages/schema.ts` para incluir `equipe` em `hidden`
- Adicionar `toggle` prop no accordion de Equipe em `editor.tsx`
- Atualizar `landing-preview.tsx` para respeitar `layout.hidden?.equipe`

---

### Fase 2 — SEO Section (Crítico para CMS)

**Arquivo:** `src/components/Builder/editor.tsx`

#### 2a. Adicionar `"seo"` ao `DetailSectionId`
```typescript
type DetailSectionId = "aparencia" | "hero" | ... | "footer" | "seo";
```

#### 2b. Adicionar na `editorSections` array
```typescript
{ id: "seo", label: "SEO", previewTarget: "sec-hero" }
```
Posicionar **entre "Aparência" e "Topo"** na lista — é configuração global da página.

#### 2c. Adicionar accordion no fullEditor list
```tsx
<Accordion
  title="SEO e meta tags"
  domId="acc-seo"
  icon={<Search size={22} />}
  subtitle="Título, descrição e indexação"
  open={false}
  onOpenChange={() => goToDetailSection("seo")}
/>
```

#### 2d. Renderizar painel de detalhe SEO
Dentro do bloco `{detailSection === "seo" && (...)}`:
- **Campo:** `seo.title` — `<input>` com counter de caracteres (alvo: 50-60)
- **Campo:** `seo.description` — `<AutoTextarea>` com counter (alvo: 140-155)
- **Campo:** `seo.keywords` — `<input>` csv com hint
- **Campo:** `seo.ogImage` — `<input>` URL (og:image para redes sociais)
- **Campo:** `seo.favicon` — `<input>` URL
- **Toggle:** `seo.indexable` — switch "Indexável / Noindex" com explicação para LPs de tráfego pago
- Os campos são atualizados via `form.setSeoField(key, value)` (adicionar ao `use-lp-form.ts`)

---

### Fase 3 — Template Switching no Editor

**Arquivo:** `src/components/Builder/editor.tsx` + novo componente

#### 3a. Adicionar `"modelo"` ao `DetailSectionId`
```typescript
type DetailSectionId = ... | "modelo";
```

#### 3b. Adicionar accordion no fullEditor list (primeiro da lista, antes de "Aparência")
```tsx
<Accordion
  title="Modelo da página"
  domId="acc-modelo"
  icon={<GridView size={22} />}
  subtitle="Combinação de layouts pré-definida"
  open={false}
  onOpenChange={() => goToDetailSection("modelo")}
/>
```

#### 3c. Renderizar painel "Modelo"
- Importar `TEMPLATES` de `src/lib/landing-pages/templates.ts`
- Mostrar os 3 templates como cards clicáveis (reusar `TemplateCard` de `src/components/Builder/template-card.tsx`)
- Ao selecionar: `form.applyTemplate(template.layout)` — atualiza apenas `layout.*` (variantes + tones), **preserva todo o conteúdo**
- Adicionar `applyTemplate(layout: Partial<Layout>)` ao `use-lp-form.ts`
- Mostrar badge "Atual" no template que melhor corresponde ao layout ativo

---

### Fase 4 — Tipografia na Seção "Aparência"

**Arquivo:** `src/components/Builder/editor.tsx`

Adicionar controles de tipografia dentro do bloco `{detailSection === "aparencia" && (...)}`:

```tsx
<div className="space-y-2 border-t border-slate-100 pt-3">
  <p className="text-sm font-medium text-slate-700">Tipografia</p>
  <Field label="Títulos e destaques">
    <select onChange={(e) => form.setFontField("heading", e.target.value)} ...>
      <option value="inter">Inter (padrão)</option>
      <option value="playfair">Playfair Display (elegante)</option>
      <option value="merriweather">Merriweather (serioso)</option>
      ...
    </select>
  </Field>
  <Field label="Textos e parágrafos">
    <select onChange={(e) => form.setFontField("body", e.target.value)} ...>
      ...
    </select>
  </Field>
</div>
```

Verificar quais fontes já são carregadas em `globals.css` e `lp-theme.css` para manter consistência.
Adicionar `setFontField(key, value)` ao `use-lp-form.ts`.

---

### Fase 5 — Tags de Conversão (Ads/Pixel)

**Arquivo:** `src/components/Builder/editor.tsx`

Adicionar sub-seção em `{detailSection === "aparencia" && (...)}` ou em "SEO":

```tsx
<Accordion title="Tags de rastreamento" flush>
  <Field label="Código no <head>" hint="Google Analytics, Meta Pixel, etc.">
    <AutoTextarea value={office.tags?.head} onChange={...} placeholder="<script>..." />
  </Field>
  <Field label="Código no <body>">
    <AutoTextarea value={office.tags?.body} onChange={...} />
  </Field>
</Accordion>
```

Isso via `form.setTagField(key, value)` (adicionar ao use-lp-form.ts).

---

## Arquivos a Modificar

| Arquivo | Mudanças |
|---------|----------|
| `src/components/Builder/editor.tsx` | Fases 1–5: nav fixes, SEO panel, modelo panel, tipografia, tags |
| `src/lib/landing-pages/schema.ts` | Adicionar `equipe` ao tipo `Layout["hidden"]` |
| `src/components/Builder/use-lp-form.ts` | Adicionar: `setSeoField`, `setFontField`, `setTagField`, `applyTemplate` |
| `src/components/Preview/landing-preview.tsx` | Respeitar `layout.hidden?.equipe` para ocultar seção Equipe |

---

## Estrutura Final do Editor (seções no painel esquerdo)

```
[Modo: Simples | Avançado]
[Mudar sequência ↕]

┌─ Modelo da página           → abre detail com 3 templates
├─ Aparência e botões         → abre detail: cantos, botões, tipografia, tags
├─ SEO e meta tags            → abre detail: title, description, ogImage, indexable
├─ Topo da página             → abre detail: variant + tone + textos + imagem
├─ Dores do cliente           → abre detail: variant + tone + textos + cards
├─ Como você ajuda            → abre detail: variant + tone + textos + cards
├─ Sobre o escritório         → abre detail: variant + tone + texto + diferenciais
├─ Equipe              [Ativo]→ abre detail: variant + tone + fotos
├─ Áreas de atuação    [Ativo]→ abre detail: variant + tone + cards
├─ Como funciona       [Ativo]→ abre detail: variant + tone + passos
├─ [Seções custom]     [Ativo]→ abre detail: tipo + cards/texto
├─ Perguntas frequentes[Ativo]→ abre detail: tone + perguntas
├─ Convite final       [Ativo]→ abre detail: tone + textos
└─ Contato e rodapé          → abre detail: contatos, endereços, redes, política
```

---

## Verificação / Teste

1. **Navegação**: Abrir editor → modo Simples → clicar "Contato e rodapé" → verificar que EditorSectionNav aparece com pills de seções → clicar pill "Aparência" → verifica que abre a seção correta → clicar "Voltar" retorna ao bento inicial.

2. **SEO**: Abrir seção SEO → preencher título (mostrar counter de chars) → salvar → verificar que `<title>` e `<meta description>` aparecem no HTML renderizado da LP pública.

3. **Template**: Clicar "Modelo da página" → selecionar "Moderno" → verificar que variantes e tones mudam em todas as seções no preview → conteúdo (textos, imagens) preservado.

4. **Tipografia**: Mudar fonte de títulos em "Aparência" → preview atualiza imediatamente.

5. **Equipe toggle**: Adicionar toggle na seção Equipe → definir "Oculta" → seção some do preview.

6. **Reordenar em modo Simples**: Verificar que o botão "Mudar sequência" aparece mesmo sem ativar modo Avançado.
