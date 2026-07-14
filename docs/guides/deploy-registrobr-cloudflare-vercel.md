# Deploy: Registro.br + Cloudflare + Vercel (Wildcard Multi-Tenant)

Configuração de domínio, DNS, SSL e redirects do gerador de landing pages Causi: dois domínios no Registro.br, DNS autoritativo na Cloudflare (Redirect Rules no apex/`www` de `causi.adv.br`) e hospedagem na Vercel com certificado wildcard para subdomínios dinâmicos.

---

## Arquitetura

Dois contextos distintos:

| Host | Função |
| --- | --- |
| `marketing.causi.com.br` | SaaS — login, dashboard, CMS, administração |
| `{office}.causi.adv.br` | Sites públicos dos clientes (landing pages) |

O apex `causi.adv.br` e o `www.causi.adv.br` **não** representam um cliente. Eles redirecionam para o marketing na borda da Cloudflare; a Vercel só recebe tráfego de subdomínios de escritório.

```text
marketing.causi.com.br
        │
        ├── Login
        ├── Dashboard
        ├── CMS
        └── Administração

causi.adv.br
        │
        └── 308 → marketing.causi.com.br   (Cloudflare Redirect Rule)

www.causi.adv.br
        │
        └── 308 → marketing.causi.com.br   (Cloudflare Redirect Rule)

cliente.causi.adv.br
        │
        └── Landing Page do cliente         (Vercel / Next.js)
```

URLs:

| URL | Papel |
| --- | --- |
| `https://marketing.causi.com.br` | App principal (dashboard, editor, auth) |
| `https://causi.adv.br` / `https://www.causi.adv.br` | Redirect 308 → `marketing.causi.com.br` (Cloudflare) |
| `https://{lp_accounts.office_subdomain}.causi.adv.br/{landing_pages.slug}` | LP publicada do escritório |

Exemplo de LP:

```
https://aceleracao-juridica.causi.adv.br/previdenciario
```

No app, `lp_accounts.office_subdomain` é a fonte canônica do host público (provisionado a partir de `accounts.slug` na primeira visita; denormalizado em `landing_pages.office_subdomain` para lookup público). O proxy (`src/proxy.ts`) lê o `Host`, extrai o subdomínio e reescreve para a rota multi-tenant.

```
                 Registro.br
                      │
          Nameservers Cloudflare
                      │
        ┌─────────────┴─────────────┐
        │                           │
  causi.com.br                 causi.adv.br
        │                           │
        │                    Cloudflare Rules
        │                    (apex / www → 308)
        │                           │
        │              *.causi.adv.br → CNAME
        │                           │
        │               cname.vercel-dns-0.com
        │                           │
        └─────────────┬─────────────┘
                      │
                   Vercel
                      │
                 Next.js App
                      │
             Proxy Multi-Tenant
```

Papéis:

| Camada | Responsabilidade |
| --- | --- |
| Registro.br | Registro do domínio; delegação de nameservers |
| Cloudflare | DNS autoritativo, CDN, WAF, cache, proxy, **Redirect Rules** (apex/`www` → marketing) |
| Vercel | Host do Next.js (LPs multi-tenant + app em `marketing`), certificados TLS (incluindo wildcard via ACME) |

Arquitetura alvo (não migrar DNS para a Vercel):

```
Registro.br
    ↓
Cloudflare (DNS + WAF + CDN + Cache + Redirect Rules)
    ↓
Vercel (Hosting — LPs e marketing)
```

---

## 1. Registro.br — Delegar nameservers

Nos dois domínios (`causi.com.br` e `causi.adv.br`), altere os nameservers para os da zona Cloudflare (exibidos em Cloudflare → domínio → Overview).

Exemplo (valores reais vêm da Cloudflare):

```
cortney.ns.cloudflare.com
will.ns.cloudflare.com
```

Após a propagação, o Registro.br não gerencia registros DNS — apenas mantém a delegação.

Checklist:

1. Criar zona Cloudflare para cada domínio.
2. Copiar os dois nameservers da Cloudflare.
3. No Registro.br → domínio → DNS/Nameservers → apontar para a Cloudflare.
4. Aguardar status “Active” na Cloudflare.

**Não** aponte os nameservers do Registro.br para `ns1.vercel-dns.com` / `ns2.vercel-dns.com`. Isso transferiria a zona DNS inteira para a Vercel e removeria a Cloudflare do caminho autoritativo.

---

## 2. Cloudflare — DNS por domínio

Toda configuração DNS fica na Cloudflare. Prefira **DNS only** (nuvem cinza) nos registros que apontam para a Vercel durante validação de domínio e emissão de certificado. Proxy (nuvem laranja) pode ser ligado depois, com SSL Cloudflare em Full (strict) quando houver certificado válido na origem.

### 2.1 Dois CNAMEs da Vercel

| Destino | Uso |
| --- | --- |
| `cname.vercel-dns.com` | Subdomínios **comuns** (`www`, `marketing`, etc.). Certificado via HTTP-01. |
| `cname.vercel-dns-0.com` | **Somente** o registro wildcard (`*`), no cenário sem nameservers Vercel no apex. Certificado via DNS-01 + `_acme-challenge`. |

O wildcard **não** deve apontar para `cname.vercel-dns.com`. O `www` **não** deve usar `cname.vercel-dns-0.com`.

Fonte: [Wildcard domains without Vercel Nameservers](https://vercel.com/kb/guide/wildcard-domain-without-vercel-nameservers).

### 2.2 `causi.com.br` — app / marketing

| Tipo | Nome | Conteúdo | Proxy |
| --- | --- | --- | --- |
| CNAME | `marketing` | `cname.vercel-dns.com` (ou valor do painel Vercel) | DNS only (validação); depois opcional |
| CNAME | `www` | `cname.vercel-dns.com` (ou redirect para marketing) | conforme política |

Se o apex (`@`) também apontar para a Vercel, use o valor A/ALIAS mostrado em Project → Settings → Domains. Neste projeto o entrypoint do gerador é `marketing.causi.com.br`.

### 2.3 `causi.adv.br` — multi-tenant (wildcard)

Zona Cloudflare — configuração recomendada:

| Tipo | Nome | Conteúdo | Proxy |
| --- | --- | --- | --- |
| A | `@` | valor indicado pela Vercel no painel (ex.: `216.198.79.1`) | DNS only na validação; **Proxied** para Redirect Rules |
| CNAME | `www` | `cname.vercel-dns.com` | DNS only na validação; **Proxied** para Redirect Rules |
| CNAME | `*` | `cname.vercel-dns-0.com` | **DNS only** na validação |
| NS | `_acme-challenge` | `ns1.vercel-dns.com.` | — |
| NS | `_acme-challenge` | `ns2.vercel-dns.com.` | — |

Em notação DNS:

```dns
@                  A       216.198.79.1             ; ou o A do painel Vercel
www                CNAME   cname.vercel-dns.com
*                  CNAME   cname.vercel-dns-0.com
_acme-challenge    NS      ns1.vercel-dns.com.
_acme-challenge    NS      ns2.vercel-dns.com.
```

![Registros DNS de causi.adv.br na Cloudflare (A apex, CNAME www/wildcard, NS _acme-challenge)](../static/cloudflare-dns.png)

O IP do apex muda conforme o projeto — **prevalece o valor exibido** em Project → Settings → Domains, não um IP antigo memorizado.

Redirect Rules da Cloudflare (apex/`www` → marketing) só se aplicam a hosts [proxied](https://developers.cloudflare.com/dns/proxy-status/) (nuvem laranja). Após validar o domínio na Vercel, ative o proxy em `@` e `www` e configure as regras da [seção 3](#3-cloudflare--redirect-rules-apex--www).

O wildcard `*` cobre qualquer escritório:

```
cliente1.causi.adv.br
cliente2.causi.adv.br
...
```

Verificação rápida:

```bash
nslookup marketing.causi.com.br
nslookup qualquer-slug.causi.adv.br
```

Esperado: subdomínio comum → `cname.vercel-dns.com`; host wildcard → `cname.vercel-dns-0.com`.

---

## 3. Cloudflare — Redirect Rules (apex / www)

O apex e o `www` de `causi.adv.br` são portas de entrada para a plataforma, não clientes. O redirecionamento acontece na **borda da Cloudflare**, antes da Vercel.

**Não** configure esse redirect em Project → Settings → Domains na Vercel. A Vercel trata `www` como alias do apex e rejeita um segundo redirect independente com erro do tipo:

> You have redirected another domain (`causi.adv.br`) to this domain. In turn, you cannot redirect this one.

Mantenha os três hosts associados ao projeto Vercel (para DNS/SSL multi-tenant):

- `causi.adv.br`
- `www.causi.adv.br`
- `*.causi.adv.br`

Sem redirect de domínio na Vercel. As [Redirect Rules](https://developers.cloudflare.com/rules/url-forwarding/) na Cloudflare cuidam do apex e do `www`.

Pré-requisito: registros `@` e `www` com **Proxied** (nuvem laranja).

Caminho no dashboard:

```
Rules → Redirect Rules → Create rule
```

(ou **Rules → Overview → Redirect Rules**)

![Redirect Rules na Cloudflare: apex e www de causi.adv.br → 308 marketing.causi.com.br](../static/cloudflare-rules.png)

### Regra 1 — Redirect apex to marketing

| Campo | Valor |
| --- | --- |
| Nome | `Redirect apex to marketing` |
| Match | Custom filter expression |
| Expression | `(http.host eq "causi.adv.br")` |
| Then | Dynamic Redirect |
| Target expression | `concat("https://marketing.causi.com.br", http.request.uri.path)` |
| Status | `308` Permanent Redirect |

Exemplos:

```
https://causi.adv.br
  → https://marketing.causi.com.br

https://causi.adv.br/login
  → https://marketing.causi.com.br/login

https://causi.adv.br/abc
  → https://marketing.causi.com.br/abc
```

### Regra 2 — Redirect www to marketing

| Campo | Valor |
| --- | --- |
| Nome | `Redirect www to marketing` |
| Match | Custom filter expression |
| Expression | `(http.host eq "www.causi.adv.br")` |
| Then | Dynamic Redirect |
| Target expression | `concat("https://marketing.causi.com.br", http.request.uri.path)` |
| Status | `308` Permanent Redirect |

### Resultado

```text
causi.adv.br          ──308──► marketing.causi.com.br
www.causi.adv.br      ──308──► marketing.causi.com.br
cliente.causi.adv.br  ───────► Vercel (LP do escritório)
```

Documentação: [Redirects](https://developers.cloudflare.com/rules/url-forwarding/) · [Bulk Redirects (alternativa)](https://developers.cloudflare.com/rules/url-forwarding/bulk-redirects/create-dashboard/).

---

## 4. Vercel — Domínios do projeto

No projeto Vercel do gerador, adicione:

**`causi.com.br` (app):**

- `marketing.causi.com.br`

**`causi.adv.br` (LPs):**

- `causi.adv.br`
- `www.causi.adv.br`
- `*.causi.adv.br`

![Domínios do projeto na Vercel: *.causi.adv.br, www, marketing.causi.com.br e causi.adv.br](../static/vercel-domain.png)

O wildcard atende todos os subdomínios de escritório com o mesmo deployment Next.js. Apex e `www` ficam no projeto para emissão/validação SSL, mas o tráfego HTTP deles é interceptado pelas Redirect Rules da Cloudflare (seção 3) — **não** use o redirect de domínio da Vercel para apontá-los a `marketing.causi.com.br`.

Com proxy Cloudflare ativo, a Vercel pode exibir o aviso **Proxy Detected** em `causi.adv.br` e `www.causi.adv.br` — esperado neste cenário.

### Não usar “Enable Vercel DNS”

Nesse cenário **não** clique em **Enable Vercel DNS** no apex.

Esse botão prepara a migração do gerenciamento DNS do domínio para a Vercel (nameservers `ns1.vercel-dns.com` / `ns2.vercel-dns.com`). A arquitetura passaria a ser:

```
Registro.br → Vercel DNS → Vercel Hosting
```

Consequências indesejadas:

- Cloudflare deixa de ser autoritativa
- Zonas DNS precisam ser recriadas na Vercel
- Perde-se CDN, WAF, cache e regras centralizadas na Cloudflare

**Enable Vercel DNS** só faz sentido se a decisão for abandonar a Cloudflare como DNS. Para mantê-la, use exclusivamente o workaround `_acme-challenge` + CNAME `cname.vercel-dns-0.com`.

Variáveis de ambiente relevantes (produção):

| Variável | Exemplo de produção | Uso |
| --- | --- | --- |
| `APP_URL` | `https://marketing.causi.com.br` | URL do app (redirects, links absolutos) |
| `NEXT_PUBLIC_APP_DOMAIN` | `causi.adv.br` | Host base das LPs públicas |

Ajuste os valores ao ambiente real (`APP_URL` / domínio do app) e mantenha `NEXT_PUBLIC_APP_DOMAIN=causi.adv.br` para URLs `{office}.{domínio}/{slug}`.

---

## 5. Wildcard sem nameservers Vercel (workaround oficial)

Por padrão a Vercel prefere nameservers próprios para emitir/renovar `*.dominio`. Com Cloudflare no apex, o caminho documentado é: [wildcard without Vercel nameservers](https://vercel.com/kb/guide/wildcard-domain-without-vercel-nameservers).

| Host | Destino | Certificado |
| --- | --- | --- |
| `www.causi.adv.br` | `cname.vercel-dns.com` | HTTP-01 (automático na Vercel) |
| `*.causi.adv.br` | `cname.vercel-dns-0.com` | DNS-01 via `_acme-challenge` |
| `_acme-challenge` | NS → `ns1` / `ns2.vercel-dns.com` | Controle ACME pela Vercel |

Essa delegação NS pode impedir outros provedores de emitir certificados ACME no mesmo domínio — use só se o SSL das LPs for da Vercel.

### Passo 1 — Delegar `_acme-challenge` (Cloudflare)

Na zona de **`causi.adv.br`**:

| Tipo | Nome | Conteúdo |
| --- | --- | --- |
| NS | `_acme-challenge` | `ns1.vercel-dns.com.` |
| NS | `_acme-challenge` | `ns2.vercel-dns.com.` |

A Cloudflare continua autoritativa do domínio. Só `_acme-challenge.causi.adv.br` é resolvido pelos NS da Vercel, que publica os TXT ACME e renova o wildcard.

Se o wildcard fosse em um nível abaixo (ex.: `*.app.exemplo.com`), os NS seriam em `_acme-challenge.app`. Aqui o wildcard é `*.causi.adv.br`, então o nome é só `_acme-challenge`.

### Passo 2 — CNAME do wildcard

| Tipo | Nome | Conteúdo | Proxy |
| --- | --- | --- | --- |
| CNAME | `*` | `cname.vercel-dns-0.com` | DNS only na validação |

### Fluxo ACME

```
Let's Encrypt
      │
      ▼
_acme-challenge.causi.adv.br
      │
      ▼
Cloudflare (NS → Vercel)
      │
      ▼
ns1/ns2.vercel-dns.com
      │
      ▼
TXT ACME (Vercel)
      │
      ▼
Certificado *.causi.adv.br
```

`marketing.causi.com.br` e `www` são hostnames comuns (HTTP-01). O workaround DNS-01 aplica-se a `*.causi.adv.br`.

Sem certificado wildcard, o domínio fica Invalid Configuration na Vercel e, com proxy Cloudflare ativo, o visitante pode ver **525 SSL Handshake Failed**.

---

## 6. Multi-tenant no app

1. Request chega com `Host: {office_subdomain}.causi.adv.br`.
2. O proxy extrai o subdomínio e reescreve para `(subdomains)/[escritorio]/[slug]`.
3. `getLpPublic(office_subdomain, slug)` busca LP com `status = published` (filtro em `landing_pages.office_subdomain` + `slug`).
4. Raiz do subdomínio (sem path de LP) redireciona para o app (`APP_URL`).

Escalabilidade: milhares de subdomínios → um projeto Vercel, um wildcard DNS, um certificado `*.causi.adv.br`.

---

## 7. Checklist de go-live

### Registro.br

- [ ] Nameservers de `causi.com.br` → Cloudflare (não Vercel)
- [ ] Nameservers de `causi.adv.br` → Cloudflare (não Vercel)
- [ ] Zonas Active na Cloudflare

### Cloudflare — `causi.com.br`

- [ ] CNAME `marketing` → `cname.vercel-dns.com` (ou valor do painel)
- [ ] DNS only durante validação Vercel

### Cloudflare — `causi.adv.br`

- [ ] **Não** clicar em Enable Vercel DNS
- [ ] A `@` → IP do painel Vercel (ex.: `216.198.79.1`)
- [ ] CNAME `www` → `cname.vercel-dns.com`
- [ ] CNAME `*` → `cname.vercel-dns-0.com` (DNS only na validação)
- [ ] NS `_acme-challenge` → `ns1.vercel-dns.com.` e `ns2.vercel-dns.com.`
- [ ] Proxy (nuvem laranja) em `@` e `www` após validação
- [ ] Redirect Rule: `causi.adv.br` → 308 `marketing.causi.com.br` (+ path)
- [ ] Redirect Rule: `www.causi.adv.br` → 308 `marketing.causi.com.br` (+ path)

### Vercel

- [ ] Domínio `marketing.causi.com.br` Valid
- [ ] Domínios `causi.adv.br`, `www.causi.adv.br`, `*.causi.adv.br` Valid
- [ ] **Sem** redirect de domínio Vercel de apex/`www` → marketing (usar Cloudflare)
- [ ] Certificado wildcard emitido para `*.causi.adv.br`
- [ ] Env: `APP_URL`, `NEXT_PUBLIC_APP_DOMAIN` e demais secrets de produção

### Validação funcional

- [ ] `https://marketing.causi.com.br` abre o app
- [ ] `https://causi.adv.br` e `https://www.causi.adv.br` → 308 para marketing (path preservado)
- [ ] `https://{office_subdomain}.causi.adv.br/{lp-slug}` abre a LP publicada
- [ ] HTTPS sem 525 / certificate error
- [ ] Renovação ACME: manter os NS de `_acme-challenge` permanentes

---

## 8. Troubleshooting rápido

| Sintoma | Verificação | Ação típica |
| --- | --- | --- |
| Domínio Invalid Configuration | CNAME `*` e NS `_acme-challenge` | `*` → `cname.vercel-dns-0.com` (não `cname.vercel-dns.com`); NS ACME; aguardar propagação |
| Wildcard apontando para `cname.vercel-dns.com` | Registro `*` na Cloudflare | Trocar para `cname.vercel-dns-0.com` |
| Enable Vercel DNS ativado | Nameservers no Registro.br | Manter NS Cloudflare; desfazer migração se os NS tiverem ido para a Vercel |
| Erro Vercel ao redirecionar www/apex | Domains → Redirect | Remover redirect na Vercel; usar Redirect Rules na Cloudflare |
| Apex/`www` não redirecionam | Proxy + Redirect Rules | Nuvem laranja em `@`/`www`; regras ativas com host match e 308 |
| 525 SSL Handshake Failed | Certificado na origem / proxy | Wildcard Valid na Vercel; SSL Full (strict) só com cert válido |
| Host resolve, app errado | Domínio no projeto Vercel | Conferir domains attached ao projeto certo |
| LP 404 | `office_subdomain` + `slug` + `published` | Dados no Projeto B e Host batendo com `lp_accounts.office_subdomain` |

---

## Referências

- [architecture.md](../architecture.md) — publicação e proxy multi-tenant
- [features/landing-pages.md](../features/landing-pages.md) — URL pública e status
- [Vercel KB — Wildcard sem nameservers Vercel](https://vercel.com/kb/guide/wildcard-domain-without-vercel-nameservers)
- [Vercel — Why Domain Nameservers for Wildcard](https://vercel.com/kb/guide/why-use-domain-nameservers-method-wildcard-domains)
- [Vercel — Adding a Custom Domain](https://vercel.com/docs/domains/working-with-domains/add-a-domain)
- [Cloudflare — DNS records](https://developers.cloudflare.com/dns/manage-dns-records/)
- [Cloudflare — Redirects](https://developers.cloudflare.com/rules/url-forwarding/)
- [Cloudflare — Bulk Redirects (dashboard)](https://developers.cloudflare.com/rules/url-forwarding/bulk-redirects/create-dashboard/)
