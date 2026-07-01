"use client";

import * as React from "react";

export type ComboboxEntityBaseProps<T> = {
  items: T[];
  disabledItems?: T[];
  getLabel: (item: T) => string;
  getKey?: (item: T) => string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  modal?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSearchChange?: (query: string) => void;
  debounce?: number;
  onScrollEnd?: () => void;
  isLoading?: boolean;
  hint?: string;
};

export function useComboboxEntityKey<T>(
  getLabel: (item: T) => string,
  getKey?: (item: T) => string,
) {
  return getKey ?? getLabel;
}

export function useComboboxEntityDisabled<T>(
  disabledItems: T[],
  toKey: (item: T) => string,
) {
  return React.useCallback(
    (item: T) => disabledItems.some((d) => toKey(d) === toKey(item)),
    [disabledItems, toKey],
  );
}

export function useComboboxSearchDebounce(
  onSearchChange: ((query: string) => void) | undefined,
  debounceDelay = 500,
) {
  const debounceTimer = React.useRef<ReturnType<typeof setTimeout>>(undefined);

  const handleSearchChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!onSearchChange) return;
      clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => {
        onSearchChange(e.target.value);
      }, debounceDelay);
    },
    [onSearchChange, debounceDelay],
  );

  React.useEffect(() => {
    return () => clearTimeout(debounceTimer.current);
  }, []);

  return onSearchChange ? handleSearchChange : undefined;
}

export function useComboboxScrollEnd(onScrollEnd?: () => void) {
  return React.useCallback(
    (e: React.UIEvent<HTMLElement>) => {
      if (!onScrollEnd) return;
      const el = e.currentTarget;
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 40) {
        onScrollEnd();
      }
    },
    [onScrollEnd],
  );
}

export function getComboboxOpenProps(
  open: boolean | undefined,
  onOpenChange: ((open: boolean) => void) | undefined,
) {
  return open !== undefined ? { open, onOpenChange } : { onOpenChange };
}

export function getComboboxSharedProps<T>(
  items: T[],
  getLabel: (item: T) => string,
  toKey: (item: T) => string,
  open: boolean | undefined,
  onOpenChange: ((open: boolean) => void) | undefined,
) {
  return {
    items,
    itemToStringLabel: getLabel,
    itemToStringValue: getLabel,
    isItemEqualToValue: (item: T, selected: T) =>
      toKey(item) === toKey(selected),
    ...getComboboxOpenProps(open, onOpenChange),
  };
}
