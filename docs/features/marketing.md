# Marketing

Documentação da feature de Marketing — recurso futuro do Gerador de Landing Pages Causi.

## Status

**Em breve** — não implementado.

A seção de Marketing faz parte do dashboard planejado (junto com Landing Pages e Contatos), mas ainda não possui rota, componentes ou lógica de negócio neste repositório.

## Visão planejada

Área do dashboard destinada a ferramentas de marketing digital para o advogado, complementando as landing pages de captação. Possíveis funcionalidades futuras (não definidas):

- Campanhas de anúncios (Google Ads, Meta Ads).
- Integração com pixels e tags de conversão (parcialmente coberto por `user_settings.tracking_tags`).
- Métricas de performance das LPs (visitas, conversão, custo por lead).
- A/B testing de manchetes e CTAs.

## Estado atual no código

### Sidebar

**Arquivo:** `components/ui/AppSidebar.tsx`

```typescript
{/* future: campanhas */}
```

Comentário indicando que a navegação para campanhas/marketing será adicionada futuramente na sidebar lateral.

### Tags de conversão (parcial)

**Arquivo:** `lib/config.ts`, `components/builder/GlobalSettings.tsx`

Já é possível configurar scripts de rastreamento (GTM, Pixel, gtag) via `user_settings.tracking_tags`:

```typescript
tags: { head: string; body: string; footer: string };
```

Essas tags são injetadas na LP publicada (quando a publicação for implementada). Isso é infraestrutura de marketing, mas não constitui a feature "Marketing" do dashboard.

### Referência em copy

**Arquivo:** `components/builder/GlobalSettings.tsx`

Texto de ajuda menciona "equipe de marketing" no contexto de domínio customizado — sem funcionalidade associada.

## Dashboard planejado

O PRD define três seções no dashboard inicial:

| Seção | Rota atual | Rota alvo | Status |
|-------|------------|-----------|--------|
| Landing Pages | `/` | `/dashboard` ou `/` | Implementado |
| Contatos/Leads | `/dashboard` | `/dashboard/leads` | Implementado |
| Marketing | — | `/dashboard/marketing` | **Não implementado** |

## Implementação proposta (placeholder)

### Rota

```
app/dashboard/marketing/page.tsx
```

### Conteúdo mínimo

Página com mensagem "Em breve" em português, seguindo o design system da aplicação (`app-ui`, `MIcon`, paleta Causi).

```tsx
export default function MarketingPage() {
  return (
    <div className="app-ui min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-slate-900">Marketing</h1>
        <p className="mt-2 text-sm text-slate-500">Em breve</p>
      </div>
    </div>
  );
}
```

### Navegação

Adicionar item na sidebar (`AppSidebar`) ou em um hub de dashboard com as três abas.

### Guard

`requireLpAccess()` — mesma proteção das demais páginas.

## Dependências futuras

| Dependência | Motivo |
|-------------|--------|
| Publicação de LPs | Métricas dependem de tráfego real |
| Captura de leads | Taxa de conversão |
| Integração com plataformas de ads | Campanhas pagas |
| Analytics | Visitas e comportamento |

## Fora de escopo (v1)

- Criação e gestão de campanhas pagas.
- Editor de anúncios.
- Integração direta com Google Ads API / Meta Marketing API.
- CRM de marketing automation.

## Referências

- [prd.md](../prd.md) — RF-08 Marketing
- [architecture.md](../architecture.md) — melhorias recomendadas
- [features/landing-pages.md](landing-pages.md) — tags de conversão
