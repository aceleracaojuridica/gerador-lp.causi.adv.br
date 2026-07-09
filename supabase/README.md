# Supabase — Gerador LP

Artefatos SQL e dados de referência dos dois projetos Supabase do ecossistema.

## Regra importante

**Nunca edite migrations já criadas.** Cada arquivo em `migrations/` é um registro imutável de mudança estrutural. Novas alterações → **novo arquivo** com timestamp posterior ao último.

```
YYYYMMDDHHmmss_<nome_descritivo>.sql
```

## Estrutura

```
supabase/
├── migrations/          # Projeto B — migrations aplicáveis (Supabase SQL Editor manualmente)
├── reference/           # Snapshots de schema (somente leitura, não executar em produção)
│   └── causi/           # Projeto A — CRM + Auth + Billing
└── seeds/               # Dados de exemplo e fixtures
```

### Schema final esperado

| Tabela | Dono | Descrição |
|--------|------|-----------|
| `public.profiles` | Lovable | `subdomain` — **sem** coluna `pages` |
| `public.landing_pages` | Gerador | LPs do CRM (`schema` jsonb); `profile_id` opcional → `profiles.id` |
| `storage.gerador-lp-assets` | Gerador | Mídias das LPs (logo, advogados, seções) |
| `public.leads` | Lovable + Gerador | `nome`, `telefone`, `page_url`, `subdomain` |

**Removidas após migration 3:** `public.lps`, `public.leads_gerador`, `public.users`, coluna `profiles.pages`

```bash
# Com Supabase CLI linkado ao Projeto B
supabase db push
```

## Projeto A — Causi

| Artefato | Uso |
|----------|-----|
| `reference/causi/schema.sql` | Snapshot do schema Causi para consulta local (não é migration deste repo) |
| `reference/causi/functions/check-office-subdomain/` | Edge Function de referência — validação de subdomínio LP (deploy no Projeto A) |

## Seeds

| Artefato | Uso |
|----------|-----|
| `seeds/gerador.example.json` | Exemplos reais de `profiles` e `leads` (formato Lovable; dados preservados na migração) |
