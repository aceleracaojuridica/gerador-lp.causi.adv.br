# Changelog

## 2026-04-24

### Objetivo

Corrigir de forma centralizada o problema de componentes com popup renderizados dentro de `Dialog`, especialmente `Combobox`, `Popover` e `Select`, que dentro de um modal apresentavam os seguintes sintomas:

- não era possível clicar nos itens;
- não era possível fazer scroll na lista;
- não era possível focar o input de busca.

### Diagnóstico

A causa identificada foi o comportamento padrão de portal dos overlays. O `Dialog` do Radix mantém foco e interação presos dentro do subtree modal, mas os conteúdos de `Combobox`, `Popover` e `Select` eram portalados para `document.body`. Com isso, o popup abria visualmente, porém fora do subtree do dialog, gerando conflito com o `FocusScope` do modal.

### Solução adotada

Foi implementada uma solução estrutural baseada em contexto React, para eliminar a necessidade de passar props como `modal` manualmente para cada componente dentro de `Dialog`.

### O que foi implementado

#### 1. Dialog passou a expor automaticamente seu container interno

Arquivo alterado: `src/components/ui/dialog.tsx`

- Criação de `DialogPortalContainerContext`.
- Criação do hook `useDialogPortalContainer()`.
- Refatoração de `DialogContent` para `React.forwardRef`.
- Captura do elemento real de `DialogPrimitive.Content` via `ref`.
- Publicação desse elemento em contexto para descendentes React.

Resultado: qualquer wrapper de overlay dentro do `DialogContent` pode descobrir automaticamente o container correto para portalizar seu conteúdo sem precisar de prop explícita.

#### 2. Combobox passou a usar automaticamente o container do Dialog

Arquivo alterado: `src/components/ui/combobox.tsx`

- Importação de `useDialogPortalContainer`.
- `ComboboxContent` passou a usar a seguinte prioridade para o portal:
	- `container` recebido via prop, quando explicitamente fornecido;
	- container vindo do contexto do dialog;
	- fallback implícito para o comportamento padrão fora de dialog.

Resultado: `Combobox` funciona dentro de `Dialog` com clique, scroll e foco corretos, sem opt-in manual.

#### 3. Popover passou a usar automaticamente o container do Dialog

Arquivo alterado: `src/components/ui/popover.tsx`

- Importação de `useDialogPortalContainer`.
- `PopoverContent` passou a aceitar `container?: HTMLElement | null`.
- `PopoverPrimitive.Portal` passou a usar o container explícito ou o container vindo do contexto do dialog.

Resultado: qualquer componente baseado no wrapper de `Popover` herda a correção automaticamente dentro de `Dialog`.

#### 4. Select passou a usar automaticamente o container do Dialog

Arquivo alterado: `src/components/ui/select.tsx`

- Importação de `useDialogPortalContainer`.
- `SelectContent` passou a aceitar `container?: HTMLElement | null`.
- `SelectPrimitive.Portal` passou a usar o container explícito ou o container vindo do contexto do dialog.

Resultado: `Select` também deixa de quebrar dentro de `Dialog` sem necessidade de workaround por uso.

#### 5. Remoção do workaround local de EntityCombobox

Arquivo alterado: `src/components/ui/entity-combobox.tsx`

- Removidos `useEffect`, `useRef` e `useState` usados apenas para localizar o `DialogContent` via `closest()`.
- Removida a lógica de `portalContainer` local.
- Removido o repasse manual de `container` para `ComboboxContent`.
- A prop `modal` foi mantida apenas por compatibilidade, agora sem ser necessária para o funcionamento normal.

Resultado: o componente deixou de ter lógica específica de dialog e passou a depender da infraestrutura central.

#### 6. Limpeza de call sites que dependiam do workaround

Arquivos alterados:

- `src/forms/PersonForm/person-form.tsx`
- `src/forms/DealsCreateForm/deals-create-form.tsx`

Mudanças realizadas:

- remoção da prop `modal` dos usos de `EntityCombobox` já mapeados;
- esses fluxos agora dependem da detecção automática do container modal.

Resultado: redução de boilerplate e menor custo de manutenção em formulários renderizados em dialog.

### Componentes beneficiados pela mudança

Mesmo sem alterações específicas adicionais, a nova infraestrutura cobre automaticamente os seguintes casos quando eles são renderizados dentro de `Dialog`:

- `EntityCombobox`;
- componentes baseados em `ComboboxContent`;
- componentes baseados em `PopoverContent`;
- componentes baseados em `SelectContent`;
- `SearchableSelect`, por depender do wrapper de `Popover`;
- `PhoneInput` / seletor de país, por depender do wrapper de `Combobox`.

### Arquivos diretamente impactados nesta implementação

- `src/components/ui/dialog.tsx`
- `src/components/ui/combobox.tsx`
- `src/components/ui/popover.tsx`
- `src/components/ui/select.tsx`
- `src/components/ui/entity-combobox.tsx`
- `src/forms/PersonForm/person-form.tsx`
- `src/forms/DealsCreateForm/deals-create-form.tsx`

### Decisões técnicas

- Escopo mantido apenas para `Dialog` nesta etapa.
- A solução foi centralizada na base, não em props por componente.
- Props de compatibilidade antigas não foram removidas imediatamente para evitar quebra de API desnecessária.
- O comportamento fora de `Dialog` foi preservado: overlays continuam portalando normalmente quando não existe container modal no contexto.

### Validação realizada

#### Verificação focada por arquivo

Foi executada verificação de erros nos arquivos alterados após a implementação.

Resultado:

- `src/components/ui/dialog.tsx`: sem erros;
- `src/components/ui/combobox.tsx`: sem erros;
- `src/components/ui/popover.tsx`: sem erros;
- `src/components/ui/select.tsx`: sem erros;
- `src/components/ui/entity-combobox.tsx`: sem erros;
- `src/forms/DealsCreateForm/deals-create-form.tsx`: sem erros.

#### Lint do projeto

Comando executado:

`pnpm lint`

Resultado:

- o lint falhou por problemas já existentes no workspace;
- a saída não apontou regressões nos arquivos alterados por esta implementação.

### Problemas pré-existentes identificados durante a validação

Arquivo afetado: `src/forms/PersonForm/person-form.tsx`

Foram encontrados erros anteriores à implementação, incluindo:

- imports inválidos como `FieldDescrFieldLegend`;
- import inválido `iption`;
- imports não utilizados.

Esses problemas não foram introduzidos pela correção de dialog/overlay e, por isso, não foram tratados neste escopo.

### Resultado esperado após esta implementação

Ao abrir `Combobox`, `Popover` ou `Select` dentro de `Dialog`, o comportamento esperado passa a ser:

- itens clicáveis;
- lista com scroll funcional;
- input de busca focável;
- ausência de necessidade de prop `modal` por uso na maior parte dos casos.

### Pendências recomendadas

- testar manualmente os cenários reais em interface com `EntityCombobox`, `SearchableSelect`, `PhoneInput` e `Select` dentro de dialogs;
- revisar posteriormente se a prop `modal` de `EntityCombobox` ainda deve permanecer por compatibilidade;
- avaliar uma segunda passada para componentes correlatos, como `MultiSelect`, caso seja necessário padronizar toda a família de overlays.
