# Guia do Desenvolvedor — shadcn/ui

> Referência conceitual e prática para entender o sistema de design tokens, o `globals.css` e as boas práticas de theming no shadcn/ui.

---

## Índice

1. [O que é o shadcn/ui](#1-o-que-é-o-shadcnui)
2. [Filosofia: Design Tokens Semânticos](#2-filosofia-design-tokens-semânticos)
3. [Anatomia do `globals.css`](#3-anatomia-do-globalscss)
4. [Por que oklch()?](#4-por-que-oklch)
5. [Mapa Completo das Variáveis](#5-mapa-completo-das-variáveis)
6. [O Sistema de Pares Background / Foreground](#6-o-sistema-de-pares-background--foreground)
7. [Estados de Interação: Hover, Active, Focus](#7-estados-de-interação-hover-active-focus)
8. [Tema Dark Mode](#8-tema-dark-mode)
9. [Armadilhas Comuns](#9-armadilhas-comuns)
10. [Checklist do Desenvolvedor](#10-checklist-do-desenvolvedor)
11. [Padrão: Dialog + Formulários (Scrollable & Decoupled)](#11-padrão-dialog--formulários-scrollable--decoupled)
12. [Padrão Avançado: React Hook Form + Zod](#12-padrão-avançado-react-hook-form--zod)

---

## 1. O que é o shadcn/ui

O shadcn/ui **não é uma biblioteca de componentes tradicional**. Você não instala um pacote e importa componentes como `import { Button } from 'shadcn'`. Em vez disso, você **copia o código-fonte** dos componentes diretamente para o seu projeto.

```bash
# O CLI copia o componente para components/ui/button.tsx
pnpm dlx shadcn@latest add button
```

Isso muda fundamentalmente a relação entre você e os componentes:

| Biblioteca tradicional | shadcn/ui |
|---|---|
| Você consome a API pública | Você possui o código |
| Customização via props/override | Edição direta do arquivo |
| Atualizações via `pnpm update` | Atualizações são manuais e conscientes |
| Código encapsulado (black box) | Código transparente e auditável |

### Estrutura de pastas gerada

```
src/
├── app/
│   └── globals.css          ← coração do sistema de temas
├── components/
│   └── ui/
│       ├── button.tsx        ← código copiado, seu para editar
│       ├── card.tsx
│       └── dialog.tsx
└── lib/
    └── utils.ts              ← função cn() para merge de classes
```

### A função `cn()`

Todos os componentes usam a função `cn()` para mesclar classes Tailwind de forma segura:

```typescript
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Uso:
<Button className={cn("mt-4", isActive && "bg-blue-500")} />
```

---

## 2. Filosofia: Design Tokens Semânticos

O shadcn usa **tokens semânticos**: variáveis CSS nomeadas pela *intenção*, não pela aparência.

```css
/* ❌ Abordagem por aparência — frágil */
color: #6c8ef5;          /* O que é esse azul? Para quê serve? */

/* ✅ Abordagem semântica — robusta */
color: var(--primary);   /* "cor da ação principal" */
```

A diferença prática: quando você troca de tema ou rebranding da aplicação, você redefine as variáveis em um único lugar. Os componentes não precisam de nenhuma alteração.

### Os quatro pilares do sistema

**1. Nomes com intenção**
`--destructive` significa "ação perigosa/irreversível". A cor hoje é vermelha — amanhã poderia ser laranja. A semântica permanece.

**2. Contraste garantido por contrato**
Cada variável de fundo tem um par de foreground testado para WCAG AA. Usar a variável certa é, automaticamente, usar a acessível.

**3. Temas sem alterar componentes**
Para mudar do Light para Dark, você redefine variáveis em `:root` e `.dark`. Nenhum componente é tocado.

**4. Escalabilidade**
Novos componentes herdam o sistema automaticamente. Adicionar um tema de marca é redefinir variáveis, não reescrever componentes.

---

## 3. Anatomia do `globals.css`

O `globals.css` é o único arquivo que você precisa editar para customizar todo o visual da aplicação. Ele tem quatro blocos:

```css
/* ── BLOCO 1: Diretivas do Tailwind ── */
@tailwind base;
@tailwind components;
@tailwind utilities;

/* ── BLOCO 2: Tema Light — variáveis em :root ── */
@layer base {
  :root {...}

  /* ── BLOCO 3: Tema Dark — apenas redefinição ── */
  .dark {...}
}

/* ── BLOCO 4: Aplicação no DOM ── */
@layer base {...}
```

### O que cada bloco faz

| Bloco | Responsabilidade |
|---|---|
| Diretivas Tailwind | Injeta as classes utilitárias do Tailwind no bundle final |
| `:root {}` | Define os valores do tema claro (padrão) |
| `.dark {}` | Redefine os valores para o tema escuro |
| `@layer base` final | Aplica `bg-background` e `text-foreground` ao `body` automaticamente |

---

## 4. Por que `oklch()`?

O shadcn usa o espaço de cores **oklch** desde a versão 2.0 (novembro 2024). É uma escolha deliberada com vantagens sobre hex e HSL.

### Sintaxe

```
oklch(L C H)
       │ │ └── Hue (matiz): 0–360°  ex: 250 = azul-roxo
       │ └──── Chroma (saturação): 0–0.4+  ex: 0.2 = vibrante
       └────── Lightness (luminosidade): 0–1  ex: 0.5 = meio-tom
```

### Por que não HSL?

O HSL é *matematicamente* uniforme, mas *perceptualmente* não. Uma mudança de `10%` na luminosidade do HSL resulta em impactos visuais completamente diferentes dependendo do hue (azuis ficam mais escuros que amarelos com o mesmo delta).

O oklch é perceptualmente uniforme: `+0.05` de luminosidade sempre representa o mesmo salto visual, independente da cor.

```css
/* ✅ oklch — manipulação previsível */
--primary:       oklch(0.5 0.2 280);  /* base */
--primary-hover: oklch(0.42 0.2 280); /* apenas L -0.08 = mais escuro */
--primary-light: oklch(0.65 0.2 280); /* apenas L +0.15 = mais claro */
/* O hue (280 = roxo) e o croma são idênticos nos três */

/* ❌ HSL — manipulação imprevisível */
--primary:       hsl(270, 60%, 50%);
--primary-hover: hsl(270, 60%, 42%); /* quanto escurece visualmente? depende da cor */
```

---

## 5. Mapa Completo das Variáveis

### Variáveis de cor

| Variável | Par (foreground) | Propósito | Onde é usada |
|---|---|---|---|
| `--background` | `--foreground` | Fundo principal da página | `body`, layout raiz |
| `--card` | `--card-foreground` | Superfícies elevadas | `Card`, `Dialog`, `Sheet` |
| `--popover` | `--popover-foreground` | Camadas flutuantes | `Popover`, `Tooltip`, `DropdownMenu` |
| `--primary` | `--primary-foreground` | Ação principal | Botão primary, progress bar, badges de destaque |
| `--secondary` | `--secondary-foreground` | Ação secundária | Botão secondary, chips, tags |
| `--muted` | `--muted-foreground` | Elementos discretos | Placeholders, textos de ajuda, captions |
| `--accent` | `--accent-foreground` | Destaque sutil interativo | Ghost button hover, item selecionado em dropdown |
| `--destructive` | `--destructive-foreground` | Ação perigosa/irreversível | Botão deletar, toast de erro, validações críticas |

### Variáveis estruturais

| Variável | Propósito |
|---|---|
| `--border` | Cor padrão de bordas e divisores |
| `--input` | Borda de campos de formulário (separado para controle fino) |
| `--ring` | Outline de foco — crítico para acessibilidade via teclado |
| `--radius` | Border-radius padrão (`0.625rem`) — usado em todos os componentes |

### Como o Tailwind mapeia as variáveis

O `tailwind.config.ts` do shadcn mapeia cada variável para uma classe utilitária:

```typescript
// tailwind.config.ts
theme: {
  extend: {
    colors: {
      background: "hsl(var(--background))",  // ou oklch()
      foreground: "hsl(var(--foreground))",
      primary: {
        DEFAULT: "hsl(var(--primary))",
        foreground: "hsl(var(--primary-foreground))",
      },
      // ...
    }
  }
}
```

Isso permite usar as variáveis tanto em CSS (`var(--primary)`) quanto em classes Tailwind (`bg-primary`, `text-primary-foreground`).

---

## 6. O Sistema de Pares Background / Foreground

Esta é a regra mais importante do shadcn: **toda variável de fundo tem um par de foreground garantido para contraste WCAG**.

### A regra do par

```
Se o fundo é --X, o texto DEVE ser --X-foreground.
```

| Fundo usado | Texto obrigatório | Violação comum |
|---|---|---|
| `bg-primary` | `text-primary-foreground` | Usar `text-foreground` (contraste pode falhar no dark) |
| `bg-accent` | `text-accent-foreground` | Usar `text-muted-foreground` |
| `bg-destructive` | `text-destructive-foreground` | Usar `text-white` (hardcoded, quebra no tema) |
| `bg-muted` | `text-muted-foreground` | Usar `text-foreground` |

### Exemplo correto

```tsx
// ✅ Correto — par garantido
<div className="bg-primary text-primary-foreground">
  Botão primário
</div>

// ✅ Correto — par garantido
<div className="bg-accent text-accent-foreground">
  Item selecionado no menu
</div>

// ❌ Errado — mistura pares, contraste não garantido
<div className="bg-primary text-foreground">
  Pode ser ilegível no dark mode
</div>
```

### Por que o dark mode inverte os papéis de primary?

No tema padrão do shadcn, o comportamento de `--primary` muda entre temas:

```css
:root {
  --primary: oklch(0.205 0 0);          /* escuro (quase preto) */
  --primary-foreground: oklch(0.985 0 0); /* claro (quase branco) */
}

.dark {
  --primary: oklch(0.922 0 0);          /* claro (quase branco) */
  --primary-foreground: oklch(0.205 0 0); /* escuro (quase preto) */
}
```

O botão primário no tema padrão shadcn é preto no Light e branco no Dark — um botão neutro/monocromático. Para uma cor de marca vibrante (ex: roxo), você sobrescreve essas variáveis.

---

## 7. Estados de Interação: Hover, Active, Focus

### Por que não usar variáveis existentes no hover?

Ao criar o hover de um botão primário vibrante, cada variável existente falha por uma razão semântica:

#### `--primary-foreground` no hover

```css
/* ❌ Errado */
.button:hover { background: var(--primary-foreground); }
```

**Problema:** `--primary-foreground` é a cor do *texto* dentro do botão primário — geralmente branco ou quase-branco. Usar como fundo torna o texto (que também é `primary-foreground`) completamente invisível — fundo e texto se tornam a mesma cor.

#### `--secondary` no hover

```css
/* ❌ Errado */
.button:hover { background: var(--secondary); }
```

**Problema:** `--secondary` é para ações de segunda importância (cinza neutro). Um botão primário roxo que faz hover para cinza dá a impressão de que o botão foi desativado ou que é uma ação diferente — viola a hierarquia visual.

#### `--accent` no hover

```css
/* ❌ Errado */
.button:hover { background: var(--accent); }
```

**Problema:** `--accent` é projetado para destaques sutis (hover de ghost buttons, item de menu selecionado). No CSS padrão do shadcn, é um quase-branco (`oklch(0.97 0 0)`). Para um botão primário vibrante, "mata" a energia visual da ação.

#### `--muted` no hover

```css
/* ❌ Errado */
.button:hover { background: var(--muted); }
```

**Problema:** `--muted` foi desenhado para fazer o elemento "sumir" no fundo — o oposto do que um hover precisa fazer. É uma cor sem saturação, o que destrói a identidade visual do botão.

### O padrão correto: variáveis derivadas

Para estados de interação, crie variáveis derivadas que mantêm o mesmo hue mas variam a luminosidade:

```css
/* globals.css */
:root {
  /* Cor de marca — roxo vibrante */
  --primary: oklch(0.5 0.22 280);
  --primary-foreground: oklch(0.985 0 0);

  /* Variáveis derivadas para estados */
  --primary-hover:  oklch(0.42 0.22 280); /* L menor = mais escuro */
  --primary-active: oklch(0.36 0.24 280); /* L ainda menor = "pressed" */
}

.dark {
  --primary: oklch(0.62 0.2 280);
  --primary-hover:  oklch(0.54 0.22 280); /* derivado do dark primary */
  --primary-active: oklch(0.47 0.24 280);
}
```

```tsx
// components/ui/button.tsx
const buttonVariants = cva("", {
  variants: {
    variant: {
      default: cn(
        "bg-[var(--primary)] text-[var(--primary-foreground)]",
        "hover:bg-[var(--primary-hover)]",
        "active:bg-[var(--primary-active)]",
        "focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
      ),
    },
  },
});
```

### Por que criar `--primary-hover` é a escolha certa?

1. **Mantém o Hue:** O usuário continua vendo roxo, apenas com luminosidade diferente. A identidade da ação primária é preservada.
2. **Não quebra o contraste:** Você controla a variação e sabe que `primary-foreground` (texto claro) continuará legível.
3. **Funciona no Dark Mode:** No `.dark {}`, você define um `--primary-hover` específico — pode ser mais saturado, mais claro — sem afetar o resto do sistema.
4. **Código semântico:** `hover:bg-[var(--primary-hover)]` é autoexplicativo. Qualquer dev que ler o código entende imediatamente.

---

## 8. Tema Dark Mode

### Mecanismo de funcionamento

A troca de tema funciona pelo CSS Cascade: a classe `.dark` no elemento `<html>` tem maior especificidade que `:root`, então o navegador usa as variáveis do `.dark` quando ela está presente.

```
Sem .dark:  :root { --background: oklch(1 0 0) }      → fundo branco
Com .dark:  .dark { --background: oklch(0.145 0 0) }  → fundo escuro
                                ↑ mais específico, vence o :root
```

### Implementando a troca com `next-themes`

```bash
pnpm add next-themes
```

```tsx
// app/layout.tsx
import { ThemeProvider } from "next-themes"

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system">
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
```

```tsx
// components/theme-toggle.tsx
import { useTheme } from "next-themes"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
      {theme === "dark" ? "☀️ Light" : "🌙 Dark"}
    </button>
  )
}
```

### Regra: toda variável customizada precisa de um valor dark

Se você cria `--primary-hover` no `:root`, **obrigatoriamente** defina também no `.dark`:

```css
/* ✅ Correto — definido nos dois temas */
:root  { --primary-hover: oklch(0.42 0.22 280); }
.dark  { --primary-hover: oklch(0.54 0.22 280); }

/* ❌ Errado — sem fallback dark, o valor do :root vaza no dark mode */
:root  { --primary-hover: oklch(0.42 0.22 280); }
/* .dark não definido → no dark mode, usa o valor do :root (muito escuro) */
```

---

## 9. Armadilhas Comuns

### Hardcoding de cores

```tsx
// ❌ Quebra no dark mode — não respeita o tema
<p className="text-gray-500">Texto de ajuda</p>

// ✅ Usa o sistema de tokens
<p className="text-muted-foreground">Texto de ajuda</p>
```

### Usar `text-white` ou `text-black` direto

```tsx
// ❌ Pode ser ilegível no light mode
<button className="bg-primary text-white">Salvar</button>

// ✅ Garante contraste em qualquer tema
<button className="bg-primary text-primary-foreground">Salvar</button>
```

### Misturar pares de Bg/Fg

```tsx
// ❌ Contraste não garantido — pares misturados
<div className="bg-accent text-muted-foreground">...</div>

// ✅ Par correto
<div className="bg-accent text-accent-foreground">...</div>
```

### Criar variável customizada sem definir no dark

```css
/* ❌ Só define no light */
:root { --brand-hover: oklch(0.42 0.22 280); }

/* ✅ Define nos dois temas */
:root { --brand-hover: oklch(0.42 0.22 280); }
.dark { --brand-hover: oklch(0.58 0.2  280); }
```

### Usar `--ring` sem `focus-visible`

```tsx
// ❌ Ring aparece sempre, inclusive no clique com mouse
<button className="focus:ring-2 focus:ring-ring">...</button>

// ✅ Ring apenas na navegação por teclado (acessibilidade correta)
<button className="focus-visible:ring-2 focus-visible:ring-ring">...</button>
```

---

## 10. Checklist do Desenvolvedor

Use esta lista ao criar novos componentes ou customizar o tema:

### Ao criar um componente

- [ ] Todo `bg-X` usa `text-X-foreground` como par
- [ ] Estados de hover/active usam variáveis derivadas (`--X-hover`), não variáveis de propósito diferente
- [ ] Focus usa `focus-visible:ring-2 focus-visible:ring-ring` (não `focus:`)
- [ ] Nenhuma cor hardcoded (`text-white`, `bg-gray-500`, etc.)

### Ao adicionar variáveis customizadas no `globals.css`

- [ ] Definida em `:root` (tema light)
- [ ] Definida em `.dark` (tema dark)
- [ ] Nome semântico (propósito), não descritivo (cor)
- [ ] Criou o par `--X-foreground` se for uma cor de fundo

### Ao customizar o tema de marca

- [ ] `--primary` e `--primary-foreground` definidos nos dois temas
- [ ] Contraste do par verificado (ferramenta: [oklch.com](https://oklch.com))
- [ ] `--primary-hover` criado como derivado com L menor (mais escuro no light, mais claro no dark)
- [ ] `--ring` atualizado para refletir a cor de marca (melhora UX de navegação por teclado)

### Ao criar Formulários em Dialogs

- [ ] O componente de formulário recebe e aplica a prop `id` na tag `<form>`
- [ ] O formulário está dentro do `DialogBody` (com scroll habilitado)
- [ ] O botão de submit está no `DialogFooter` (fixo no rodapé)
- [ ] O botão usa o atributo nativo `form="id-do-formulario"` para conexão

---

## 11. Padrão: Dialog + Formulários (Scrollable & Decoupled)

Para garantir uma UX consistente em telas menores ou formulários longos, adotamos um padrão de desacoplamento entre o contêiner do modal (`Dialog`) e a lógica do formulário.

### A Estrutura

1.  **`DialogBody`**: Contém o formulário e possui `overflow-y-auto`. Isso permite que o conteúdo role sem perder o cabeçalho e o rodapé.
2.  **`DialogFooter`**: Contém as ações (Salvar, Cancelar) e é `shrink-0`. Ele permanece fixo na base do modal, sempre visível.
3.  **Atributo `form` (HTML5)**: O botão de submissão fica no footer (fora da tag `<form>`). Usamos o atributo `form="id-unico"` para conectá-lo ao formulário.

### Exemplo de Implementação

#### 1. O Formulário (Dumb Component)
O formulário foca apenas nos campos e na validação.

```tsx
// forms/TaskForm/task-form.tsx
export function TaskForm({ id, onSubmit }: TaskFormProps) {
  return (
    <form id={id} onSubmit={form.handleSubmit(onSubmit)}>
      {/* Campos do formulário */}
    </form>
  )
}
```

#### 2. O Modal (Orquestrador)
O componente que invoca o modal define o ID e posiciona os elementos.

```tsx
// components/task-create-dialog.tsx
export function TaskCreateDialog() {
  const formId = "create-task-form";

  return (
    <DialogContent>
      <DialogHeader>Nova Tarefa</DialogHeader>
      
      <DialogBody>
        <TaskForm id={formId} onSubmit={handleSave} />
      </DialogBody>

      <DialogFooter>
        <DialogClose asChild>
          <Button variant="ghost">Cancelar</Button>
        </DialogClose>
        <Button type="submit" form={formId}>
          Salvar Tarefa
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
```

### Vantagens desta Abordagem

- **UX/Acessibilidade**: O usuário sempre vê o botão "Salvar", independentemente do scroll. Não há risco de "esconder" a ação principal no final de um formulário longo.
- **Padrão Web Nativo**: O uso de `form="id"` é suportado por todos os navegadores modernos e elimina a necessidade de hacks de `ref` ou submissão programática manual.
- **Manutenibilidade**: Os formulários tornam-se agnósticos ao contêiner. O mesmo `TaskForm` pode ser usado em uma página inteira, em um modal ou em um drawer apenas alterando quem controla o botão de submit.

---

## 12. Padrão Avançado: React Hook Form + Zod

Para formulários complexos, utilizamos a combinação de **React Hook Form** (para gerenciamento de estado e performance) e **Zod** (para validação de schema).

[![Formulários avançados no React (Hook Form + Zod)](https://img.youtube.com/vi/XSbMSSdGSdg/0.jpg)](https://youtu.be/XSbMSSdGSdg)

> **Referência em Vídeo**: Nesta live, Diego Fernandes da Rocketseat ensina a construir formulários avançados no React utilizando as bibliotecas React Hook Form e Zod para validação (0:30-1:00). O objetivo é criar um formulário completo que gerencia dados complexos de forma performática.
> 
> **Principais Tópicos Abordados**: Configuração Inicial e Validação (15:45 - 34:55): Instalação das dependências, criação do esquema de validação com Zod (incluindo transformação de dados, como converter e-mail para minúsculas) e integração com o React Hook Form usando o hook `useForm`.

### A Arquitetura de Formulários no Causi

A única diferença da abordagem do vídeo para os nossos componentes de formulário (localizados no diretório `src/forms`) é que **estamos dividindo o componente visual das props e schemas** que o próprio componente recebe.

Nossa estrutura padrão para um formulário é:

```
src/forms/NomeDoFormulario/
├── index.ts                 # Exportação limpa
├── nome-do-formulario.tsx   # Componente visual (UI) e integração com useForm
├── nome-do-formulario.types.ts # Tipagens TypeScript (Props, Valores)
└── schema.ts                # Validação Zod
```

### Schemas e Banco de Dados

Uma prática recomendada no nosso projeto é que os schemas e tipagens base podem (e devem) ser derivados diretamente do banco de dados. 

Você pode utilizar o comando do Supabase CLI para gerar os tipos TypeScript baseados no seu schema atual:

```bash
supabase gen types typescript > src/lib/database.types.ts
```

Isso garante que o seu formulário no frontend (validado pelo Zod) esteja sempre em sincronia com as restrições reais das tabelas no PostgreSQL.

---

## Referências

- [shadcn/ui — Documentação oficial](https://ui.shadcn.com)
- [Radix UI — Primitivos de acessibilidade](https://www.radix-ui.com)
- [oklch.com — Explorador de cores oklch](https://oklch.com)
- [WCAG 2.1 — Critérios de contraste](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html)
- [tailwind-merge — Documentação](https://github.com/dcastil/tailwind-merge)
- [next-themes — Documentação](https://github.com/pacocoursey/next-themes)