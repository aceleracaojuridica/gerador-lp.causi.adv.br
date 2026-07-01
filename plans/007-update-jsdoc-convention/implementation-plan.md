# Plano: Atualização do Padrão JSDoc

## Etapa 1 — Nova Convenção JSDoc

### Análise do estado atual

**242 arquivos** no `src/`, ~60% com algum JSDoc. Desses, **5 variantes convivem simultaneamente**: inglês, português acentuado, português sem acento, bold markdown e texto plano. O padrão exato `@motivacao/@problema/@solucao/@consideracoes` aparece em apenas ~3 arquivos.

O problema: as 4 seções forçam paráfrase tripla do óbvio. Em boa parte das ocorrências, os três primeiros campos dizem a mesma coisa de formas diferentes:

```
OrganizationForm/schema.ts
@motivação  → "Validação do formulário de organizações"
@problema   → "Garantir que o nome seja obrigatório..."
@solução    → "Schema Zod com validações para nome, CNPJ..."
```

O que **tem valor real** está quase sempre em `@consideracoes`: SSR constraints, mapeamentos de banco, decisões de arquitetura. Esse conteúdo fica enterrado no final de uma estrutura que ninguém lê completamente.

---

### Formato proposto

```tsx
/**
 * Descrição curta e direta do que o arquivo/componente/função faz.
 *
 * @remarks
 * Contexto não-óbvio quando necessário: restrições de SSR, mapeamentos para o banco,
 * dependências implícitas, comportamentos que não aparecem nos tipos.
 *
 * @param name - Descrição (apenas quando os tipos TypeScript não bastam).
 * @returns O que retorna (para funções utilitárias com retorno não-óbvio).
 */
```

**Regras:**

| Elemento | Quando usar |
|---|---|
| **Descrição** | Sempre. 1-2 linhas. O QUE o arquivo faz, não por que foi criado. |
| **@remarks** | Só quando há algo genuinamente não-óbvio que não está nos tipos. |
| **@param / @returns** | Apenas em funções utilitárias onde os tipos TS não explicam o suficiente. |
| **Omitir o JSDoc inteiro** | Schemas Zod, arquivos de tipos puros, wrappers UI simples, ícones. |

**Idioma**: PT-BR, conforme convenção existente do projeto.

---

### Por que não manter `@motivacao/@problema/@solucao`

1. **Força paráfrase tripla** — 69% dos arquivos usam as 3 tags para dizer a mesma coisa de 3 formas.
2. **Tags customizadas sem suporte** — `@remarks` aparece no hover do VS Code e no TypeDoc. `@motivacao` não.
3. **Incompatível com a carga real** — schemas de 10 linhas não precisam de 4 seções obrigatórias.
4. **Padrão já abandonado** — 80% do código usa variantes não-conformes. O novo padrão precisa ser mais fácil de seguir.

---

### Exemplos reais antes/depois

**provider.tsx** (antes):
```tsx
/**
 * Provider — Wrapper principal com providers server-safe.
 *
 * **Motivação:** Centralizar providers que não causam hydration mismatch...
 * **Problema:** O Provider anterior incluía next-themes...
 * **Solução:** Manter apenas providers server-safe (TooltipProvider, NuqsAdapter)...
 */
```
**provider.tsx** (depois):
```tsx
/**
 * Wrapper de providers server-safe: `TooltipProvider` e `NuqsAdapter`.
 *
 * @remarks
 * `ThemeProvider` foi movido para `ThemeWrapper` por causar hydration mismatch
 * (acessa `localStorage` no servidor).
 */
```

---

**login/page.tsx** (antes):
```tsx
/**
 * @motivacao Expor a rota pública de login mantendo o page component puramente declarativo.
 * @problema Os estados desta rota dependem de query params e devem ser decididos no servidor.
 * @solucao Processa `searchParams` no Server Component e delega apenas o formulário para o client.
 * @consideracoes A autenticação efetiva continua no Supabase Auth e a sessão SSR é mantida pelo proxy.
 */
```
**login/page.tsx** (depois):
```tsx
/**
 * Rota pública de login — processa `searchParams` no servidor e delega o formulário ao client.
 *
 * @remarks
 * A sessão SSR é mantida pelo `proxy.ts`. `nextPath` preserva o destino original após autenticação.
 */
```

---

**OrganizationForm/schema.ts** (antes):
```tsx
/**
 * @motivação Validação do formulário de criação/edição de organizações.
 * @problema Garantir que o nome seja obrigatório...
 * @solução Schema Zod com validações para nome, CNPJ...
 */
```
**OrganizationForm/schema.ts** (depois): *sem JSDoc* — arquivo auto-documentável por tipo e localização.

---

### Arquivo a atualizar

`docs/ai-context/conventions.md` — substituir a seção `## JSDoc (Obrigatório)` pela nova convenção.

**Trecho atual:**
```md
## JSDoc (Obrigatório)

Todo componente deve incluir JSDoc com as seguintes seções:

1. **@motivacao** — por que o componente existe
2. **@problema** — qual problema ele resolve
3. **@solucao** — como ele resolve
4. **@consideracoes** — ciclo de vida, performance, restrições

A documentação de comportamento do componente vive no JSDoc + TypeScript types, **não** em arquivos markdown separados.
```

**Trecho proposto:**
```md
## JSDoc

Todo arquivo não-trivial deve ter JSDoc. O objetivo é permitir que um dev entenda o arquivo sem precisar ler o código.

```tsx
/**
 * Descrição curta e direta do que o arquivo/componente/função faz.
 *
 * @remarks
 * Contexto não-óbvio quando necessário: restrições de SSR, mapeamentos para o banco,
 * dependências implícitas, comportamentos que não aparecem nos tipos.
 *
 * @param name - Descrição (apenas quando os tipos TypeScript não bastam).
 * @returns O que retorna (para funções utilitárias com retorno não-óbvio).
 */
```

**Regras:**

| Elemento | Quando usar |
|---|---|
| Descrição | Sempre. 1-2 linhas. O QUE o arquivo faz. |
| `@remarks` | Só quando há algo genuinamente não-óbvio que não está nos tipos. |
| `@param` / `@returns` | Apenas em funções utilitárias com retorno não-óbvio. |
| Omitir o JSDoc | Schemas Zod, arquivos de tipos puros, wrappers UI simples, ícones. |

A documentação de comportamento vive no JSDoc + TypeScript types, **não** em markdowns separados.
```

---

## Etapa 2 — Migração de 79 arquivos

### Categoria A — Remover JSDoc completamente (15 arquivos)

Arquivos auto-documentáveis por tipo e localização. Nenhum conteúdo a preservar.

| Arquivo | Motivo |
|---|---|
| `src/forms/TaskForm/schema.ts` | Zod schema dentro de `TaskForm/` — óbvio |
| `src/forms/OrganizationForm/schema.ts` | Idem |
| `src/forms/PersonForm/schema.ts` | Idem |
| `src/forms/TagCreateForm/schema.ts` | **Conteúdo incorreto** (descreve "tarefas" em vez de "tags") |
| `src/forms/UserEditForm/schema.ts` | Auto-documentável |
| `src/forms/UserCreateForm/schema.ts` | Idem |
| `src/forms/ProfileForm/schema.ts` | Idem |
| `src/forms/SecureForm/schema.ts` | Idem |
| `src/forms/OfficeForm/schema.ts` | Idem |
| `src/components/atoms/DeleteConfirmDialog/delete-confirm-dialog.types.ts` | Interface TypeScript auto-documentável; nota sobre `Promise` vai para o `.tsx` |
| `src/forms/TaskForm/task-form.types.ts` | Idem |
| `src/forms/OrganizationForm/organization-form.types.ts` | Idem |
| `src/forms/PersonForm/person-form.types.ts` | Idem |
| `src/forms/TagCreateForm/tag-create-form.types.ts` | Idem |
| `src/forms/OfficeForm/office-form.types.ts` | Idem |

---

### Categoria B — Simplificar para descrição curta sem @remarks (32 arquivos)

JSDoc atual parafraseia o código sem adicionar contexto. Migrar para 1-2 linhas descritivas.

| Arquivo | Novo JSDoc |
|---|---|
| `src/forms/OrganizationForm/organization-form.tsx` | `Formulário de criação e edição de organizações.` |
| `src/forms/OpportunitiesCreateForm/opportunities-create-form.tsx` | `Formulário modal para criação de oportunidades (deals) — campos obrigatórios: Pessoa e Etapa.` |
| `src/forms/UserEditForm/user-edit-form.tsx` | `Formulário de edição de usuários com suporte a contas compartilhadas.` |
| `src/forms/UserCreateForm/user-create-form.tsx` | `Formulário de criação de novos usuários.` |
| `src/forms/ProfileForm/profile-form.tsx` | `Formulário de edição de perfil do usuário.` |
| `src/forms/OfficeForm/office-form.tsx` | `Formulário de edição das informações do escritório.` |
| `src/forms/PipelineCreateForm/pipeline-create-form.tsx` | `Formulário de criação de pipeline.` |
| `src/forms/CourseForm/course-form.tsx` | `Formulário de gestão de cursos com suporte a criação e edição.` |
| `src/forms/LessonForm/lesson-form.tsx` | `Formulário de gestão de aulas com editor de conteúdo rico.` |
| `src/forms/ModuleForm/module-form.tsx` | `Formulário de gestão de módulos com suporte a criação e edição.` |
| `src/forms/DealsFilterForm/deals-filter-form.tsx` | `Formulário de filtros do pipeline — atualmente estático, aguardando integração.` |
| `src/forms/CreateAccountForm/create-account-form.tsx` | `Formulário de cadastro com validação de força e confirmação de senha.` |
| `src/app/(auth)/layout.tsx` | `Layout do grupo de rotas públicas de autenticação.` |
| `src/app/(auth)/cadastrar/page.tsx` | `Rota pública de cadastro — processa \`searchParams\` no servidor e delega o formulário ao client.` |
| `src/app/(app)/conversas/page.tsx` | `Página de conversas — orquestra \`ConversationList\`, \`ChatInterface\` e \`ChatInfo\`.` |
| `src/app/(app)/cursos/page.tsx` | `Página de entrada da área educacional — lista os cursos do advogado com Suspense.` |
| `src/app/(app)/cursos/Client.component.tsx` | `Lista de cursos com progresso — implementação estática (mock).` |
| `src/app/(app)/(configuracoes)/seguranca/page.tsx` | `Página de configurações de segurança — renderiza o \`SecureForm\`.` |
| `src/app/(app)/(configuracoes)/perfil/page.tsx` | `Página de edição de perfil — renderiza o \`ProfileForm\`.` |
| `src/app/(app)/(configuracoes)/assinatura/page.tsx` | `Página de gerenciamento de assinatura — plano atual e comparação de planos disponíveis.` |
| `src/app/(admin)/admin-cursos/Client.component.tsx` | `Listagem de cursos para gestão pelo Super Admin com ações CRUD.` |
| `src/app/(admin)/admin-cursos/page.tsx` | `Página de gestão de cursos para Super Admins.` |
| `src/app/(admin)/admin-cursos/[curso_id]/modulos/page.tsx` | `Página de gestão de módulos de um curso específico para Super Admins.` |
| `src/app/(admin)/admin-cursos/[curso_id]/modulos/[modulo_id]/aulas/page.tsx` | `Página de gestão de aulas de um módulo específico para Super Admins.` |
| `src/app/(admin)/admin-contas/[id]/page.tsx` | `Rota dinâmica de detalhes de conta para administradores.` |
| `src/components/auth/auth-page-shell.tsx` | `Shell de layout para páginas públicas de autenticação.` |
| `src/components/channels/delete-channel-modal.tsx` | `Modal de confirmação para exclusão de canal.` |
| `src/components/channels/channel-card.tsx` | `Card de canal WhatsApp com indicadores de status, agente responsável e funil associado.` |
| `src/components/classroom/course-card.tsx` | `Card de curso com suporte a estados de premium, bloqueado e progresso.` |
| `src/components/conversations/chat-interface.tsx` | `Interface principal de chat com suporte a texto, áudio e fotos capturadas.` |
| `src/components/sidebar-bottom.tsx` | `Seção inferior do sidebar com itens fixos e dinâmicos.` |
| `src/components/support-modal.tsx` | `Modal de solicitação de suporte técnico — categoria, assunto, mensagem e anexo de imagem.` |

---

### Categoria C — Migrar para Descrição + @remarks (32 arquivos)

Conteúdo genuinamente não-óbvio a preservar. Para cada arquivo: descrição curta + `@remarks` condensado.

---

**`src/provider.tsx`**
```tsx
/**
 * Wrapper de providers server-safe: `TooltipProvider` e `NuqsAdapter`.
 *
 * @remarks
 * `ThemeProvider` foi movido para `ThemeWrapper` por causar hydration mismatch
 * (acessa `localStorage` no servidor).
 */
```

---

**`src/components/theme-wrapper.tsx`**
```tsx
/**
 * Componente client-only que envolve o app com `ThemeProvider` do next-themes.
 *
 * @remarks
 * O next-themes acessa `localStorage` e injeta `className` no `<html>`, causando
 * hydration mismatch no servidor. `suppressHydrationWarning` no `<html>` cobre
 * os atributos injetados.
 */
```

---

**`src/forms/ForgotPasswordForm/forgot-password.tsx`**
```tsx
/**
 * Formulário de recuperação de senha — envia link de redefinição via Supabase Auth.
 *
 * @remarks
 * Usa `redirectTo` apontando para o callback SSR. O callback valida o token e inicia
 * a sessão de recovery antes de renderizar o `UpdatePasswordForm`.
 */
```

---

**`src/forms/SignInForm/signin-form.tsx`**
```tsx
/**
 * Formulário de login com autenticação via Supabase Auth.
 *
 * @remarks
 * Usa `nextPath` para preservar o destino original quando o `proxy.ts` intercepta
 * rotas protegidas.
 */
```

---

**`src/forms/SignUpForm/signup-form.tsx`**
```tsx
/**
 * Formulário de cadastro com envio de metadados e confirmação por e-mail.
 *
 * @remarks
 * `emailRedirectTo` aponta para o callback SSR. Suporta cenários com e sem confirmação
 * obrigatória (`email_confirm: true/false`). Metadados `name` e `office` são enviados
 * via `options.data` no `signUp`.
 */
```

---

**`src/forms/UpdatePasswordForm/update-password-form.tsx`**
```tsx
/**
 * Formulário de conclusão de redefinição de senha.
 *
 * @remarks
 * Requer uma sessão de recovery válida criada pelo callback SSR. Submeter sem essa
 * sessão falhará silenciosamente no Supabase Auth.
 */
```

---

**`src/app/(auth)/redefinir/page.tsx`**
```tsx
/**
 * Rota de recuperação de senha — processa `searchParams` no servidor para escolher
 * entre solicitar link ou definir nova senha.
 *
 * @remarks
 * A validação do token de recovery ocorre no callback SSR, não aqui. Quando
 * `mode=update`, verifica sessão no servidor antes de renderizar o `UpdatePasswordForm`.
 */
```

---

**`src/app/(auth)/login/page.tsx`**
```tsx
/**
 * Rota pública de login — processa `searchParams` no servidor e delega o formulário ao client.
 *
 * @remarks
 * A sessão SSR é mantida pelo `proxy.ts`. `nextPath` preserva o destino original
 * após autenticação.
 */
```

---

**`src/components/atoms/DeleteConfirmDialog/delete-confirm-dialog.tsx`**
```tsx
/**
 * Modal de confirmação de exclusão com mensagem personalizada e loading state.
 *
 * @remarks
 * `onConfirm` aceita função síncrona ou assíncrona (`Promise`) — o botão de confirmação
 * aguarda a resolução antes de fechar.
 */
```

---

**`src/components/ui/searchable-select.tsx`**
```tsx
/**
 * Combobox de seleção com busca, construído no padrão atômico do shadcn/ui.
 *
 * @remarks
 * Usa Context API para compartilhar estado entre trigger e itens. `cmdk` para busca
 * performática; Radix UI Popover para posicionamento. Permite customização total de
 * triggers e itens sem acoplamento.
 */
```

---

**`src/components/ui/phone-input.tsx`**
```tsx
/**
 * Input de telefone com seletor de DDI internacional, baseado em `react-international-phone`.
 *
 * @remarks
 * Substitui o seletor estático anterior para suporte a formatação automática e
 * cobertura internacional de DDI.
 */
```

---

**`src/components/auth/auth-form-shell.tsx`**
```tsx
/**
 * Wrapper padronizado para formulários de autenticação com título, descrição e link de navegação.
 *
 * @remarks
 * O rodapé (link auxiliar) é opcional — omitido em estados como confirmação de e-mail e
 * redefinição de senha para simplificar o layout.
 */
```

---

**`src/components/auth/auth-advisor.tsx`**
```tsx
/**
 * Componente de feedback para telas de autenticação (e-mail confirmado, link expirado, reenvio).
 *
 * @remarks
 * O botão de reenvio só é exibido quando `onResend` é fornecido. Sem ele, o estado de
 * "aguardando confirmação" apresenta apenas o texto, sem ação.
 */
```

---

**`src/hooks/use-breakpoints.ts`**
```tsx
/**
 * Hook para verificar breakpoints do Tailwind no client-side sem erros de hidratação.
 *
 * @remarks
 * `useMediaQuery` da `uidotdev` falha no App Router (SSR). Este hook escuta `matchMedia`
 * exclusivamente dentro de `useEffect`. Usa os mesmos breakpoints do Tailwind CSS padrão.
 */
```

---

**`src/forms/SecureForm/secure-form.tsx`**
```tsx
/**
 * Formulário de alteração de senha com checklist de validação em tempo real.
 *
 * @remarks
 * O checklist de força da senha aparece apenas quando o campo tem foco ou valor. O botão
 * de submit é desabilitado enquanto o formulário não for modificado (`isDirty === false`).
 */
```

---

**`src/forms/SubscriptionForm/subscription-form.tsx`**
```tsx
/**
 * Formulário de criação e edição de assinaturas.
 *
 * @remarks
 * Mapeamentos para o banco: `type` → `status`; `linked_to_acceleration` → `is_granted`;
 * os campos de limite individuais são agrupados em `total_limits` no servidor.
 */
```

---

**`src/forms/TaskForm/task-form.tsx`**
```tsx
/**
 * Formulário de tarefas para o Kanban (criação e edição).
 *
 * @remarks
 * O Dialog é gerenciado externamente — este componente renderiza apenas o form.
 * `onSubmit` é opcional (sem ele, o submit só loga no console). O botão "Cancelar"
 * usa `DialogClose` para fechar o dialog pai.
 */
```

---

**`src/forms/TagCreateForm/tag-create-form.tsx`**
```tsx
/**
 * Formulário de criação e edição de tags.
 *
 * @remarks
 * Dialog gerenciado externamente. `onSubmit` é opcional. O botão "Cancelar"
 * usa `DialogClose` para fechar o dialog pai.
 */
```

---

**`src/forms/PersonForm/person-form.tsx`**
```tsx
/**
 * Formulário de criação e edição de contatos (Pessoas).
 *
 * @remarks
 * Usa `useFieldArray` para suportar múltiplos telefones, e-mails e redes sociais por contato.
 */
```

---

**`src/app/(app)/cursos/layout.tsx`**
```tsx
/**
 * Layout base das rotas de cursos — aplica `bg-accent` e ocupa toda a área do AppLayout.
 *
 * @remarks
 * Sub-layouts dentro deste grupo (ex: `aulas/[aulaId]/layout.tsx`) podem sobrescrever
 * o `overflow` sem precisar redefinir o background.
 */
```

---

**`src/app/(app)/cursos/[cursoId]/aulas/[aulaId]/page.tsx`**
```tsx
/**
 * Página de visualização de aula com player de vídeo, conteúdo e anexos.
 *
 * @remarks
 * `RichTextEditor` é lazy-loaded (incompatível com SSR). Layout adaptativo: sidebar de
 * módulos no desktop; Sheet no mobile para navegação entre aulas.
 */
```

---

**`src/components/course-sidebar.tsx`**
```tsx
/**
 * Sidebar de navegação de aulas com accordion de módulos, status de conclusão e progresso geral.
 *
 * @remarks
 * Reutilizado tanto no desktop (sidebar fixa) quanto no mobile (dentro de um `Sheet`).
 */
```

---

**`src/components/conversations/conversation-list.tsx`**
```tsx
/**
 * Lista lateral de conversas com filtros, badges de status e cards de contato.
 *
 * @remarks
 * `overflow-y:auto` é intencional para permitir virtualização futura. Largura fixa
 * `w-96` no desktop; `w-full` no mobile.
 */
```

---

**`src/components/chat/chat-message.tsx`**
```tsx
/**
 * Renderiza diferentes tipos de mensagem (texto, imagem, áudio, arquivo) com suporte a sent/received.
 *
 * @remarks
 * Suporta respostas aninhadas e avatares de remetente. O layout muda completamente
 * baseado no tipo — não usar fora do contexto de chat.
 */
```

---

**`src/components/chat/camera-capture.tsx`**
```tsx
/**
 * Captura de foto via câmera do dispositivo diretamente no chat.
 *
 * @remarks
 * Usa `navigator.mediaDevices.getUserMedia` + `canvas` para captura. Requer permissão
 * de câmera concedida pelo usuário.
 */
```

---

**`src/components/chat/audio-message.tsx`**
```tsx
/**
 * Player de áudio com botão play/pause, slider arrastável e timer.
 *
 * @remarks
 * Design em container quadrado (`rounded-lg`) por decisão visual da feature de chat.
 * Aceita `audioUrl` real ou usa fallback simulado (mock) quando não fornecido.
 */
```

---

**`src/components/atoms/avatar-dropdown.tsx`**
```tsx
/**
 * Dropdown de avatar com e-mail do usuário, seletor de tema, acesso a cursos, configurações e logout.
 *
 * @remarks
 * O seletor de tema está aqui por decisão de UX — evita que o usuário navegue até as
 * configurações para trocar o tema.
 */
```

---

**`src/components/app-layout.tsx`**
```tsx
/**
 * Layout raiz do app autenticado — integra sidebar, topbar e container principal.
 *
 * @remarks
 * Renderizado pelo `layout.tsx` do grupo `(app)`. Isola silenciosamente o sidebar
 * para a rota `/auth`.
 */
```

---

**`src/components/admin-bar.tsx`**
```tsx
/**
 * Barra de administração com seletor de contas, link de configurações e logotipo.
 *
 * @remarks
 * Usa um Combobox genérico (Popover + Command) para busca de contas — reutilizável
 * para diferentes contextos de seleção.
 */
```

---

**`src/components/accounts/account-subscription-view.tsx`**
```tsx
/**
 * Visualização detalhada de assinatura de uma conta.
 *
 * @remarks
 * Usa CSS Container Queries (`@container`) para responsividade — a largura do componente
 * varia com o estado do sidebar, tornando a viewport uma referência não confiável.
 */
```

---

**`src/components/sidebar-bottom.tsx` → reclassificado para Categoria B**
`Seção inferior do sidebar com itens fixos e dinâmicos.`

---

### Resumo

| Categoria | Arquivos | Ação |
|---|---|---|
| A — Remover | 15 | Apagar o bloco JSDoc inteiro |
| B — Simplificar | 32 | Substituir por 1-2 linhas descritivas |
| C — Migrar | 32 | Reescrever com descrição + `@remarks` condensado |
| **Total** | **79** | |

### Verificação pós-migração

Buscar no `src/` por:
```
@motivacao|@motivação|@motivation|@problema|@problem|@solucao|@solução|@solution|@consideracoes|@considerações|@considerations|Motivação:|Motivacao:|Problema:|Solução:|Solucao:
```
Deve retornar zero resultados.
