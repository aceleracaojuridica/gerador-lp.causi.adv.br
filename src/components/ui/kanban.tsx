"use client";

import type { Modifiers } from "@dnd-kit/abstract";
import { CollisionPriority } from "@dnd-kit/abstract";
import { RestrictToHorizontalAxis } from "@dnd-kit/abstract/modifiers";
import { closestCenter } from "@dnd-kit/collision";
import { PointerActivationConstraints, PointerSensor } from "@dnd-kit/dom";
import { move } from "@dnd-kit/helpers";
import {
  DragDropProvider,
  DragOverlay,
  useDragOperation,
} from "@dnd-kit/react";
import { isSortable, useSortable } from "@dnd-kit/react/sortable";
import { Slot } from "radix-ui";
import type * as React from "react";
import {
  createContext,
  type HTMLAttributes,
  type PointerEvent,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import { cn } from "@/lib/utils";

type UniqueIdentifier = string | number;

/**
 * O `move()` de `@dnd-kit/helpers` faz `item.id === source.id`. O sortable usa
 * `String(deal.id)` enquanto o modelo pode ter `id` como bigint — o match falha,
 * o helper chama `preventDefault()` e o estado não atualiza (preview e drop).
 */
function projectColumnsForMove<T>(
  columns: Record<string, T[]>,
  getItemValue: (item: T) => string,
): Record<string, { id: UniqueIdentifier }[]> {
  return Object.fromEntries(
    Object.entries(columns).map(([key, items]) => [
      key,
      items.map((item) => ({ id: getItemValue(item) })),
    ]),
  );
}

function restoreColumnsAfterMove<T>(
  moved: Record<string, { id: UniqueIdentifier }[]>,
  lookupSource: Record<string, T[]>,
  getItemValue: (item: T) => string,
): Record<string, T[]> {
  const lookup = new Map<string, T>();
  for (const list of Object.values(lookupSource)) {
    for (const item of list) {
      lookup.set(getItemValue(item), item);
    }
  }
  const next: Record<string, T[]> = {};
  for (const key of Object.keys(moved)) {
    next[key] = [];
    for (const row of moved[key]) {
      const found = lookup.get(String(row.id));
      if (found !== undefined) {
        next[key].push(found);
      }
    }
  }
  return next;
}

interface KanbanContextValue<T> {
  columns: Record<string, T[]>;
  setColumns: (columns: Record<string, T[]>) => void;
  getItemId: (item: T) => string;
  /** Ordem visual das colunas (ids de coluna como string). */
  columnOrder: string[];
  findContainer: (id: UniqueIdentifier) => string | undefined;
  isColumn: (id: UniqueIdentifier) => boolean;
}

// biome-ignore lint/suspicious/noExplicitAny: context genérico para itens arbitrários
const KanbanContext = createContext<KanbanContextValue<any> | null>(null);

export function useKanbanContext<T>(): KanbanContextValue<T> {
  const ctx = useContext(KanbanContext);
  if (!ctx) {
    throw new Error("useKanbanContext deve ser usado dentro de <Kanban>.");
  }
  return ctx as KanbanContextValue<T>;
}

const ColumnContext = createContext<{
  handleRef: (element: Element | null) => void;
  isDragging: boolean;
  disabled?: boolean;
  locked?: boolean;
}>({
  handleRef: () => {},
  isDragging: false,
  disabled: false,
  locked: false,
});

const ItemContext = createContext<{
  handleRef: (element: Element | null) => void;
  isDragging: boolean;
  disabled?: boolean;
}>({
  handleRef: () => {},
  isDragging: false,
  disabled: false,
});

const IsOverlayContext = createContext(false);

export type KanbanDragEndEvent = Parameters<
  NonNullable<React.ComponentProps<typeof DragDropProvider>["onDragEnd"]>
>[0];

export interface KanbanMoveEvent {
  event: KanbanDragEndEvent;
  activeContainer: string;
  activeIndex: number;
  overContainer: string;
  overIndex: number;
}

export interface KanbanRootProps<T> extends HTMLAttributes<HTMLDivElement> {
  value: Record<string, T[]>;
  onValueChange: (value: Record<string, T[]>) => void;
  getItemValue: (item: T) => string;
  /** Ordem inicial das colunas; padrão: `Object.keys(value)`. */
  initialColumnOrder?: string[];
  children: ReactNode;
  onMove?: (event: KanbanMoveEvent) => void;
  /** Chamado após o drop ser processado internamente (não chamado em cancel nem quando onMove está ativo). */
  onDragComplete?: (event: KanbanDragEndEvent) => void;
  asChild?: boolean;
  modifiers?: Modifiers;
}

function KanbanInner({
  className,
  asChild = false,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement> & { asChild?: boolean }) {
  const { source } = useDragOperation();
  const isDragging = source != null;
  const Comp = asChild ? Slot.Root : "div";

  return (
    <Comp
      data-slot="kanban"
      data-dragging={isDragging}
      className={cn(isDragging && "cursor-grabbing!", className)}
      {...props}
    >
      {children}
    </Comp>
  );
}

function Kanban<T>({
  value,
  onValueChange,
  getItemValue,
  initialColumnOrder,
  children,
  className,
  asChild = false,
  onMove,
  onDragComplete,
  modifiers,
  ...props
}: KanbanRootProps<T>) {
  const columns = value;
  const setColumns = onValueChange;

  const [columnOrder, setColumnOrder] = useState<string[]>(
    () => initialColumnOrder ?? Object.keys(columns),
  );

  const columnsRef = useRef(columns);
  columnsRef.current = columns;

  const columnOrderRef = useRef(columnOrder);
  columnOrderRef.current = columnOrder;

  const itemsSnapshotRef = useRef<Record<string, T[]>>(columns);
  /** Snapshot da ordem das colunas no início do drag (para revert em cancel). */
  const columnOrderSnapshotRef = useRef<string[]>(columnOrder);
  const dragStartContainerRef = useRef<string | undefined>(undefined);

  const findContainer = useCallback(
    (id: UniqueIdentifier) => {
      const sid = String(id);
      if (columnOrderRef.current.includes(sid)) {
        return sid;
      }
      return columnOrderRef.current.find((key) =>
        columnsRef.current[key]?.some((item) => getItemValue(item) === sid),
      );
    },
    [getItemValue],
  );

  const isColumn = useCallback(
    (id: UniqueIdentifier) => columnOrderRef.current.includes(String(id)),
    [],
  );

  const handleDragStart = useCallback(
    (
      event: Parameters<
        NonNullable<
          React.ComponentProps<typeof DragDropProvider>["onDragStart"]
        >
      >[0],
    ) => {
      itemsSnapshotRef.current = structuredClone(columnsRef.current);
      columnOrderSnapshotRef.current = [...columnOrderRef.current];
      const sourceId = event.operation.source?.id;
      dragStartContainerRef.current =
        sourceId != null ? findContainer(sourceId) : undefined;
    },
    [findContainer],
  );

  const handleDragOver = useCallback(
    (
      event: Parameters<
        NonNullable<React.ComponentProps<typeof DragDropProvider>["onDragOver"]>
      >[0],
    ) => {
      if (onMove) {
        return;
      }
      const { operation } = event;
      if (operation.source?.type === "column") {
        const order = columnOrderRef.current;
        const nextOrder = move(order as UniqueIdentifier[], event) as string[];
        if (nextOrder === order) {
          return;
        }
        columnOrderRef.current = nextOrder.map(String);
        setColumnOrder(columnOrderRef.current);
        return;
      }
      const projected = projectColumnsForMove(columnsRef.current, getItemValue);
      const moved = move(projected, event);
      if (moved === projected) {
        return;
      }
      setColumns(
        restoreColumnsAfterMove(moved, columnsRef.current, getItemValue),
      );
    },
    [getItemValue, onMove, setColumns],
  );

  const handleDragEnd = useCallback(
    (event: KanbanDragEndEvent) => {
      const { operation, canceled } = event;
      const { source } = operation;
      if (!source) {
        return;
      }

      if (onMove && source.type === "item") {
        if (!canceled) {
          const activeContainer = dragStartContainerRef.current;
          const overContainer = findContainer(source.id);
          if (activeContainer != null && overContainer != null) {
            const overIndex =
              columnsRef.current[overContainer]?.findIndex(
                (item) => getItemValue(item) === String(source.id),
              ) ?? -1;
            onMove({
              event,
              activeContainer,
              activeIndex:
                itemsSnapshotRef.current[activeContainer]?.findIndex(
                  (item) => getItemValue(item) === String(source.id),
                ) ?? 0,
              overContainer,
              overIndex: overIndex >= 0 ? overIndex : 0,
            });
          }
        }
        return;
      }

      if (canceled) {
        setColumns(itemsSnapshotRef.current);
        const snap = columnOrderSnapshotRef.current;
        columnOrderRef.current = [...snap];
        setColumnOrder([...snap]);
        return;
      }

      if (source.type === "column") {
        // columnOrderRef.current is already correct from handleDragOver previews;
        // calling move() again on the already-updated state produces wrong positions.
        const order = columnOrderRef.current;
        const cols = columnsRef.current;
        const next: Record<string, T[]> = {};
        for (const id of order) {
          const key = String(id);
          next[key] = cols[key] ?? [];
        }
        setColumnOrder([...order]);
        setColumns(next);
        onDragComplete?.(event);
        return;
      }

      if (!onMove && isSortable(source) && source.type === "item") {
        const projected = projectColumnsForMove(
          columnsRef.current,
          getItemValue,
        );
        const moved = move(projected, event);
        if (moved !== projected) {
          setColumns(
            restoreColumnsAfterMove(moved, columnsRef.current, getItemValue),
          );
        }
        onDragComplete?.(event);
      }
    },
    [findContainer, getItemValue, onMove, onDragComplete, setColumns],
  );

  const contextValue = useMemo(
    () => ({
      columns,
      setColumns,
      getItemId: getItemValue,
      columnOrder,
      findContainer,
      isColumn,
    }),
    [columns, setColumns, getItemValue, columnOrder, findContainer, isColumn],
  );

  return (
    <KanbanContext.Provider value={contextValue}>
      <DragDropProvider
        modifiers={modifiers}
        sensors={(defaults) => [
          ...defaults.filter((sensor) => sensor !== PointerSensor),
          PointerSensor.configure({
            activationConstraints(event) {
              if (event.pointerType === "touch") {
                return [
                  new PointerActivationConstraints.Delay({
                    value: 250,
                    tolerance: { x: 5, y: 5 },
                  }),
                ];
              }
              return [new PointerActivationConstraints.Distance({ value: 10 })];
            },
          }),
        ]}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <KanbanInner asChild={asChild} className={className} {...props}>
          {children}
        </KanbanInner>
      </DragDropProvider>
    </KanbanContext.Provider>
  );
}

export interface KanbanBoardProps extends HTMLAttributes<HTMLDivElement> {
  asChild?: boolean;
  /** Quando true (padrão), o tabuleiro pode ser arrastado horizontalmente com o rato fora dos handles. */
  panScroll?: boolean;
  /** Chamado quando o scroll vertical do tabuleiro se aproxima do fim (infinite scroll). */
  onScrollNearBottom?: () => void;
}

function isKanbanPanExcludedTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) {
    return true;
  }
  if (target.closest('[data-slot="kanban-item-handle"]')) {
    return true;
  }
  if (target.closest('[data-slot="kanban-column-handle"]')) {
    return true;
  }
  if (
    target.closest(
      "button, a, input, textarea, select, [role='menuitem'], [role='option'], [role='menuitemcheckbox']",
    )
  ) {
    return true;
  }
  return false;
}

function KanbanBoard({
  className,
  asChild = false,
  panScroll = true,
  onScrollNearBottom,
  children,
  ...props
}: KanbanBoardProps) {
  const boardScrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = useCallback(
    (event: React.UIEvent<HTMLDivElement>) => {
      if (!onScrollNearBottom) {
        return;
      }
      const el = event.currentTarget;
      // Dispara ao chegar a ~300px do fim do scroll vertical.
      if (el.scrollHeight - el.scrollTop - el.clientHeight < 300) {
        onScrollNearBottom();
      }
    },
    [onScrollNearBottom],
  );
  const boardPanRef = useRef({
    active: false,
    pointerId: -1,
    startX: 0,
    startScrollLeft: 0,
  });

  const onBoardPointerDown = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (!panScroll) {
        return;
      }
      if (event.button !== 0) {
        return;
      }
      if (isKanbanPanExcludedTarget(event.target)) {
        return;
      }

      const el = boardScrollRef.current;
      if (!el) {
        return;
      }

      boardPanRef.current = {
        active: true,
        pointerId: event.pointerId,
        startX: event.clientX,
        startScrollLeft: el.scrollLeft,
      };
      el.setPointerCapture(event.pointerId);
      el.classList.add("cursor-grabbing", "select-none");
    },
    [panScroll],
  );

  const onBoardPointerMove = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      const state = boardPanRef.current;
      if (!state.active || event.pointerId !== state.pointerId) {
        return;
      }

      const el = boardScrollRef.current;
      if (!el) {
        return;
      }

      el.scrollLeft = state.startScrollLeft - (event.clientX - state.startX);
    },
    [],
  );

  const onBoardPointerEnd = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      const state = boardPanRef.current;
      if (!state.active || event.pointerId !== state.pointerId) {
        return;
      }

      const el = boardScrollRef.current;
      boardPanRef.current = {
        active: false,
        pointerId: -1,
        startX: 0,
        startScrollLeft: 0,
      };
      if (el?.hasPointerCapture(event.pointerId)) {
        el.releasePointerCapture(event.pointerId);
      }
      el?.classList.remove("cursor-grabbing", "select-none");
    },
    [],
  );

  const Comp = asChild ? Slot.Root : "div";

  const board = (
    <Comp
      data-slot="kanban-board"
      className={cn("flex min-h-full gap-0", className)}
      {...props}
    >
      {children}
    </Comp>
  );

  if (!panScroll) {
    return board;
  }

  return (
    <div
      ref={boardScrollRef}
      className="min-h-0 flex-1 cursor-grab overflow-x-hidden overflow-y-auto"
      onPointerDown={onBoardPointerDown}
      onPointerMove={onBoardPointerMove}
      onPointerUp={onBoardPointerEnd}
      onPointerCancel={onBoardPointerEnd}
      onLostPointerCapture={onBoardPointerEnd}
      onScroll={handleScroll}
    >
      {board}
    </div>
  );
}

export interface KanbanColumnProps extends HTMLAttributes<HTMLDivElement> {
  value: string;
  /** Índice da coluna na ordem atual (obrigatório para sortable). */
  index: number;
  disabled?: boolean;
  /** Quando true, a coluna não pode ser arrastada nem aceita drops de outras colunas, mas ainda aceita drops de itens. */
  lockedPosition?: boolean;
  asChild?: boolean;
}

function KanbanColumn({
  value,
  index,
  className,
  asChild = false,
  disabled,
  lockedPosition,
  children,
  ...props
}: KanbanColumnProps) {
  const isOverlay = useContext(IsOverlayContext);
  const { source } = useDragOperation();
  const isAnyColumnDrag = source != null && String(source.type) === "column";

  const { columns } = useKanbanContext();
  const isEmpty = (columns[value]?.length ?? 0) === 0;

  const { ref, targetRef, handleRef, isDragging, isDragSource } = useSortable({
    id: value,
    index,
    modifiers: [RestrictToHorizontalAxis],
    collisionPriority: isEmpty
      ? CollisionPriority.High
      : CollisionPriority.Normal,
    type: "column",
    accept: lockedPosition ? ["item"] : ["item", "column"],
    disabled: disabled || isOverlay,
  });

  const Comp = asChild ? Slot.Root : "div";

  if (isOverlay) {
    return (
      <ColumnContext.Provider
        value={{
          handleRef: () => {},
          isDragging: true,
          disabled: false,
        }}
      >
        <Comp
          data-slot="kanban-column"
          data-value={value}
          data-dragging={true}
          className={cn("group/kanban-column flex flex-col", className)}
          {...props}
        >
          {children}
        </Comp>
      </ColumnContext.Provider>
    );
  }

  return (
    <ColumnContext.Provider
      value={{
        handleRef: lockedPosition ? () => {} : handleRef,
        isDragging: isAnyColumnDrag,
        disabled,
        locked: lockedPosition,
      }}
    >
      <Comp
        data-slot="kanban-column"
        data-value={value}
        data-dragging={isDragging}
        data-disabled={disabled}
        ref={lockedPosition ? targetRef : ref}
        className={cn(
          "group/kanban-column flex flex-col",
          isDragSource && "z-50 opacity-0",
          // disabled && "opacity-50",
          className,
        )}
        {...props}
      >
        {children}
      </Comp>
    </ColumnContext.Provider>
  );
}

export interface KanbanColumnHandleProps
  extends HTMLAttributes<HTMLDivElement> {
  cursor?: boolean;
  asChild?: boolean;
}

function KanbanColumnHandle({
  className,
  asChild = false,
  cursor = true,
  children,
  ...props
}: KanbanColumnHandleProps) {
  const { handleRef, isDragging, disabled, locked } = useContext(ColumnContext);

  const Comp = asChild ? Slot.Root : "div";

  return (
    <Comp
      data-slot="kanban-column-handle"
      data-dragging={isDragging}
      data-disabled={disabled}
      ref={handleRef}
      className={cn(
        "opacity-0 transition-opacity",
        !disabled && !locked && "group-hover/kanban-column:opacity-100",
        locked && "hidden",
        cursor && (isDragging ? "cursor-grabbing!" : "cursor-grab!"),
        className,
      )}
      {...props}
    >
      {children}
    </Comp>
  );
}

export interface KanbanItemProps extends HTMLAttributes<HTMLDivElement> {
  value: string;
  index: number;
  group: string;
  disabled?: boolean;
  asChild?: boolean;
}

function KanbanItem({
  value,
  index,
  group,
  className,
  asChild = false,
  disabled,
  children,
  ...props
}: KanbanItemProps) {
  const isOverlay = useContext(IsOverlayContext);

  const { ref, handleRef, isDragging, isDragSource } = useSortable({
    id: value,
    index,
    group,
    collisionDetector: closestCenter,
    type: "item",
    accept: ["item"],
    disabled: isOverlay,
  });

  const Comp = asChild ? Slot.Root : "div";

  if (isOverlay) {
    return (
      <ItemContext.Provider
        value={{ handleRef: () => {}, isDragging: true, disabled: false }}
      >
        <Comp
          data-slot="kanban-item"
          data-value={value}
          data-dragging={true}
          className={cn(className)}
          {...props}
        >
          {children}
        </Comp>
      </ItemContext.Provider>
    );
  }

  return (
    <ItemContext.Provider
      value={{
        handleRef: disabled ? () => {} : handleRef,
        isDragging,
        disabled,
      }}
    >
      <Comp
        data-slot="kanban-item"
        data-value={value}
        data-dragging={isDragging}
        data-disabled={disabled}
        ref={ref}
        className={cn(
          isDragSource && "z-50 opacity-50",
          // disabled && "opacity-50",
          className,
        )}
        {...props}
      >
        {disabled && <span ref={handleRef} aria-hidden className="hidden" />}
        {children}
      </Comp>
    </ItemContext.Provider>
  );
}

export interface KanbanItemHandleProps extends HTMLAttributes<HTMLDivElement> {
  cursor?: boolean;
  asChild?: boolean;
}

function KanbanItemHandle({
  className,
  asChild = false,
  cursor = true,
  children,
  ...props
}: KanbanItemHandleProps) {
  const { handleRef, isDragging, disabled } = useContext(ItemContext);

  const Comp = asChild ? Slot.Root : "div";

  return (
    <Comp
      data-slot="kanban-item-handle"
      data-dragging={isDragging}
      data-disabled={disabled}
      ref={handleRef}
      className={cn(
        cursor && (isDragging ? "cursor-grabbing!" : "cursor-grab!"),
        className,
      )}
      {...props}
    >
      {children}
    </Comp>
  );
}

export interface KanbanColumnContentProps
  extends HTMLAttributes<HTMLDivElement> {
  value: string;
  asChild?: boolean;
}

function KanbanColumnContent({
  value: _value,
  className,
  asChild = false,
  children,
  ...props
}: KanbanColumnContentProps) {
  const Comp = asChild ? Slot.Root : "div";

  return (
    <Comp
      data-slot="kanban-column-content"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    >
      {children}
    </Comp>
  );
}

export interface KanbanOverlayProps
  extends Omit<React.ComponentProps<typeof DragOverlay>, "children"> {
  children?:
    | ReactNode
    | ((source: { id: UniqueIdentifier; type: unknown }) => ReactNode);
}

function KanbanOverlay({ children, className, ...props }: KanbanOverlayProps) {
  return (
    <DragOverlay className={cn("z-50", className)} {...props}>
      {(source) => (
        <IsOverlayContext.Provider value={true}>
          {typeof children === "function"
            ? children({ id: source.id, type: source.type })
            : children}
        </IsOverlayContext.Provider>
      )}
    </DragOverlay>
  );
}

export {
  Kanban,
  KanbanBoard,
  KanbanColumn,
  KanbanColumnHandle,
  KanbanItem,
  KanbanItemHandle,
  KanbanColumnContent,
  KanbanOverlay,
};
