"use client";

import { Combobox as ComboboxPrimitive } from "@base-ui/react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
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
  EntityItemTriggerSizeProvider,
} from "@/components/ui-patterns/entity-item";
import { cn } from "@/lib/utils";
import { Spinner } from "../ui/spinner";

interface EntityComboboxContextValue<T> {
  items: T[];
  getLabel: (item: T) => string;
  toKey: (item: T) => string;
  isItemDisabled: (item: T) => boolean;
  searchPlaceholder: string;
  emptyMessage: string;
  disabled: boolean;
  handleSearchChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleScroll?: (e: React.UIEvent<HTMLElement>) => void;
  isLoading: boolean;
  hint?: string;
}

const EntityComboboxContext =
  React.createContext<EntityComboboxContextValue<unknown> | null>(null);

function useEntityComboboxContext<T>() {
  const context = React.use(EntityComboboxContext);
  if (!context) {
    throw new Error(
      "EntityCombobox subcomponents must be used within EntityCombobox",
    );
  }
  return context as EntityComboboxContextValue<T>;
}

type EntityComboboxProviderProps<T> = ComboboxEntityBaseProps<T> & {
  value?: T | null;
  defaultValue?: T | null;
  onValueChange?: (value: T | null) => void;
  children: React.ReactNode;
};

function EntityComboboxProvider<T>({
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
}: EntityComboboxProviderProps<T>) {
  const toKey = useComboboxEntityKey(getLabel, getKey);
  const isItemDisabled = useComboboxEntityDisabled(disabledItems, toKey);
  const handleSearchChange = useComboboxSearchDebounce(
    onSearchChange,
    debounceDelay,
  );
  const handleScroll = useComboboxScrollEnd(onScrollEnd);

  const contextValue = React.useMemo(
    (): EntityComboboxContextValue<T> => ({
      items,
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
    }),
    [
      items,
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
    <EntityComboboxContext.Provider
      value={contextValue as EntityComboboxContextValue<unknown>}
    >
      <Combobox
        {...sharedProps}
        {...(value !== undefined
          ? { value, onValueChange }
          : { defaultValue: defaultValue ?? null })}
      >
        {children}
      </Combobox>
    </EntityComboboxContext.Provider>
  );
}

interface EntityComboboxItemProps<T> {
  value: T;
  children: React.ReactNode;
  className?: string;
}

function EntityComboboxItem<T>({
  value,
  children,
  className,
}: EntityComboboxItemProps<T>) {
  const { isItemDisabled } = useEntityComboboxContext<T>();

  return (
    <ComboboxItem
      value={value}
      disabled={isItemDisabled(value)}
      className={cn("min-h-9", className)}
    >
      {children}
    </ComboboxItem>
  );
}

interface EntityComboboxContentProps<T> {
  className?: string;
  children?: (item: T) => React.ReactNode;
}

function EntityComboboxContent<T>({
  className,
  children: renderItem,
}: EntityComboboxContentProps<T>) {
  const {
    getLabel,
    toKey,
    searchPlaceholder,
    emptyMessage,
    disabled,
    handleSearchChange,
    handleScroll,
    isLoading,
    hint,
  } = useEntityComboboxContext<T>();

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
          <EntityComboboxItem key={toKey(item)} value={item}>
            {renderItem ? (
              renderItem(item)
            ) : (
              <EntityItem>
                <EntityItemTitle>{getLabel(item)}</EntityItemTitle>
              </EntityItem>
            )}
          </EntityComboboxItem>
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

type EntityComboboxInputTriggerProps<T> = {
  showClear?: boolean;
  placeholder?: string;
  className?: string;
  size?: "default" | "sm" | "lg";
  triggerVariant?: "input" | "outline" | "ghost" | "secondary";
  children?: (item: T) => React.ReactNode;
} & Omit<
  React.ComponentPropsWithoutRef<typeof Button>,
  "children" | "variant" | "disabled" | "className" | "size"
>;

function EntityComboboxInputTrigger<T>({
  showClear = false,
  placeholder = "Selecione um item",
  className,
  size = "default",
  triggerVariant = "input",
  children: renderSelected,
  ...buttonProps
}: EntityComboboxInputTriggerProps<T>) {
  const { getLabel, disabled } = useEntityComboboxContext<T>();

  return (
    <EntityItemTriggerSizeProvider size={size}>
      <ComboboxTrigger
        showClear={showClear}
        render={
          <Button
            variant={triggerVariant}
            className={cn(
              "w-full justify-between h-10 group-has-[[data-slot=combobox-trigger-clear]]/combobox-trigger-wrap:pr-8",
              className,
              size === "sm" && "h-9",
            )}
            disabled={disabled}
            {...buttonProps}
          />
        }
      >
        <ComboboxValue>
          {(item: T | null) => {
            if (item) {
              return renderSelected ? (
                renderSelected(item)
              ) : (
                <span>{getLabel(item)}</span>
              );
            }
            return (
              <span className="text-muted-foreground/50">{placeholder}</span>
            );
          }}
        </ComboboxValue>
      </ComboboxTrigger>
    </EntityItemTriggerSizeProvider>
  );
}

interface EntityComboboxTriggerProps {
  children: React.ReactElement;
  className?: string;
}

function EntityComboboxTrigger({
  children,
  className,
}: EntityComboboxTriggerProps) {
  return (
    <ComboboxPrimitive.Trigger
      data-slot="combobox-trigger"
      className={className}
      render={children}
    />
  );
}

type EntityComboboxStandaloneTriggerProps = {
  showClear?: boolean;
  placeholder?: string;
  className?: string;
  size?: "default" | "sm" | "lg";
  triggerVariant?: "input" | "outline" | "ghost" | "secondary";
};

type EntityComboboxProps<T> = Omit<EntityComboboxProviderProps<T>, "children"> &
  EntityComboboxStandaloneTriggerProps & {
    children?: React.ReactNode;
  };

function EntityCombobox<T>({
  showClear,
  placeholder,
  className,
  size,
  triggerVariant,
  children,
  ...providerProps
}: EntityComboboxProps<T>) {
  if (children) {
    return (
      <EntityComboboxProvider {...providerProps}>
        {children}
      </EntityComboboxProvider>
    );
  }

  return (
    <EntityComboboxProvider {...providerProps}>
      <EntityComboboxInputTrigger
        showClear={showClear}
        placeholder={placeholder}
        className={className}
        size={size}
        triggerVariant={triggerVariant}
      />
      <EntityComboboxContent />
    </EntityComboboxProvider>
  );
}

export {
  EntityCombobox,
  EntityComboboxContent,
  EntityComboboxItem,
  EntityComboboxInputTrigger,
  EntityComboboxTrigger,
};
