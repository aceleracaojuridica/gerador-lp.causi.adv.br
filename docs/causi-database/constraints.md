---
title: Constraints do Banco de Dados
description: Resumo das constraints adicionais — unicidades, integridade e invariantes
source: supabase/schemas/public/tables/, supabase/schemas/public/indexes/, supabase/schemas/billing/tables/, supabase/schemas/classroom/tables/
---

# Constraints — Resumo

Constraints garantem unicidades, integridade de valores e invariantes que não são fáceis de aplicar apenas via aplicação.

> **Fonte**: As constraints de negócio (UNIQUE, CHECK) ficam nas definições de tabela e os índices únicos parciais ficam em `indexes/`. Os arquivos `constraints/` contêm apenas foreign keys.
> - [`supabase/schemas/public/tables/`](../../supabase/schemas/public/tables/)
> - [`supabase/schemas/public/indexes/`](../../supabase/schemas/public/indexes/)
> - [`supabase/schemas/billing/tables/`](../../supabase/schemas/billing/tables/)
> - [`supabase/schemas/classroom/tables/`](../../supabase/schemas/classroom/tables/)

---

## Constraints de Negócio Notáveis

### Pares únicos subscription-addon

- **Tabela**: `billing.subscription_addons`
- **Constraint**: `UNIQUE (subscription_id, addon_id)`
- **Efeito**: Evita inserções duplicadas do mesmo addon na mesma assinatura.
- **Arquivo**: [`supabase/schemas/billing/tables/subscription_addons.sql`](../../supabase/schemas/billing/tables/subscription_addons.sql)

### Identificadores de contato

- **Tabela**: `public.person_identifiers`
- **Constraint**: `UNIQUE (account_id, channel_type, identifier_type, identifier)` + `CHECK` em `channel_type` e `identifier_type`
- **Efeito**: Garante que o mesmo identificador (ex: JID do WhatsApp) não seja duplicado no mesmo contexto de conta e canal.
- **Valores permitidos**: `channel_type` = `whatsapp|instagram|telegram|email`; `identifier_type` = `jid|lid|phone|email|username|user_id`
- **Arquivo**: [`supabase/schemas/public/tables/person_identifiers.sql`](../../supabase/schemas/public/tables/person_identifiers.sql)

### Estágios de pipeline únicos por tipo

- **Tabela**: `public.pipeline_stages`
- **Constraint**: Índice único parcial `ON (pipeline_id, type) WHERE type IN ('entry', 'qualified', 'disqualified')`
- **Efeito**: Cada pipeline tem no máximo um estágio de cada tipo crítico.
- **Arquivo**: [`supabase/schemas/public/indexes/pipeline_stages.sql`](../../supabase/schemas/public/indexes/pipeline_stages.sql)

### Acesso único user-account

- **Tabela**: `public.users_accounts`
- **Constraint**: `UNIQUE (user_id, account_id)`
- **Efeito**: Evita atribuições duplicadas de acesso compartilhado.
- **Arquivo**: [`supabase/schemas/public/tables/users_accounts.sql`](../../supabase/schemas/public/tables/users_accounts.sql)

### Certificado único por user-course

- **Tabela**: `classroom.user_certificates`
- **Constraint**: `UNIQUE (user_id, course_id)`
- **Efeito**: Impede múltiplos certificados para o mesmo usuário/curso.
- **Arquivo**: [`supabase/schemas/classroom/tables/user_certificates.sql`](../../supabase/schemas/classroom/tables/user_certificates.sql)

### Progresso único por user-lesson

- **Tabela**: `classroom.user_progress`
- **Constraint**: `UNIQUE (user_id, lesson_id)`
- **Efeito**: Impede múltiplos registros de progresso para a mesma combinação.
- **Arquivo**: [`supabase/schemas/classroom/tables/user_progress.sql`](../../supabase/schemas/classroom/tables/user_progress.sql)

---

## Cuidados

- **Migração**: Aplicar constraints em tabelas com dados existentes requer etapa prévia de deduplicação.
- **Índices parciais**: Onde aplicável, índices parciais reduzem custo em tabelas grandes e garantem unicidade apenas para tipos relevantes.
- **Testes**: Sempre solicite revisão manual do desenvolvedor antes de aplicar constraints em produção.
