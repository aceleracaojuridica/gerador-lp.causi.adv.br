---
title: Componentes — Convenções
description: Resumo das convenções de componentes — documento completo em conventions.md
---

# Componentes — Convenções

> **Documento completo:** Todas as convenções de código, componentes, nomenclatura, props, NUQS e UI estão centralizadas em [ai-context/conventions.md](../ai-context/conventions.md).

---

## Resumo

- **Idioma**: Nomes de arquivos, variáveis e componentes em **inglês**
- **Componentes simples**: `kebab-case.tsx` (ex: `app-sidebar.tsx`)
- **Componentes estruturados**: `PascalCase/` com `.tsx`, `.types.ts`, `schema.ts`, `index.ts`
- **Organização**: `src/components/[resource-name]/` por escopo de página
- **Props callbacks**: `onSave`, `onEdit`, `onClose`, `onAbort`, `onDelete`
- **Estado de URL**: Biblioteca `nuqs` para modais, filtros e abas
- **UI**: Shadcn UI com tokens semânticos — evitar classes Tailwind genéricas
