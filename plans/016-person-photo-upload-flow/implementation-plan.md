## Plan: Person Photo Two-Phase Flow

Refatorar o fluxo da foto da pessoa em dois caminhos distintos. Em edição, o upload ao Supabase Storage pode acontecer antes do `update`, porque o `personId` já existe e o path final pode ser montado com `buildPersonMediaPath`. Em criação, isso não é possível: a pessoa precisa ser criada primeiro sem foto para gerar o `personId`; só depois a imagem processada é enviada ao Storage no path final e a URL pública é persistida via Supabase SDK. Para o usuário, continua sendo um único clique em salvar; internamente, o create passa a ser uma sequência em duas etapas. O editor continua como um modo interno do próprio Dialog da pessoa, sem popup aninhado. A persistência da foto permanece no campo `photo`, sempre salvando URL pública, sem usar a RPC `update_person_photo`. Quando a foto precisar ser gravada ou alterada, isso deve acontecer via Supabase SDK (`insert`/`update`) dentro das actions do fluxo.

**Steps**
1. Fase 1 — Consolidar o pipeline client-side de avatar antes do submit.
2. Definir constantes e utilitários reutilizáveis para tipos aceitos (`image/jpeg`, `image/png`, `image/webp`), limite máximo de entrada, resolução final máxima de `512x512` e política de preservação de MIME.
3. Criar um utilitário client-side em `src/lib/media/` para: receber o arquivo original, exportar o crop do `react-avatar-editor` em canvas, converter o canvas para `File` mantendo o tipo original, e aplicar `browser-image-compression` com `maxWidthOrHeight: 512`, `useWebWorker: true` e `fileType` igual ao MIME original. *Pode ser implementado em paralelo com a fase 2.*
4. Garantir que o resultado final preserve o formato original: JPG continua JPG, PNG continua PNG, WEBP continua WEBP. A imagem final sempre sai quadrada 1:1, mas com no máximo `512x512`.
5. Fase 2 — Adicionar o editor de imagem no fluxo visual atual do formulário da pessoa.
6. Implementar um componente de editor de avatar em `src/components/ui-patterns/` ou local a `src/forms/PersonForm/`, encapsulando `react-avatar-editor` com apenas enquadramento por drag e zoom por slider. Sem rotação, sem filtros, sem outras transformações.
7. Configurar o editor com overlay circular visual usando `borderRadius = width / 2`, máscara escurecida e área real de exportação quadrada. O círculo serve apenas de guia para a UI final, que sempre exibe avatar redondo.
8. Integrar o editor diretamente em `src/forms/PersonForm/person-form.tsx` como um modo interno do Dialog existente, preservando o visual atual do `PersonForm` como fonte de verdade para botões, preview, remoção, espaçamento, hierarquia visual e área de upload. O `ProfileForm` não deve ser usado como referência de layout ou styling nesta implementação porque está visualmente desatualizado.
9. Ajustar o estado local do `PersonForm` para distinguir claramente: foto persistida atual, arquivo bruto recém-selecionado, arquivo final processado, preview temporário, upload em andamento, erro de upload e remoção explícita da foto.
10. Fase 3 — Separar explicitamente o fluxo de edição do fluxo de criação.
11. No modo edição, ao clicar em salvar, processar a imagem primeiro. Se houver nova foto, montar o path com `buildPersonMediaPath`, fazer upload via `uploadMediaClient`, obter a URL pública e só então montar o `FormData` definitivo para `updatePersonAction`.
12. Se o upload falhar no modo edição, impedir a chamada de `updatePersonAction`, manter o Dialog aberto e exibir erro inline no bloco da foto e/ou toast complementar. Esse comportamento deve bloquear o update inteiro, inclusive quando o usuário abriu o formulário apenas para trocar a foto.
13. No modo criação, o `PersonForm` deve primeiro chamar `createPersonAction` sem binário e sem tentar montar path de foto. A action cria a pessoa com `photo = null` e retorna o `personId`.
14. Depois que o `personId` retornar no modo criação, se houver foto processada, o cliente monta o path com `buildPersonMediaPath`, faz o upload via `uploadMediaClient` e dispara a etapa de persistência da URL pública em `persons.photo` via Supabase SDK.
15. Se o upload ou a persistência da foto falhar no modo criação, a pessoa já terá sido criada. Nesse caso, o fluxo deve manter o Dialog aberto, informar claramente que a pessoa foi criada sem foto e permitir retry da etapa da foto no mesmo fluxo ou após reabrir em edição.
16. Se não houver nova foto e houver remoção explícita, a mutation principal deve seguir normalmente com `photo = null` ou instrução equivalente, conforme o modo.
17. Fase 4 — Reorganizar as actions para refletir o fluxo em duas etapas e persistir foto via SDK.
18. Refatorar `createPersonAction` em `src/app/(app)/(pessoas)/pessoas/actions.ts` para deixar de receber `photoFile`. Ela passa a criar a pessoa sem depender do upload e retorna sempre o `personId`; quando não houver foto, o fluxo termina nessa action.
19. Refatorar `updatePersonAction` no mesmo arquivo para deixar de receber `photoFile` e `photoRemove` como instruções de upload. Ela passa a receber a foto final já decidida pelo cliente: URL pública nova, URL atual mantida, ou `null` quando removida.
20. Criar uma etapa server-side pequena, baseada em Supabase SDK e sem RPC, para persistir somente `persons.photo` nos casos em que a foto precisa ser aplicada depois do `create`. Essa etapa deve usar filtros por `id` e `account_id` e pode viver no mesmo módulo de actions para manter o fluxo coeso.
21. Não usar a RPC `update_person_photo` em nenhuma etapa. Se a foto precisar ser criada, alterada ou removida, fazer isso diretamente com Supabase SDK sobre a tabela `persons`.
22. Manter as RPCs atuais de `create_person` e `update_person` apenas para o que já controlam hoje, se ainda forem úteis ao fluxo de telefones, e-mails e sociais. A foto deve sair desse acoplamento e ser persistida separadamente com Supabase SDK. *Depende da avaliação final da action, mas o plano já fixa que foto não é responsabilidade de RPC.*
23. Fase 5 — Tratar cleanup e consistência transacional do melhor modo possível sem RPC de foto.
24. No modo criação, se o upload da foto ou a persistência final da URL falhar depois que a pessoa já foi criada, tentar cleanup imediato do arquivo recém-enviado quando aplicável e manter a pessoa criada sem foto.
25. No modo edição, se o upload no cliente tiver sucesso, mas `updatePersonAction` falhar, tentar cleanup imediato da nova imagem enviada e preservar a foto anterior da pessoa sem alteração.
26. Se a edição/remoção da foto for persistida com sucesso, fazer cleanup best-effort da imagem anterior no servidor, reaproveitando `cleanupMediaObject` com a URL atual recebida pelo formulário.
23. Fase 6 — Refinar feedback de formulário e integração da tela.
24. Atualizar `PersonForm` e a página de pessoas para refletir o novo encadeamento de estados: processando imagem, enviando imagem, salvando pessoa, erro de upload, erro de create/update e sucesso final.
25. Exibir alerta dentro do próprio formulário quando o upload falhar, sem depender apenas de toast, porque esse erro agora bloqueia a operação principal.
26. Garantir cleanup local correto de `URL.createObjectURL`, reset dos estados do editor ao fechar o Dialog e consistência entre modo criar/editar.
27. Revisar o texto de ajuda da área de imagem para refletir formatos JPG/PNG/WEBP, crop 1:1 com guia circular, otimização client-side e resolução final máxima de `512x512`.
28. Fase 7 — Reuso futuro com escopo explícito.
29. Estruturar o utilitário e o editor para reaproveitamento posterior no avatar de perfil, mas sem migrar o `ProfileForm` nesta entrega. O escopo funcional desta mudança é o fluxo de foto da pessoa, usando o visual atual do `PersonForm` como referência de UX.

**Relevant files**
- `c:\Users\devbo\OneDrive\Documentos\Sites\causi-app\src\forms\PersonForm\person-form.tsx` — centro da UX atual; vai concentrar editor, preview, erro inline, upload prévio ao submit e montagem final do `FormData`.
- `c:\Users\devbo\OneDrive\Documentos\Sites\causi-app\src\forms\PersonForm\person-form.types.ts` — ajustar contratos e estados do formulário para o novo encadeamento upload-antes-de-submit.
- `c:\Users\devbo\OneDrive\Documentos\Sites\causi-app\src\app\(app)\(pessoas)\pessoas\actions.ts` — remover binário do contrato de create/update e fazer a persistência do campo `photo` com Supabase SDK, sem RPC dedicada.
- `c:\Users\devbo\OneDrive\Documentos\Sites\causi-app\src\app\(app)\(pessoas)\pessoas\page.client.tsx` — ajustar feedback do Dialog e estados globais de pending/loading com a nova etapa prévia de upload.
- `c:\Users\devbo\OneDrive\Documentos\Sites\causi-app\src\lib\media\client.ts` — base do upload direto no cliente; expandir/reaproveitar para o fluxo pré-submit.
- `c:\Users\devbo\OneDrive\Documentos\Sites\causi-app\src\lib\media\paths.ts` — reutilizar `buildPersonMediaPath` como fonte única para os paths do Storage.
- `c:\Users\devbo\OneDrive\Documentos\Sites\causi-app\src\lib\media\urls.ts` — manter coerência com a URL pública gerada/consumida no fluxo.
- `c:\Users\devbo\OneDrive\Documentos\Sites\causi-app\src\lib\media\server.ts` — reutilizar `cleanupMediaObject` para remoção best-effort de imagem anterior ou de uploads órfãos após falha da mutation principal.
- `c:\Users\devbo\OneDrive\Documentos\Sites\causi-app\src\components\ui\dialog.tsx` — referência do container atual onde o editor deve viver sem popup aninhado.
- `c:\Users\devbo\OneDrive\Documentos\Sites\causi-app\src\components\ui\sheet.tsx` — fallback futuro se o editor precisar sair do corpo do Dialog; não é a abordagem primária.

**Verification**
1. Validar criação de pessoa com foto JPG, PNG e WEBP, confirmando que a pessoa é criada primeiro, depois a imagem sobe ao Storage usando o `personId`, e por fim a URL pública é persistida em `persons.photo`.
2. Validar criação de pessoa com falha na etapa da foto, confirmando que a pessoa permanece criada sem foto, que o erro fica claro para o usuário e que existe caminho de retry.
3. Validar edição de pessoa com troca de foto, garantindo que o upload falho bloqueia o update inteiro e mostra erro dentro do formulário.
4. Validar o caso “abrir formulário só para trocar foto”: se o upload falhar no modo edição, nenhuma alteração da pessoa deve ser persistida.
5. Validar remoção de foto em modo edição, confirmando que a persistência de `photo = null` acontece via Supabase SDK direto na tabela `persons` e o cleanup da imagem anterior continua best-effort.
6. Validar que o arquivo final mantém o MIME original e não excede `512x512`.
7. Validar edição de enquadramento: selecionar imagem, abrir editor, arrastar, aplicar zoom, cancelar, reaplicar e salvar.
8. Simular falha na persistência final da foto após upload concluído e confirmar tentativa de cleanup do novo arquivo enviado.
9. Executar `pnpm typecheck` e `pnpm build` após a implementação.

**Decisions**
- O fluxo de foto deixa de ser único: `update` pode enviar a foto antes da mutation principal; `create` precisa criar a pessoa primeiro para obter `personId`.
- No modo edição, se o upload falhar, o update inteiro é bloqueado.
- No modo criação, se a etapa da foto falhar depois do `create`, a pessoa permanece criada sem foto e o sistema deve expor retry claro.
- O editor permanece dentro do Dialog atual como um modo interno, não em popup aninhado.
- O crop é sempre 1:1 com overlay circular apenas visual.
- A imagem final é sempre otimizada no cliente antes do upload.
- O formato original deve ser preservado entre JPG/PNG/WEBP.
- O upload usa os paths já definidos em `src/lib/media/paths.ts`.
- A persistência continua salvando URL pública em `persons.photo`.
- A foto nunca deve ser persistida via RPC dedicada. Se precisar criar, alterar ou remover foto, usar Supabase SDK direto nas actions/etapas do fluxo.
- Nenhuma mudança de RLS ou policy de Storage entra neste escopo.
- O visual atual de `src/forms/PersonForm/person-form.tsx` é a única referência de styling e UX para a área de imagem; `ProfileForm` não é referência visual nesta entrega.

**Further Considerations**
1. Se o editor interno deixar o Dialog apertado em desktop, a primeira alternativa é aumentar a largura do `DialogContent`; a segunda é mover o editor para um `Sheet`, não para um Dialog aninhado.
2. Como o cliente passa a subir a imagem antes da mutation principal, a implementação deve prever cleanup de upload órfão quando create/update falhar depois do upload concluído.
3. Como o servidor não receberá mais o binário nesse fluxo, a validação forte de tipo/tamanho passa a acontecer majoritariamente no cliente; as actions devem compensar validando permissão, ownership e consistência do campo `photo`/`currentPhoto` recebido.