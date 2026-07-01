---
title: Documentação Causi
description: Índice mestre da documentação técnica — o que ler para cada tarefa
---

# Documentação Causi

Índice mestre da documentação técnica do projeto Causi.

---

## Início Rápido — O que ler para cada tarefa

| Tarefa | Leia primeiro |
|--------|--------------|
| **Entender o projeto** | [ai-context/project-summary.md](./ai-context/project-summary.md) |
| **Implementar uma feature** | [ai-context/feature-map.md](./ai-context/feature-map.md) → doc da feature em [features/](./features/) |
| **Seguir convenções de código** | [ai-context/conventions.md](./ai-context/conventions.md) |
| **Entender a stack e arquitetura** | [architecture/overview.md](./architecture/overview.md) |
| **Entender auth e permissões** | [architecture/auth.md](./architecture/auth.md) + [references/roles-and-permissions.md](./references/roles-and-permissions.md) |
| **Gerenciar sessao no app** | [docs/guides/manage-session-context.md](./guides/gerenciando-sessao-do-usuario.md) + [implementations/session-context.md](./implementations/session-context.md) |
| **Kanban de oportunidades** | [features/deals-kanban.md](./features/deals-kanban.md) + [implementations/deals-kanban.md](./implementations/deals-kanban.md) |
| **Alterar permissões, limites ou usage** | [guides/alterando-permissoes-limites-e-usage.md](./guides/alterando-permissoes-limites-e-usage.md) |
| **Ver implementação completa de auth** | [implementations/auth.md](./implementations/auth.md) |
| **Trabalhar com o banco de dados** | [database/overview.md](./database/overview.md) → schema específico |
| **Merge + aplicar migrations / trocar ambiente Supabase** | [guides/supabase-migrations-and-environments.md](./guides/supabase-migrations-and-environments.md) |
| **Consultar tabelas de um schema** | [database/schema-public.md](./database/schema-public.md), [schema-billing.md](./database/schema-billing.md), [schema-classroom.md](./database/schema-classroom.md) |
| **Verificar planos e limites** | [references/plans-and-features.md](./references/plans-and-features.md) |
| **Consultar status e enums** | [references/statuses-and-enums.md](./references/statuses-and-enums.md) |
| **Trabalhar com Edge Functions** | [edge-functions/overview.md](./edge-functions/overview.md) → doc específica |
| **Entender integrações WhatsApp** | [architecture/integrations.md](./architecture/integrations.md) |
| **Consultar rotas da aplicação** | [api/routes.md](./api/routes.md) |
| **Design system e UX** | [design/DESIGN.md](./design/DESIGN.md) |
| **Criar componentes** | [ai-context/conventions.md](./ai-context/conventions.md) |

---

## Estrutura da Documentação

### Arquitetura

| Documento | Descrição |
|-----------|-----------|
| [architecture/overview.md](./architecture/overview.md) | Stack, decisões de SDK, Realtime, estrutura de pastas |
| [harness/README.md](./harness/README.md) | Agent Harness — arquitetura, operação, padrões SQL-first |
| [architecture/auth.md](./architecture/auth.md) | Auth flow, roles, RLS, convites, multi-account |
| [architecture/integrations.md](./architecture/integrations.md) | WhatsApp providers, webhooks, envio de mensagens |

### Design

| Documento | Descrição |
|-----------|-----------|
| [design/design.md](./design/DESIGN.md) | Design system do projeto |

### Banco de Dados

| Documento | Descrição |
|-----------|-----------|
| [database/overview.md](./database/overview.md) | Resumo dos schemas, CLI workflow, convenções, troubleshooting |
| [database/schema-public.md](./database/schema-public.md) | 24 tabelas do schema `public` (Core, CRM, Comunicação) |
| [database/schema-billing.md](./database/schema-billing.md) | 7 tabelas do schema `billing` (planos, assinaturas, pagamentos) |
| [database/schema-classroom.md](./database/schema-classroom.md) | 7 tabelas do schema `classroom` (cursos, aulas, certificados) |
| [database/functions.md](./database/functions.md) | Funções SQL — RLS helpers, agregadores, fluxos de criação |
| [database/triggers.md](./database/triggers.md) | Triggers — automações, invariantes, sincronizações |
| [database/rls.md](./database/rls.md) | Políticas de Row-Level Security por tabela |
| [database/views.md](./database/views.md) | Views — sumários, detalhamento, classroom |
| [database/constraints.md](./database/constraints.md) | Constraints — unicidades e limites estruturais |
| [database/storage.md](./database/storage.md) | Supabase Storage — buckets, RLS, Next.js integration |

### Edge Functions

| Documento | Descrição |
|-----------|-----------|
| [edge-functions/overview.md](./edge-functions/overview.md) | Índice e comandos CLI |
| [edge-functions/admin-subscriptions-handler.md](./edge-functions/admin-subscriptions-handler.md) | Gerenciamento de assinaturas (admin) |
| [edge-functions/channel-sync-webhook.md](./edge-functions/channel-sync-webhook.md) | Sincronização de canais |
| [edge-functions/evolution-webhook-handler-v2.md](./edge-functions/evolution-webhook-handler-v2.md) | Webhooks Evolution API |
| [edge-functions/subscriptions-lifecycle-cron-v2.md](./edge-functions/subscriptions-lifecycle-cron-v2.md) | Cron de billing |
| [edge-functions/uazapi-webhook-handler.md](./edge-functions/uazapi-webhook-handler.md) | Webhooks UAZAPI |
| [edge-functions/waha-webhook-handler.md](./edge-functions/waha-webhook-handler.md) | Webhooks WAHA |

### Features

| Documento | Descrição |
|-----------|-----------|
| [features/conversations.md](./features/conversations.md) | Inbox — layout 3 colunas, realtime, pause/handoff |
| [features/deals-kanban.md](./features/deals-kanban.md) | CRM Kanban — deals, estágios, drag-and-drop, funis, tags |
| [features/contacts.md](./features/contacts.md) | Contatos — persons, organizations, identificadores |
| [features/tasks.md](./features/tasks.md) | Tarefas — Kanban por prazo, deals vinculados |
| [features/channels.md](./features/channels.md) | Canais — WhatsApp, provedores, pipeline binding |
| [features/subscriptions.md](./features/subscriptions.md) | Billing — planos, addons, limites, upgrade |
| [features/classroom.md](./features/classroom.md) | Classroom — cursos, aulas, certificados |
| [features/admin-panel.md](./features/admin-panel.md) | Admin Panel — gestão de contas, admin bar |

### Implementações

> Documentação detalhada do que já foi construído no projeto — camadas, arquivos, fluxos end-to-end. Diferente de `features/` (especificações do que construir) e `guides/` (guias genéricos de tooling).

| Documento | Descrição |
|-----------|-----------|
| [implementations/auth.md](./implementations/auth.md) | Sistema de autenticação — camadas, clientes Supabase, fluxos e FAQ |
| [implementations/session-context.md](./implementations/session-context.md) | Implementação do Session Context — camadas, hooks, handlers, forms |
| [implementations/storage.md](./implementations/storage.md) | Implementação do Supabase Storage — buckets, RLS, helpers de path, integração Next.js |
| [implementations/deals-kanban.md](./implementations/deals-kanban.md) | Kanban de oportunidades — RSC + streaming, CRUD, DnD, sheet, realtime, cookie de funil |
| [implementations/contacts.md](./implementations/contacts.md) | Contatos — pessoas e organizações (`/pessoas`, `/organizacoes`) |
| [implementations/tasks.md](./implementations/tasks.md) | Tarefas — Kanban e agenda (`/tarefas`) |

### API e Componentes

| Documento | Descrição |
|-----------|-----------|
| [api/routes.md](./api/routes.md) | Índice de rotas (públicas, privadas, admin, webhooks) |
| [components/overview.md](./components/overview.md) | Resumo de convenções de componentes (ver [conventions.md](./ai-context/conventions.md)) |

### Referências

| Documento | Descrição |
|-----------|-----------|
| [references/defaults.md](./references/defaults.md) | Valores padrão para criação de contas, pipelines, estágios |
| [references/plans-and-features.md](./references/plans-and-features.md) | Planos, preços, limites e features (dados reais do banco) |
| [references/roles-and-permissions.md](./references/roles-and-permissions.md) | Roles e permissões granulares (dados reais do banco) |
| [references/statuses-and-enums.md](./references/statuses-and-enums.md) | Status e enums por tabela |

### Guias

| Documento | Descrição |
|-----------|-----------|
| [guides/git-workflow.md](./guides/git-workflow.md) | Git Workflow — commits, hooks Husky, Biome, typecheck |
| [guides/supabase-migrations-and-environments.md](./guides/supabase-migrations-and-environments.md) | Merge de branches com migrations, conflitos, `.env`/`.env.test`, `db push` dev → prod |
| [guides/nextjs.md](./guides/nextjs.md) | Guia completo Next.js App Router |
| [guides/loading-and-lazy-components.md](./guides/loading-and-lazy-components.md) | Loading, Suspense, lazy components e fallbacks — quando usar cada estratégia |
| [guides/shadcn.md](./guides/shadcn.md) | Guia Shadcn/UI — design tokens e theming, componentes e padrões |
| [guides/manage-session-context.md](./guides/manage-session-context.md) | Guia completo para usar e gerenciar sessao de usuario no contexto (server, client, actions, handlers e forms) |
| [guides/update-session-context.md](./guides/update-session-context.md) | Guia completo para alterar permissões, features, limites e usage com segurança |
| [guides/typescript-e-zod.md](./guides/typescript-e-zod.md) | TypeScript + Zod — validação e tipos |

### Decisões

| Documento | Descrição |
|-----------|-----------|
| [decisions/adr.md](./decisions/adr.md) | Architecture Decision Record |
| [decisions/prd.md](./decisions/prd.md) | Product Requirements Document |

### Contexto Rápido

> Documentos de contexto rápido — úteis tanto para agentes de IA quanto para desenvolvedores novos no projeto.

| Documento | Descrição |
|-----------|-----------|
| [ai-context/project-summary.md](./ai-context/project-summary.md) | Resumo denso de 1 página — visão geral do projeto |
| [ai-context/feature-map.md](./ai-context/feature-map.md) | Features mapeadas para tabelas, funções e edge functions |
| [ai-context/conventions.md](./ai-context/conventions.md) | Convenções de código e padrões do projeto |
