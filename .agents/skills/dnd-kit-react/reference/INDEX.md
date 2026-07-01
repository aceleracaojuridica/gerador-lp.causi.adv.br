# Índice da documentação (espelho local)

Estes arquivos são cópias dos MDXs originais do site **dnd kit — React** (`@dnd-kit/react`). Contêm frontmatter YAML, componentes MDX do site (`Story`, `CodeGroup`, `ParamField`, etc.) e imports que **não executam** fora do gerador de docs; use-os como texto de referência.

## Ordem sugerida de leitura

1. **`quickstart.mdx`** — instalação, `useDraggable`, `useDroppable`, `DragDropProvider`, exemplo com vários alvos.
2. **`components/drag-drop-provider.mdx`** — eventos, `event.operation`, múltiplos contextos, `sensors` / `plugins` / `modifiers` (estender vs substituir).
3. **`hooks/use-draggable.mdx`** — API completa, handle, modifiers locais, `DragOverlay`.
4. **`hooks/use-droppable.mdx`** — `accept` / `type`, colisão por droppable, `isDropTarget`.
5. **`components/drag-overlay.mdx`** — uma overlay por provider, children como função `(source) => ...`, `dropAnimation`.
6. **`hooks/use-sortable.mdx`** — `id`, `index`, `group`, refs (`ref`, `targetRef`, `sourceRef`, `handleRef`), transição.
7. **`guides/sortable-state-management.mdx`** — ordenação otimista, `isSortable` / `isSortableOperation`, estado manual vs `move`, integração com fetch externo.
8. **`guides/multiple-sortable-lists.mdx`** — kanban / colunas, `useDroppable` na coluna vazia, `CollisionPriority.Low`, `move` em `onDragOver`, cancelamento.
9. **`guides/collision-detection.mdx`** — algoritmos em `@dnd-kit/collision`, prioridade, detector customizado.
10. **`guides/modifiers.mdx`** — `RestrictToElement`, `RestrictToWindow`, eixos, grid, global vs por elemento.
11. **`guides/sensors.mdx`** — `PointerSensor`, `KeyboardSensor`, constraints, por tipo de ponteiro, substituir vs estender defaults.
12. **`guides/feedback.mdx`** — plugin `Feedback`, modos, animação de drop, troubleshooting (duplicados / double animation).
13. **`guides/migration.mdx`** — de `@dnd-kit/core` / `sortable` / `utilities` para `@dnd-kit/react` e `@dnd-kit/helpers`.
14. **`hooks/use-drag-operation.mdx`** — leitura reativa de `source` / `target` durante o drag.
15. **`hooks/use-drag-drop-monitor.mdx`** — assinatura de eventos em componente filho do provider.
16. **`hooks/use-drag-drop-manager.mdx`** — acesso avançado ao `DragDropManager` (pode retornar `null` fora do provider).

## Mapa de ficheiros

| Ficheiro | Tema |
|----------|------|
| `quickstart.mdx` | Introdução e exemplo completo |
| `components/drag-drop-provider.mdx` | Contexto, API do provider |
| `components/drag-overlay.mdx` | Overlay visual |
| `guides/collision-detection.mdx` | Deteção de colisões |
| `guides/feedback.mdx` | Plugin Feedback |
| `guides/migration.mdx` | Migração desde pacotes legados |
| `guides/modifiers.mdx` | Modifiers em React |
| `guides/multiple-sortable-lists.mdx` | Várias listas / kanban |
| `guides/sensors.mdx` | Configuração de sensores |
| `guides/sortable-state-management.mdx` | Estado sortable e `move` |
| `hooks/use-drag-drop-manager.mdx` | Hook do manager |
| `hooks/use-drag-drop-monitor.mdx` | Monitor de eventos |
| `hooks/use-drag-operation.mdx` | Snapshot da operação |
| `hooks/use-draggable.mdx` | Draggable |
| `hooks/use-droppable.mdx` | Droppable |
| `hooks/use-sortable.mdx` | Sortable |
