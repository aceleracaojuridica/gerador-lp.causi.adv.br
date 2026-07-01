---
trigger: model_decision
name: Shadcn/ui Usage Rules
description: Guidelines for using shadcn/ui components in the Causi project, ensuring consistency and preserving customizations.
---

# Regras para Uso do shadcn/ui

Este documento define as regras e diretrizes para o uso do shadcn/ui no projeto **Causi**. O objetivo é manter a consistência visual, evitar redundância e preservar as customizações feitas pela equipe.

## 🛠️ Instalação e Localização

- **Caminho Padrão:** Todos os componentes do shadcn devem ser instalados ou criados em `src/components/ui/`.
- **Verificação Prévia:** Antes de instalar qualquer componente novo, verifique se ele já existe na pasta `ui`.
- **Bloqueio de Sobrescrita:** Nunca faça o "override" ou re-instale um componente que já existe no projeto (`src/components/ui/`) sem autorização manual. Re-instalar pode apagar customizações críticas feitas anteriormente.
- **Gerenciador de Pacotes:** Use exclusivamente `pnpm` para adicionar novos componentes:
  ```bash
  pnpm dlx shadcn@latest add [component-name]
  ```

## 🎨 Customização e Design System

- **Mantenha a Base:** Ao customizar um componente original do shadcn, sempre preserve a estrutura básica e os primitivos da Radix UI. Não altere o funcionamento essencial do componente, apenas sua aparência ou variantes.
- **Variantes via CVA:** Prefira adicionar novas variantes usando a biblioteca `cva` (Class Variance Authority) em vez de criar múltiplos componentes similares.
- **Tokens Semânticos (oklch):** Todas as cores devem usar as variáveis CSS definidas em `globals.css` (ex: `bg-primary`, `text-muted-foreground`).
  - Nunca use cores hardcoded (ex: `bg-blue-500`, `text-[#ff0000]`).
  - Siga o sistema de pares `background/foreground` para garantir o contraste WCAG.
- **Função `cn()`:** Use sempre a função `cn()` para mesclar classes Tailwind de forma segura, permitindo que quem consome o componente possa estendê-lo via `className`.

## 📋 Padrão: Dialog + Formulários

Para todos os formulários que abrem em modais (`Dialog`), siga obrigatoriamente a estrutura de desacoplamento:
1.  **`DialogBody`**: Deve conter o formulário e ter scroll habilitado (`overflow-y-auto`).
2.  **`DialogFooter`**: Deve conter os botões de ação e ser fixo (`shrink-0`).
3.  **HTML5 `form` attribute**: O botão de submit no footer deve usar `form="id-do-formulario"` para disparar a submissão, mantendo os botões fora da tag `<form>` para fins de layout.

## 💾 Preservação de Mudanças

- **Documentação Interna (JSDoc):** Ao fazer uma mudança significativa em um componente da `ui`, adicione um bloco JSDoc explicando a @motivação e a @solução. Isso evita que outro desenvolvedor (ou agente) reverta a mudança por engano.
- **Não Reverter:** Antes de sugerir uma mudança em um componente existente, leia o histórico do arquivo ou a documentação em `docs/guides/shadcn.md`.

---
*Estas regras são mandatórias para todos os agentes e desenvolvedores que atuam no repositório.*
