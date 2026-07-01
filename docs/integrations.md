# Integrações externas e banco compartilhado

Documento de referência sobre os três sistemas que o gerador de landing pages toca: o **CRM Causi** (Projeto A), o **banco compartilhado com o Lovable** (Projeto B) e as oportunidades de reuso entre os projetos sem quebrar o que já está validado.

---

## Visão macro dos sistemas

```
┌──────────────────────────────────────────────────────────────┐
│                       USUÁRIO (advogado)                     │
└───────────────┬────────────────────────┬─────────────────────┘
                │ auth.uid()             │ auth.uid()
                ▼                        ▼
┌─────────────────────────┐  ┌───────────────────────────────┐
│    PROJETO A — Causi    │  │   PROJETO B — Gerador LP      │
│  (CRM + Auth + Billing) │  │   (compartilhado c/ Lovable)  │
│                         │  │                               │
│  auth.users             │  │  ── Zona Lovable ──           │
│  public.users           │  │  public.profiles              │
│  public.accounts        │  │  public.leads                 │
│  public.persons  ◄──────┼──┼──── ponte futura ────        │
│  public.deals           │  │                               │
│  public.conversations   │  │  ── Zona LP Builder ──        │
│  public.pipelines       │  │                 │
│  billing.plans          │  │           │
│  billing.subscriptions  │  │  public.landing_pages         │
│                         │  │  public.leads_gerador  ───────┼──► CRM
└─────────────────────────┘  └───────────────────────────────┘
         ▲                               ▲
         │ NEXT_PUBLIC_SUPABASE_URL      │ LP_SUPABASE_URL
         │ (browser + server client)     │ (service_role — server only)
         └───────── gerador-site ────────┘
```

---

## 1. Autenticação — Projeto A como identidade única

### Como funciona hoje

| Etapa | Código | O que acontece |
|-------|--------|----------------|
| Login | `lib/supabase/client.ts` | `signInWithPassword` no Supabase Causi (Projeto A) |
| Sessão | `lib/session/get-session.ts` | `auth.getUser()` + RPC `get_current_user_details_v4` |
| Plano | `lib/session/access.ts` | Compara `plan_id === 9` (LP_PLAN_ID) |
| Dados LP | `lib/supabase/admin.ts` (`lpAdmin`) | Service role no Projeto B, escopado por `causi_user_id` |

O `auth.uid()` do Projeto A é o elo entre os três sistemas. Esse mesmo UUID vira `causi_user_id` (texto) no Projeto B e é o que identifica o usuário no Lovable.

### O que o Lovable faz com a mesma identidade

O Lovable também autentica pelo Projeto A. Quando publica um site em um subdomínio, grava uma linha em `public.profiles` (Projeto B) com o subdomain. Os leads capturados nesse site vão para `public.leads` (Projeto B), associados ao mesmo subdomain.

Ou seja: **o mesmo `auth.uid()` que nos identifica no gerador identifica o escritório no Lovable.** Isso é a base de qualquer integração futura.

### Pontos de melhoria — autenticação

| Problema | Impacto atual | Recomendação |
|----------|---------------|--------------|
| RPC chamada a cada request | Latência extra em toda navegação | Cache do plano em cookie httpOnly (TTL 5 min) |
| `subscription.status` não verificado | Usuário com plano cancelado/suspenso pode acessar | Validar `sub.status === 'active'` em `hasLpAccess()` |
| APIs de IA sem guard | `melhorar-texto`, `melhorar-imagem`, `imagem` acessíveis sem plano | Adicionar `requireLpSession` nesses handlers |
| Middleware não valida plano | Flash de conteúdo antes do redirect | Mover cheque de plano para middleware com JWT claim |

---

## 2. Banco compartilhado — Projeto B (Lovable + LP Builder)

### Mapa de propriedade das tabelas

```
Projeto B — Supabase Gerador LP
├── public.profiles     → Lovable     🚫 não tocar
├── public.leads        → Lovable     🚫 não tocar
├── public.landing_pages        → LP Builder  ✅ nossa
```

### Por que estão no mesmo banco

O Lovable e o gerador compartilham o Projeto B por design: ambos servem o mesmo usuário Causi e precisam de um repositório de dados de LP. O par `profiles` + `leads` cobre o fluxo do Lovable (site por subdomínio → leads daquele subdomínio). O conjunto `landing_pages` cobre o fluxo do LP Builder (LP por `causi_user_id` → leads daquele escritório).

### Diferença estrutural entre os modelos de lead

| Aspecto | `public.leads` (Lovable) | `public.leads_gerador` (LP Builder) |
|---------|--------------------------|-------------------------------------|
| Escopo | `subdomain` | `causi_user_id` |
| Chave do dono | subdomínio do site publicado | UUID do usuário Causi |
| Dados | nome, telefone, page_url, subdomain | nome, telefone, e-mail, answers (jsonb), lp_id, page_url |
| Contexto extra | Nenhum — apenas o subdomain | `lp_id` → rastreia qual LP gerou o lead |

Apesar do objetivo ser o mesmo (capturar contato de visitante), os modelos são intencionalmente separados porque o escopo de dono é diferente.

### Oportunidade de reuso: subdomínios via `profiles`

O Lovable já valida e registra subdomínios em `public.profiles`. Quando implementarmos publicação de LPs com subdomínios (`client_slug`), podemos:

- **Ler** `profiles` para checar se um subdomain já está ocupado antes de publicar.
- **Não gravar** diretamente em `profiles` — deixar o Lovable gerenciar a tabela dele.
- Em vez disso, adicionar coluna `published_subdomain` em `public.lps` e coordenar com o Lovable via API/webhook quando necessário.

Isso preserva o fluxo do Lovable e nos dá visibilidade de colisões de subdomínio.

---

## 3. Armazenamento (Storage)

### Projeto A — CRM Causi

O Projeto A tem Supabase Storage implícito via:
- `public.persons.photo` — URL de foto do contato (campo texto, não bucket gerenciado aqui).
- `public.users.photo` — Avatar do usuário Causi.

O gerador não usa Storage do Projeto A hoje. Qualquer integração de "enviar foto do lead para o CRM" precisaria de um upload intermediário no Projeto A ou usar URL pública.

### Projeto B — Gerador LP

Bucket **`gerador-lp-assets`** (público, leitura anônima) no Projeto B. Upload via `service_role` em `lib/media/storage.ts`.

```
{subdomain}.causi.adv.br/{lp-slug}/logo/logo.webp
{subdomain}.causi.adv.br/{lp-slug}/lawyers/{id}.webp
{subdomain}.causi.adv.br/{lp-slug}/sections/{hero|dor|sobre|solucao}.webp
```

Sem `profiles.subdomain`: `_sem-subdominio/{causi_user_id}/{lp-slug}/...`

Imagens de cenário (Unsplash) são espelhadas no Storage ao salvar a LP. Fotos de advogados e logo sobem no upload (editor) ou na gravação (`saveLp`).

Migration: `supabase/migrations/20260629160000_gerador_lp_storage_bucket.sql`

### O que o Lovable usa

O Lovable gerencia imagens de sites publicados provavelmente via Storage do Projeto B (bucket não documentado aqui). Para não colidir:
- Não criar buckets com nomes que conflitem com os do Lovable.
- Se for criar um bucket para uploads do LP Builder (fotos de advogados, logos), usar prefixo `lp-builder/` nos caminhos.

### Oportunidade: Storage unificado para uploads de usuário

Hoje, fotos de advogados são URLs externas (sem upload gerenciado). Para melhorar a experiência:

```
Bucket sugerido: lp-builder-assets
Path pattern:    {causi_user_id}/{lp_slug}/{filename}
Acesso:          público (URLs servidas diretamente nas LPs)
Responsabilidade: LP Builder gerencia; Lovable não toca
```

---

## 4. Integração LP Builder → CRM Causi (ponte de leads)

Este é o maior gap e a maior oportunidade: leads capturados nas LPs do gerador não chegam ao CRM Causi. O ciclo completo seria:

```
LP publicada → LeadPopup → leads_gerador (Projeto B)
                                │
                                ▼ (bridge)
                         public.persons (Projeto A — CRM)
                                │
                                ▼
                         public.deals (Projeto A — pipeline)
                                │
                                ▼
                    Advogado atende no CRM Causi
```

### Como implementar sem quebrar o Causi

A ponte deve ser **unidirecional e assíncrona**:

1. `POST /api/lead` grava em `leads_gerador` (Projeto B) como hoje.
2. Um segundo passo (pode ser um webhook, cron ou trigger de banco) chama a API do Causi para criar `persons` + `deals`.
3. O Causi recebe a requisição via API autenticada com a chave do escritório — não há acesso direto cross-database.

```typescript
// Pseudocódigo — bridge lead → CRM
async function bridgeLeadToCrm(lead: NewLead, session: Session) {
  const causiApi = createCausiClient(session.causiApiToken);

  // 1. Criar/encontrar person
  const person = await causiApi.persons.upsert({
    name: lead.name,
    phone: lead.phone,
    email: lead.email,
    account_id: session.account.id,
    additional_info: JSON.stringify(lead.answers),
  });

  // 2. Criar deal no pipeline de leads de LP
  await causiApi.deals.create({
    name: `Lead LP — ${lead.lpName}`,
    person_id: person.id,
    pipeline_stage_id: LP_PIPELINE_FIRST_STAGE_ID,
    account_id: session.account.id,
    origin: "landing_page",
  });
}
```

**Por que via API e não cross-database?**
- O Projeto B usa `service_role` — ele poderia, tecnicamente, acessar o Projeto A com as credenciais certas. Mas isso acoplaria os bancos no nível de infra.
- Via API do Causi, o Projeto A mantém controle de suas próprias validações (RLS, permissões, billing).
- Mais fácil de escalar: o Causi pode ter rate limiting, autenticação por token de integração, etc.

### Mapeamento de campos

| Campo em `leads_gerador` | Campo em Causi CRM | Observação |
|--------------------------|-------------------|------------|
| `name` | `persons.name` | Direto |
| `phone` | `person_phones.phone` | Requer `country_code` e `full_phone` |
| `email` | `person_emails.email` | Requer `label` = "principal" |
| `answers` (jsonb) | `persons.additional_info` ou custom field | Serializar como texto estruturado |
| `lp_id` → `lps.name` | `deals.name` | "Lead LP — {nome da LP}" |
| `created_at` | `deals.created_at` | Automático |
| `page_url` | `deals.additional_info` | URL de origem |

---

## 5. O que o Lovable e o LP Builder têm em comum (reuse potencial)

| Aspecto | Lovable | LP Builder | Reuse possível |
|---------|---------|------------|----------------|
| Autenticação | Projeto A (`auth.uid()`) | Projeto A (`auth.uid()`) | ✅ Já compartilham |
| Escopo de dados | `subdomain` | `causi_user_id` | Indireto via auth.uid() |
| Subdomínios | `profiles.subdomain` | `lps.client_slug` (futuro) | Checar colisão lendo `profiles` |
| Leads | `leads` (subdomain-based) | `leads_gerador` (user-based) | Estrutura diferente, mesmo propósito |
| Banco | Projeto B (service_role) | Projeto B (service_role) | ✅ Mesmo banco, tabelas separadas |
| Storage | Bucket próprio (não documentado) | Sem bucket hoje | Prefixar por projeto |

### O que NÃO fazer ao integrar

1. **Não gravar em `profiles` ou `leads`** — essas tabelas têm fluxo validado pelo Lovable.
2. **Não alterar colunas existentes** em qualquer tabela do Projeto B sem alinhar com o time Lovable.
3. **Não adicionar FK entre nossas tabelas e as tabelas do Lovable** — o acoplamento é implícito (via subdomain/user_id), não deve virar restrição de banco.
4. **Não subir migrations no Projeto B sem revisão** — qualquer DDL impacta os dois projetos.

---

## 6. Gaps de integração e roadmap

### Gaps imediatos (bloqueiam MVP)

| Gap | Impacto | Ação |
|-----|---------|------|
| `POST /api/lead` ausente | Leads não são capturados em produção | Implementar endpoint público |
| `POST /api/lead` sem bridge para CRM | Lead capturado não entra no pipeline do advogado | Implementar após a captura básica |

### Gaps de segurança

| Gap | Impacto | Ação |
|-----|---------|------|
| `subscription.status` não verificado | Usuário com plano cancelado acessa o gerador | Validar status em `hasLpAccess()` |
| APIs de IA sem guard de plano | Uso sem assinatura válida | Adicionar `requireLpSession` |
| Sem RLS no Projeto B | Segurança 100% no código | Considerar RLS com custom JWT |

### Melhorias de integração (pós-MVP)

| Feature | Pré-requisito | Descrição |
|---------|---------------|-----------|
| Bridge lead → CRM | `POST /api/lead` funcionando | Criar person + deal no Causi a cada lead |
| Publicação com subdomínio | Lógica de `profiles` alinhada com Lovable | Checar colisões, publicar LP em `[slug].causi.com.br` |
| Storage de uploads | Definir bucket no Projeto B | Permitir upload de logo e fotos de advogados |
| Sync bidirecional de configurações | API Causi exposta | Puxar nome do escritório do Causi automaticamente ao criar LP |

---

## Referências

- [database.md](database.md) — schemas completos do Projeto A e B
- [architecture.md](architecture.md) — dual-database e clientes Supabase
- [features/authentication.md](features/authentication.md) — fluxo de auth e guards
- [features/leads.md](features/leads.md) — captura de leads e dashboard
- `supabase/causi.sql` — schema de referência Causi (Projeto A)
- `supabase/gerador.causi.sql` — schema de referência Gerador LP (Projeto B)
- `lib/session/get-session.ts` — RPC + montagem de sessão
- `lib/session/access.ts` — `LP_PLAN_ID` e `hasLpAccess`
