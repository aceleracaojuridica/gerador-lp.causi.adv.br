---
name: dnd-kit-react
description: Implements React drag-and-drop with @dnd-kit/react (DragDropProvider, useDraggable, useDroppable, useSortable, collision detectors, sensors, modifiers, Feedback plugin, DragOverlay, move from @dnd-kit/helpers, migration from @dnd-kit/core). Use when the user mentions dnd-kit, @dnd-kit/react, sortable lists, kanban DnD, DragDropProvider, or official patterns for this library.
---

# dnd kit (React)

## Fonte e leitura

- As regras abaixo resumem **apenas** o conteúdo espelhado em `reference/` (MDXs copiados do kit).
- Para detalhe, API campo-a-campo e exemplos longos, seguir o **[reference/INDEX.md](reference/INDEX.md)**.

## Pacotes (pelos docs)

- **`@dnd-kit/react`** — único obrigatório; camada React sobre a biblioteca vanilla.
- **`@dnd-kit/helpers`** — utilitário **`move`** para listas simples ou registos de arrays (ex.: colunas).
- **`@dnd-kit/dom`**, **`@dnd-kit/abstract`** — dependências transitivas; sensores, plugins (ex. `Feedback`), modifiers DOM.
- **`@dnd-kit/collision`** — transitivo; detectores de colisão importáveis explicitamente.
- Sortable: hook em **`@dnd-kit/react/sortable`** (`useSortable`, `isSortable`, `isSortableOperation`).

## Modelo mental

1. Envolver a árvore com **`DragDropProvider`** (vários providers = contextos independentes).
2. Fontes: **`useDraggable`**; alvos: **`useDroppable`**; reorder / lista: **`useSortable`** (`id` + **`index`** obrigatórios; opcional **`group`** para multi-lista).
3. Refs retornadas são **callbacks ref** (`ref` em draggable/droppable) conforme docs; sortable também expõe `targetRef`, `sourceRef`, `handleRef`.
4. Eventos principais no provider: `onBeforeDragStart`, `onDragStart`, `onDragMove`, `onDragOver`, `onDragEnd`, `onCollision`. Handlers recebem **`(event, manager)`**; em muitos exemplos usa-se só `event`.
5. Em **`onDragEnd`**: verificar **`event.canceled`** (substitui fluxo separado de cancel do legado). Operação: **`event.operation`** com `source`, `target`, `position`, `status`.

## Sortable e estado

- **`SortableContext` deixou de existir** no modelo novo: itens registam-se automaticamente com `useSortable`.
- **Ordenação otimista** (`OptimisticSortingPlugin`) vem por defeito: durante o drag, **`source` e `target` podem coincidir**; para saber o movimento usar no `source` (com **`isSortable`**) **`initialIndex` / `index` / `initialGroup` / `group`**.
- **`event.preventDefault()` em `onDragOver`** bloqueia a atualização otimista para esse evento (útil para bloquear entradas em certos grupos).
- Duas estratégias: **`move(items, event)`** em `onDragOver` ou `onDragEnd`, ou atualização manual tipicamente só em **`onDragEnd`** com `isSortable` e cópia de arrays.
- **Fetch externo (React Query, etc.)**: não sincronizar lista com o servidor durante drag ativo; guardar flag/ref `isDragging`; ver exemplo em `reference/guides/sortable-state-management.mdx`. Duplicados pós-refetch ligam-se a DOM otimista vs dados novos.

## Multi-coluna / kanban (resumo dos docs)

- Itens: `useSortable` com **`type`**, **`accept`**, **`group`** (ex.: id da coluna).
- Coluna vazia como alvo: **`useDroppable`** na coluna com `accept` compatível; **`collisionPriority`** baixa (ex.: `CollisionPriority.Low` de `@dnd-kit/abstract`) para os **cartões** ganharem à coluna quando sobrepostos.
- Mutar estado entre colunas: **`move`** de `@dnd-kit/helpers` em **`onDragOver`**; para cancelamento, snapshot em **`onDragStart`** e revert em **`onDragEnd`** se `event.canceled`.
- Colunas sortable: `useSortable` no componente coluna com `type: 'column'`, índice da coluna; ordem de colunas pode atualizar-se em **`onDragEnd`** enquanto itens usam `onDragOver`.

## Colisões

- Por defeito: **`defaultCollisionDetection`** (pointer + fallback shape); só override quando necessário.
- Configura-se por **`collisionDetector` em cada droppable/sortable**, importando de `@dnd-kit/collision` (`pointerIntersection`, `shapeIntersection`, `closestCenter`, `closestCorners`, `pointerDistance`, `directionBiased`, etc.).
- **`collisionPriority`**: número maior = preferido quando há sobreposição; enum nomeado em `@dnd-kit/abstract`.
- Detector custom: função que devolve `null` ou objeto com **`value`** (score, maior ganha) e metadados; ver `reference/guides/collision-detection.mdx`.

## Modifiers

- Transformam coordenadas durante o arrasto.
- **Globais**: prop `modifiers` no `DragDropProvider`; **por elemento**: opção `modifiers` no hook; os do elemento prevalecem sobre os globais.
- Exemplos nos docs: `RestrictToElement`, `RestrictToWindow` (`@dnd-kit/dom/modifiers`); `RestrictToHorizontalAxis` / `Vertical`, `SnapModifier` (`@dnd-kit/abstract/modifiers`). Cadeia: ordem do array importa.

## Sensores

- Por defeito: **`PointerSensor`** + **`KeyboardSensor`** no provider.
- Configuração: prop **`sensors`** — **array substitui** defaults; **função `(defaults) => [...]` estende** (padrão recomendado para não perder acessibilidade / auto-scroll).
- Importar de **`@dnd-kit/dom`**: `PointerSensor`, `KeyboardSensor`, `PointerActivationConstraints` (Distance, Delay, etc.). Vários constraints: activa quando **qualquer** um se satisfaz.
- **Touch vs rato**: função `activationConstraints(event, source)` ramificando `event.pointerType`.
- **Handle**: preferir `handleRef` / opção `handle` no hook; `activatorElements` no sensor para casos em que o activador está fora da subárvore do draggable.

## Feedback visual e overlay

- Plugin **`Feedback`** (`@dnd-kit/dom`): modos `default`, `clone`, `move`, `none` (útil com **`DragOverlay`** personalizado). Config global via `plugins={(d) => [...d, Feedback.configure(...)]}` — **não** passar um array que substitua os defaults sem intenção (remove plugins como auto-scroll e acessibilidade).
- **`DragOverlay`**: **no máximo uma** por `DragDropProvider`; children ou função **`source => ...`**; props `dropAnimation` (`null` desliga), `tag`, `className`, `style`, `disabled`.
- **Double animation / snap**: possível conflito entre animação de drop e estado React — desligar `dropAnimation` ou alinhar estado final com `move`.

## Hooks de leitura / avançado

- **`useDragOperation`**: `{ source, target }` reactivos; não re-renderiza a cada movimento de ponteiro (diferente de monitor).
- **`useDragDropMonitor`**: subscrição aos mesmos eventos do ciclo; tabela de eventos e `preventDefault` nos que forem “preventable”.
- **`useDragDropManager`**: instância **`DragDropManager | null`**; usar apenas avançado; sempre null-check.

## Migração desde `@dnd-kit/core`

- `DndContext` → **`DragDropProvider`**; `active` / `over` → **`operation.source` / `operation.target`**; `onDragCancel` → **`canceled` dentro de `onDragEnd`**.
- `useDraggable` antigo com `attributes` / `listeners` / `transform` → novo hook com **`ref`** (sem essa API).
- Colisão global → **`collisionDetector` por droppable/sortable**; `pointerWithin` → `pointerIntersection`; `arrayMove` → **`move`** em `@dnd-kit/helpers`.
- Ver tabelas completas em **`reference/guides/migration.mdx`**.

## Anti-patterns (dos docs)

- Substituir **`plugins`**, **`sensors`** ou **`modifiers`** por array sem replicar o que os defaults faziam (pode desactivar scroll automático, a11y, etc.) — preferir forma função `(defaults) => ...`.
- Várias **`DragOverlay`** no mesmo provider.
- Comparar só `source.id` vs `target.id` em sortable com otimização activa para inferir movimento.
- Sincronizar dados remotos no meio de um drag sem guardar estado local / flag.
