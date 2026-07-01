"use client";

import { Combobox as ComboboxPrimitive } from "@base-ui/react";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
} from "@/components/ui/combobox";
import {
  type ComboboxEntityBaseProps,
  getComboboxSharedProps,
  useComboboxEntityDisabled,
  useComboboxEntityKey,
  useComboboxScrollEnd,
  useComboboxSearchDebounce,
} from "@/components/ui-patterns/combobox-entity-shared";
import {
  EntityItem,
  EntityItemTitle,
} from "@/components/ui-patterns/entity-item";
import { cn } from "@/lib/utils";
import { Spinner } from "../ui/spinner";

interface TagsComboboxContextValue<T> {
  getLabel: (item: T) => string;
  toKey: (item: T) => string;
  isItemDisabled: (item: T) => boolean;
  onValueChange?: (value: T[]) => void;
  searchPlaceholder: string;
  emptyMessage: string;
  disabled: boolean;
  handleSearchChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleScroll?: (e: React.UIEvent<HTMLElement>) => void;
  isLoading: boolean;
  hint?: string;
}

const TagsComboboxContext =
  React.createContext<TagsComboboxContextValue<unknown> | null>(null);

function useTagsComboboxContext<T>() {
  const context = React.use(TagsComboboxContext);
  if (!context) {
    throw new Error(
      "TagsCombobox subcomponents must be used within TagsCombobox",
    );
  }
  return context as TagsComboboxContextValue<T>;
}

type TagsComboboxProps<T> = ComboboxEntityBaseProps<T> & {
  value?: T[];
  defaultValue?: T[];
  onValueChange?: (value: T[]) => void;
  children: React.ReactNode;
};

function TagsCombobox<T>({
  items,
  value,
  defaultValue,
  onValueChange,
  disabledItems = [],
  getLabel,
  getKey,
  searchPlaceholder = "Buscar...",
  emptyMessage = "Nenhum item encontrado.",
  disabled = false,
  modal: _modal = false,
  open,
  onOpenChange,
  onSearchChange,
  debounce: debounceDelay = 500,
  onScrollEnd,
  isLoading = false,
  hint,
  children,
}: TagsComboboxProps<T>) {
  const toKey = useComboboxEntityKey(getLabel, getKey);
  const isItemDisabled = useComboboxEntityDisabled(disabledItems, toKey);
  const handleSearchChange = useComboboxSearchDebounce(
    onSearchChange,
    debounceDelay,
  );
  const handleScroll = useComboboxScrollEnd(onScrollEnd);

  const contextValue = React.useMemo(
    (): TagsComboboxContextValue<T> => ({
      getLabel,
      toKey,
      isItemDisabled,
      onValueChange,
      searchPlaceholder,
      emptyMessage,
      disabled,
      handleSearchChange,
      handleScroll,
      isLoading,
      hint,
    }),
    [
      getLabel,
      toKey,
      isItemDisabled,
      onValueChange,
      searchPlaceholder,
      emptyMessage,
      disabled,
      handleSearchChange,
      handleScroll,
      isLoading,
      hint,
    ],
  );

  const sharedProps = getComboboxSharedProps(
    items,
    getLabel,
    toKey,
    open,
    onOpenChange,
  );

  return (
    <TagsComboboxContext.Provider
      value={contextValue as TagsComboboxContextValue<unknown>}
    >
      <Combobox
        multiple
        {...sharedProps}
        {...(value !== undefined
          ? { value, onValueChange }
          : { defaultValue: defaultValue ?? [] })}
      >
        {children}
      </Combobox>
    </TagsComboboxContext.Provider>
  );
}

interface TagsComboboxSelectionProps {
  className?: string;
}

function TagsComboboxSelection<T>({ className }: TagsComboboxSelectionProps) {
  const { getLabel, toKey, onValueChange } = useTagsComboboxContext<T>();

  return (
    <ComboboxValue>
      {(value: unknown) => {
        const selected = Array.isArray(value) ? value : [];
        if (selected.length === 0) return null;

        return (
          <div className={cn("flex flex-wrap gap-1.5", className)}>
            {(selected as T[]).map((item) => (
              <Badge key={toKey(item)} variant="muted" asChild>
                <button
                  type="button"
                  onClick={() =>
                    onValueChange?.(
                      selected.filter((s) => toKey(s) !== toKey(item)),
                    )
                  }
                >
                  {getLabel(item)}
                </button>
              </Badge>
            ))}
          </div>
        );
      }}
    </ComboboxValue>
  );
}

interface TagsComboboxTriggerProps {
  children: React.ReactElement;
  className?: string;
}

function TagsComboboxTrigger({
  children,
  className,
}: TagsComboboxTriggerProps) {
  return (
    <ComboboxPrimitive.Trigger
      data-slot="combobox-trigger"
      className={className}
      render={children}
    />
  );
}

interface TagsComboboxContentProps<T> {
  className?: string;
  children?: (item: T) => React.ReactNode;
}

function TagsComboboxContent<T>({
  className,
  children: renderItem,
}: TagsComboboxContentProps<T>) {
  const {
    getLabel,
    toKey,
    isItemDisabled,
    searchPlaceholder,
    emptyMessage,
    disabled,
    handleSearchChange,
    handleScroll,
    isLoading,
    hint,
  } = useTagsComboboxContext<T>();

  return (
    <ComboboxContent
      className={cn("max-w-(--anchor-width) min-w-(--anchor-width)", className)}
    >
      <ComboboxInput
        showTrigger={false}
        placeholder={searchPlaceholder}
        disabled={disabled}
        onChange={handleSearchChange}
      />
      {!isLoading && (
        <ComboboxEmpty className="py-3">{emptyMessage}</ComboboxEmpty>
      )}
      <ComboboxList onScroll={handleScroll}>
        {(item: T) => (
          <ComboboxItem
            key={toKey(item)}
            value={item}
            disabled={isItemDisabled(item)}
            className="min-h-9"
          >
            {renderItem ? (
              renderItem(item)
            ) : (
              <EntityItem>
                <EntityItemTitle>{getLabel(item)}</EntityItemTitle>
              </EntityItem>
            )}
          </ComboboxItem>
        )}
      </ComboboxList>
      {isLoading && (
        <div className="py-3 px-3 border-t flex gap-1 items-center justify-center text-sm text-center text-muted-foreground">
          <Spinner className="text-primary" />
          Carregando...
        </div>
      )}
      {!isLoading && hint && (
        <div className="py-2 px-3 border-t text-xs text-muted-foreground">
          {hint}
        </div>
      )}
    </ComboboxContent>
  );
}

export {
  TagsCombobox,
  TagsComboboxContent,
  TagsComboboxSelection,
  TagsComboboxTrigger,
};
