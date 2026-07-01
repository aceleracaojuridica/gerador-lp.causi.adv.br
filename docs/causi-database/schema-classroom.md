---
title: Schema Classroom (Educação)
description: Detalhamento das 7 tabelas do schema classroom — cursos, aulas e certificados
source: supabase/schemas/classroom/tables/
---

# Schema `classroom` — Educação

O schema `classroom` gerencia o módulo educacional do Causi: cursos, módulos, aulas, materiais e certificação.

> **Fonte**: Os arquivos SQL de cada tabela estão em [`supabase/schemas/classroom/tables/`](../../supabase/schemas/classroom/tables/).

---

## Visão Geral

O schema possui **7 tabelas** distribuídas em 3 grupos:

1. **Conteúdo Acadêmico** — Estrutura de cursos (`courses`, `modules`, `lessons`, `attachments`)
2. **Certificação** — Templates e certificados emitidos (`certificate_templates`, `user_certificates`)
3. **Progresso** — Acompanhamento do aluno (`user_progress`)

O acesso ao módulo classroom é controlado pela feature `classroom` (e `classroom_premium` para conteúdo premium) no jsonb `features` da tabela `billing.plans`.

---

## 1. Conteúdo Acadêmico

### `courses`

Cursos disponíveis na plataforma.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | `bigint` (identity) | PK |
| `created_at` | `timestamptz NOT NULL` | Data de criação (default: `now()`) |
| `updated_at` | `timestamptz NOT NULL` | Data de atualização (default: `now()`) |
| `title` | `text NOT NULL` | Título do curso |
| `description` | `text` | Descrição |
| `thumbnail_url` | `text` | URL da capa |
| `order_index` | `real NOT NULL` | Posição de ordenação (default: `0`) |
| `is_premium` | `boolean NOT NULL` | Conteúdo premium (default: `false`) |
| `is_active` | `boolean NOT NULL` | Curso publicado (default: `false`) |
| `workload_hours` | `smallint` | Carga horária |
| `certificate_template_id` | `bigint` | FK → `certificate_templates(id)` ON DELETE SET NULL |

### `modules`

Módulos dentro de um curso (agrupam aulas).

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | `bigint` (identity) | PK |
| `created_at` | `timestamptz NOT NULL` | Data de criação (default: `now()`) |
| `updated_at` | `timestamptz NOT NULL` | Data de atualização (default: `now()`) |
| `course_id` | `bigint NOT NULL` | FK → `courses(id)` ON DELETE CASCADE |
| `title` | `text NOT NULL` | Título do módulo |
| `description` | `text` | Descrição |
| `order_index` | `real NOT NULL` | Posição de ordenação (default: `0`) |
| `is_active` | `boolean NOT NULL` | Módulo publicado (default: `false`) |

### `lessons`

Aulas individuais dentro de um módulo.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | `bigint` (identity) | PK |
| `created_at` | `timestamptz NOT NULL` | Data de criação (default: `now()`) |
| `updated_at` | `timestamptz NOT NULL` | Data de atualização (default: `now()`) |
| `module_id` | `bigint NOT NULL` | FK → `modules(id)` ON DELETE CASCADE |
| `title` | `text NOT NULL` | Título da aula |
| `description` | `text` | Descrição |
| `content` | `text` | Conteúdo textual (HTML/Markdown) |
| `video_url` | `text` | URL do vídeo |
| `order_index` | `real NOT NULL` | Posição de ordenação (default: `0`) |
| `duration_seconds` | `integer` | Duração do vídeo em segundos |
| `is_active` | `boolean NOT NULL` | Aula publicada (default: `false`) |

### `attachments`

Materiais de apoio vinculados a aulas.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | `bigint` (identity) | PK |
| `created_at` | `timestamptz NOT NULL` | Data de criação (default: `now()`) |
| `updated_at` | `timestamptz NOT NULL` | Data de atualização (default: `now()`) |
| `lesson_id` | `bigint NOT NULL` | FK → `lessons(id)` ON DELETE CASCADE |
| `file_name` | `text NOT NULL` | Nome do arquivo |
| `file_url` | `text NOT NULL` | URL do arquivo no Storage |
| `file_type` | `text NOT NULL` | Tipo MIME |
| `file_size` | `bigint` | Tamanho em bytes |

---

## 2. Certificação

### `certificate_templates`

Modelos de certificado (fundo, layout).

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | `bigint` (identity) | PK |
| `created_at` | `timestamptz NOT NULL` | Data de criação (default: `now()`) |
| `updated_at` | `timestamptz NOT NULL` | Data de atualização (default: `now()`) |
| `title` | `text NOT NULL` | Título do template |
| `image_url` | `text NOT NULL` | URL da imagem de fundo |
| `layout` | `jsonb` | Configuração de posicionamento dos textos |
| `is_default` | `boolean NOT NULL` | Template padrão (default: `false`) — trigger `trigger_ensure_single_default_template` garante unicidade |

### `user_certificates`

Certificados emitidos para usuários que completaram cursos.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | `uuid` | PK (via `gen_random_uuid()`) — exceção: não usa bigint |
| `created_at` | `timestamptz NOT NULL` | Data de criação (default: `now()`) |
| `updated_at` | `timestamptz NOT NULL` | Data de atualização (default: `now()`) |
| `user_id` | `uuid NOT NULL` | FK → `public.users(id)` ON DELETE CASCADE |
| `course_id` | `bigint` | FK → `courses(id)` ON DELETE SET NULL |
| `certificate_template_id` | `bigint` | FK → `certificate_templates(id)` ON DELETE SET NULL |
| `user_name` | `text NOT NULL` | Nome do aluno (desnormalizado para o certificado) |
| `course_title` | `text NOT NULL` | Título do curso (desnormalizado) |
| `workload_hours` | `smallint NOT NULL` | Carga horária (desnormalizada) |
| `certificate_url` | `text` | URL do certificado gerado |
| `completed_at` | `timestamptz NOT NULL` | Data de conclusão |

> **Constraint:** `UNIQUE(user_id, course_id)` — um usuário só pode ter um certificado por curso.

---

## 3. Progresso

### `user_progress`

Acompanhamento de progresso do aluno em cada aula.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | `bigint` (identity) | PK |
| `user_id` | `uuid NOT NULL` | FK → `public.users(id)` ON DELETE CASCADE |
| `lesson_id` | `bigint NOT NULL` | FK → `lessons(id)` ON DELETE CASCADE |
| `completed` | `boolean NOT NULL` | Aula concluída (default: `false`) |
| `completed_at` | `timestamptz` | Data de conclusão |
| `last_watched_at` | `timestamptz` | Último acesso (default: `now()`) |
| `watched_seconds` | `integer NOT NULL` | Segundos assistidos (default: `0`) |

> **Nota:** Esta tabela **não possui** `created_at`/`updated_at`, diferente das demais.
> **Constraint:** `UNIQUE(user_id, lesson_id)` — um registro de progresso por usuário por aula.

---

## Relacionamentos

```
certificate_templates ──────────── courses (certificate_template_id)
                               └── user_certificates (certificate_template_id)

courses ──────────── modules (course_id)
             └────── user_certificates (course_id)

modules ──────────── lessons (module_id)

lessons ──────────── attachments (lesson_id)
                 └── user_progress (lesson_id)

public.users ────── user_certificates (user_id)
                └── user_progress (user_id)
```

> A notação `parent ─── child (fk_column)` indica que a coluna `fk_column` está na tabela filho e aponta para o pai.

---

## Controle de Acesso

- A leitura de cursos, módulos e aulas requer a feature `classroom` habilitada no plano do usuário (verificado via `has_module_access(uid, 'classroom')`).
- Conteúdo premium (`courses.is_premium = true`) requer adicionalmente a feature `classroom_premium`.
- Operações de escrita/gerenciamento são restritas a `super_admin`.
- `user_progress` e `user_certificates` permitem operações apenas do próprio usuário.
- A view `lessons_view` (em [`supabase/schemas/classroom/views/`](../../supabase/schemas/classroom/views/)) tem dois comportamentos distintos:
  - Usuários **sem** `classroom`: a cláusula `WHERE has_classroom = true` filtra **todas as linhas** — a view retorna zero resultados.
  - Usuários **com** `classroom` mas **sem** `classroom_premium**: aulas premium aparecem normalmente, mas `content` e `video_url` retornam `NULL`. Isso permite que o frontend liste título, descrição e duração de todas as aulas e bloqueie visualmente apenas o conteúdo das aulas premium.

> Detalhes de RLS em [rls.md](./rls.md) e [`supabase/schemas/classroom/rls/`](../../supabase/schemas/classroom/rls/).

---

## Arquivos Fonte

> Tabelas: [`supabase/schemas/classroom/tables/`](../../supabase/schemas/classroom/tables/)
> Funções: [`supabase/schemas/classroom/functions/`](../../supabase/schemas/classroom/functions/)
> Triggers: [`supabase/schemas/classroom/triggers/`](../../supabase/schemas/classroom/triggers/)
> RLS: [`supabase/schemas/classroom/rls/`](../../supabase/schemas/classroom/rls/)
> Views: [`supabase/schemas/classroom/views/`](../../supabase/schemas/classroom/views/)
> Constraints: [`supabase/schemas/classroom/constraints/`](../../supabase/schemas/classroom/constraints/)
> Indexes: [`supabase/schemas/classroom/indexes/`](../../supabase/schemas/classroom/indexes/)
