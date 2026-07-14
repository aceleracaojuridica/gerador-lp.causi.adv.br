# Sharp 0.35+ × Next.js 16 no Linux (Vercel)

## Sintoma

Criação/salvamento de LP (ou upload na galeria / `POST /api/melhorar-imagem`) falha em produção com:

```text
Failed to load external module sharp-…:
Could not load the "sharp" module using the linux-x64 runtime
ERR_DLOPEN_FAILED: libvips-cpp.so.8.18.3: cannot open shared object file:
No such file or directory
```

Local em Windows pode funcionar; o runtime da Vercel é **linux-x64**.

## Quando dispara

Só quando há **data URL** (logo, foto de advogado, upload na galeria). URLs já no Storage / Unsplash / `lp_system_images` não passam pelo Sharp.

```
saveLp → persistLpSchemaMedia → uploadGalleryImage → optimizeImage → import("sharp")
```

Arquivos: `gallery-image-processing.ts`, `gallery-store.ts`, `media-storage.ts`, `api/melhorar-imagem/route.ts`.

## Causa

No **sharp ≥ 0.35**, o binário nativo (`@img/sharp-linux-x64`) carrega `libvips-cpp.so.*` via `dlopen` a partir de um pacote irmão (`@img/sharp-libvips-linux-x64`). Esse `.so` não aparece como `require`/`import` em JS, então o **file tracing** do Next (`@vercel/nft` / caminho Turbopack) costuma **não incluir** o libvips no artefato serverless.

Resultado: o deploy leva o `.node` do Sharp, mas não a shared library — `ERR_DLOPEN_FAILED` no Linux.

Não é bug da lógica de LP nem de RLS/Storage. É incompatibilidade de empacotamento entre:

| Camada | Detalhe |
|--------|---------|
| Sharp 0.35+ | libvips separado + load dinâmico |
| Next.js 16.2.1 | tracing ainda incompleto para esse layout |
| Vercel (Linux) | runtime onde o `.so` precisa estar no bundle |

Referências: [lovell/sharp#4543](https://github.com/lovell/sharp/issues/4543), [vercel/nft#595](https://github.com/vercel/nft/pull/595).

## Estado atual do projeto

- **Pin:** `sharp@0.34.5` (exato, sem `^`) em `package.json`
- Layout 0.34 é rastreado de forma mais confiável pelo NFT deste Next
- Já existiam: `serverExternalPackages: ["sharp"]`, hoist `@img/*` / `*sharp*` no `.npmrc`, `pnpm.supportedArchitectures` com `linux`

## Como validar

1. Criar LP **com** logo (data URL) em produção → não deve mais falhar no Sharp
2. Upload em `/galeria` e `POST /api/melhorar-imagem` → ok
3. Criar LP só com imagens de URL (sem upload) → nunca dependia do Sharp

## Quando revisitar

Pode-se voltar a `sharp@0.35.3+` quando o Next em uso incorporar o fix de tracing do libvips (ou forçar include via `outputFileTracingIncludes` / deps `@img/sharp-linux-x64` + `@img/sharp-libvips-linux-x64`). Até lá, manter o pin em `0.34.5`.
