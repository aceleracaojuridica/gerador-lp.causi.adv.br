# Changelog

## 2026-05-05

### Objetivo inicial

Implementar o novo fluxo de foto da pessoa para eliminar o problema de payload em Server Actions (`Body exceeded 1 MB limit`) e substituir o envio binário pelo servidor por um fluxo em duas etapas:

- `update`: upload da imagem no cliente antes da mutation principal.
- `create`: criação da pessoa primeiro, upload depois, persistindo a URL pública somente quando o `personId` já existir.

O plano original também fixou os seguintes requisitos:

- crop/zoom com `react-avatar-editor`
- compressão client-side com `browser-image-compression`
- preservação do formato original entre `jpg`, `png` e `webp`
- dimensão final máxima de `512x512`
- guia visual circular com exportação real quadrada `1:1`
- uso obrigatório de `src/lib/media/paths.ts` para montagem dos paths
- persistência sempre da URL pública em `persons.photo`
- nenhuma sugestão ou mudança de RLS

### Correções de rumo e decisões tomadas durante o trabalho

O escopo e a arquitetura foram refinados durante a implementação. As correções relevantes foram:

- não aumentar o limite de Server Actions; o problema deveria ser resolvido mudando a arquitetura de upload
- nunca usar a RPC `update_person_photo`; toda persistência de foto deve acontecer direto via Supabase SDK sobre a tabela `persons`
- o visual de referência para a área de imagem é `src/forms/PersonForm/person-form.tsx`; `src/forms/ProfileForm/profile-form.tsx` não deveria ser usado como base de styling inicial
- o path final depende de `personId`, então não é possível subir a foto antes do `create`; isso consolidou o modelo em duas etapas
- o plano inicial previa o editor como modo interno do dialog atual, sem popup aninhado; depois isso foi revisado e o editor passou a abrir em dialog stackado
- o editor deixou de ser específico de pessoa e passou a ser um editor genérico de avatar, para reaproveitamento em outros fluxos, incluindo perfil
- dialogs stackados precisaram de ajustes visuais próprios no `Dialog` compartilhado:
	- `DialogOverlay` do stackado com `m-[-1px]`
	- `DialogContent` stackado com largura equivalente a `calc(100% - 36px)`

### Implementado

#### 1. Pipeline client-side de imagem

Foi adicionada a dependência `browser-image-compression` e criado um pipeline reutilizável em `src/lib/media/image-client.ts` com:

- validação de tipo e tamanho da imagem de entrada
- normalização de tipos aceitos (`image/jpeg`, `image/png`, `image/webp`)
- exportação de `canvas` para `File` mantendo o MIME original quando suportado
- otimização client-side com resolução máxima de `512x512`
- helpers genéricos para avatar (`validateAvatarImageFile`, `optimizeAvatarImage`)
- compatibilidade retroativa com os nomes anteriores (`validatePersonPhotoFile`, `optimizePersonPhoto`)

#### 2. Refatoração das actions de pessoa

O arquivo `src/app/(app)/(pessoas)/pessoas/actions.ts` foi reorganizado para remover a dependência de binário em Server Actions:

- `createPersonAction`
	- deixou de receber foto binária
	- cria a pessoa com `photo = null`
	- retorna sempre `personId`
- `updatePersonAction`
	- deixou de coordenar upload binário
	- passa a receber estado final da foto via `photoChanged`, `photo` e `currentPhoto`
	- mantém a RPC `update_person` só para dados já existentes do fluxo principal
	- persiste `persons.photo` via Supabase SDK após a RPC principal
- `persistPersonPhotoAction`
	- foi adicionada para o pós-`create`
	- persiste a URL pública da foto diretamente em `persons.photo`
	- executa cleanup best-effort quando a persistência falha

Também foi preservado o cleanup de imagens antigas com `cleanupMediaObject` em cenários de troca, remoção e falha pós-upload.

#### 3. Refatoração do fluxo do `PersonForm`

O arquivo `src/forms/PersonForm/person-form.tsx` passou a coordenar o fluxo completo no cliente:

- valida o arquivo selecionado antes de abrir o editor
- mantém estado separado para:
	- foto persistida atual
	- arquivo em edição no editor
	- arquivo final processado
	- preview local
	- erro de foto
	- remoção explícita
- em modo `update`
	- sobe a foto primeiro com `uploadMediaClient`
	- bloqueia o submit completo se o upload falhar
	- só chama `updatePersonAction` depois de obter a URL pública
- em modo `create`
	- chama `createPersonAction` primeiro
	- se houver foto, faz upload depois usando `personId`
	- chama `persistPersonPhotoAction` para gravar a URL pública
	- se a etapa da foto falhar, mantém a pessoa criada sem foto e informa retry
- exibe erro inline no bloco da imagem quando necessário
- faz cleanup de `URL.createObjectURL` no ciclo de vida do componente

#### 4. Tipos e feedback da página de pessoas

O contrato de sucesso do formulário foi ampliado em `src/forms/PersonForm/person-form.types.ts`:

- `PersonFormSuccessResult`
	- `personId`
	- `created`
	- `photoRetryRequired?`

Em `src/app/(app)/(pessoas)/pessoas/page.client.tsx`, o fluxo de sucesso foi ajustado para:

- distinguir claramente `create` de `update`
- manter a contagem local de pessoas atualizada
- tratar o caso “pessoa criada sem foto” sem fechar o fluxo como se tudo tivesse terminado

#### 5. Reuso do editor de avatar

Foi criado um componente genérico em `src/components/ui-patterns/avatar-image-editor-dialog.tsx` com:

- crop `1:1` via `react-avatar-editor`
- guia circular visual
- zoom por `Slider` e botões incrementais
- processamento assíncrono da imagem final
- API genérica para reaproveitamento em outros formulários

Para preservar compatibilidade, `src/forms/PersonForm/person-photo-editor.tsx` passou a reexportar esse editor genérico como alias.

#### 6. Reuso no `ProfileForm`

O `src/forms/ProfileForm/profile-form.tsx` também foi adaptado para reaproveitar o editor genérico:

- seleção de imagem agora passa pela validação genérica
- o editor abre antes da foto ser efetivamente aplicada ao formulário
- o fluxo respeita limite de `5MB` específico do perfil
- o submit bloqueia enquanto existir edição de foto pendente

#### 7. Dialogs stackados e ajuste visual

O componente compartilhado `src/components/ui/dialog.tsx` foi ajustado para suportar dialogs empilhados com portal herdado:

- `DialogPortal` passou a reutilizar automaticamente o container do dialog pai quando existir
- `DialogContent` passou a detectar quando está stackado (`isStacked`)
- quando stackado, aplica ajustes visuais específicos:
	- `DialogOverlay` com `m-[-1px]`
	- overlay suavizado para não evidenciar as bordas internas do dialog pai
	- `DialogContent` com largura equivalente a `calc(100% - 36px)`

Esses ajustes foram necessários porque o dialog filho é montado dentro do `DialogContent` atual, e sem compensação visual o overlay não cobria corretamente as bordas internas.

#### 8. Separação correta entre client e server no módulo de mídia

O barrel `src/lib/media/index.ts` foi ajustado para não reexportar módulos server-only. Isso evitou trazer `src/lib/supabase/server.ts` e `next/headers` para o bundle cliente através de imports transitivos.

Esse ajuste foi necessário porque o `PersonForm` client importava helpers de `@/lib/media`, e o barrel misturava exports client-safe com exports dependentes de ambiente server.

### Correções técnicas ocorridas durante a implementação

- o arquivo `src/forms/PersonForm/person-form.tsx` foi corrompido em uma sequência de patches intermediários e precisou ser recriado integralmente
- o barrel de `src/lib/media/index.ts` causou erro de build por boundary incorreto entre client/server e foi saneado
- o editor de avatar stackado exigiu refinamento visual adicional após testes manuais no inspetor
- o `Dialog` compartilhado recebeu compensações específicas para nested dialogs sem alterar o comportamento básico dos demais dialogs do app

### Arquivos principais afetados

- `package.json`
- `pnpm-lock.yaml`
- `src/lib/media/image-client.ts`
- `src/lib/media/index.ts`
- `src/app/(app)/(pessoas)/pessoas/actions.ts`
- `src/app/(app)/(pessoas)/pessoas/page.client.tsx`
- `src/forms/PersonForm/person-form.tsx`
- `src/forms/PersonForm/person-form.types.ts`
- `src/forms/PersonForm/person-photo-editor.tsx`
- `src/components/ui-patterns/avatar-image-editor-dialog.tsx`
- `src/forms/ProfileForm/profile-form.tsx`
- `src/components/ui/dialog.tsx`

### Desvio em relação ao plano inicial

O plano original registrava que o editor deveria permanecer como modo interno do dialog existente, sem popup aninhado. Isso foi superado por uma decisão posterior: o editor foi convertido em dialog stackado reutilizável, com suporte de portal herdado e ajustes visuais próprios no `Dialog` compartilhado.

Também houve ampliação de escopo em relação ao plano inicial:

- o editor genérico passou a ser reutilizado no `ProfileForm`
- o suporte a dialogs stackados foi incorporado ao componente compartilhado de UI

### Validação executada

Foram executadas validações durante a implementação:

- checagens locais de erros dos arquivos alterados
- `pnpm lint`
- `pnpm build`

Estado final registrado neste momento:

- `pnpm lint`: OK
- `pnpm build`: OK

### Status final do plano

O plano 016 foi implementado com sucesso, incluindo:

- arquitetura de upload em duas etapas para pessoa
- persistência direta de foto via Supabase SDK
- editor genérico de avatar com crop/zoom
- reaproveitamento no perfil
- suporte visual a dialogs stackados
- correções adicionais surgidas durante a implementação
