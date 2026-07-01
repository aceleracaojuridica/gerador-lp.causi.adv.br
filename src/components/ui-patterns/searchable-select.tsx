import { Check } from "@material-symbols-svg/react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

/**
 * Combobox atomômico com busca interna — segue o padrão compositivo do shadcn/ui.
 *
 * @remarks
 * Gerencia estado aberto/fechado via Context API. Usa `cmdk` para busca e
 * Radix UI Popover para posicionamento.
 */

interface SearchableSelectContextType {
  value?: string;
  onValueChange: (value: string) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
}

const SearchableSelectContext = React.createContext<
  SearchableSelectContextType | undefined
>(undefined);

function useSearchableSelect() {
  const context = React.useContext(SearchableSelectContext);
  if (!context) {
    throw new Error(
      "SearchableSelect components must be used within a SearchableSelect",
    );
  }
  return context;
}

interface SearchableSelectProps {
  value?: string;
  onValueChange: (value: string) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

export function SearchableSelect({
  value,
  onValueChange,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
  children,
}: SearchableSelectProps) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = setControlledOpen ?? setInternalOpen;

  const contextValue = React.useMemo(
    () => ({ value, onValueChange, open, setOpen }),
    [value, onValueChange, open, setOpen],
  );

  return (
    <SearchableSelectContext.Provider value={contextValue}>
      <Popover open={open} onOpenChange={setOpen}>
        {children}
      </Popover>
    </SearchableSelectContext.Provider>
  );
}

export interface SearchableSelectTriggerProps
  extends React.ComponentPropsWithoutRef<typeof Button> {
  placeholder?: string;
}

export const SearchableSelectTrigger = React.forwardRef<
  HTMLButtonElement,
  SearchableSelectTriggerProps
>(
  (
    {
      children,
      placeholder = "Selecionar item",
      className,
      variant = "outline",
      ...props
    },
    ref,
  ) => {
    const { open, value } = useSearchableSelect();

    return (
      <PopoverTrigger asChild>
        <Button
          ref={ref}
          role="combobox"
          aria-expanded={open}
          variant={variant}
          className={cn(!value && "text-muted-foreground", className)}
          {...props}
        >
          {children || <span className="truncate">{placeholder}</span>}
        </Button>
      </PopoverTrigger>
    );
  },
);

SearchableSelectTrigger.displayName = "SearchableSelectTrigger";

interface SearchableSelectContentProps {
  children: React.ReactNode;
  searchPlaceholder?: string;
  className?: string;
  align?: "start" | "center" | "end";
}

export function SearchableSelectContent({
  children,
  searchPlaceholder = "Buscar...",
  className,
  align = "start",
}: SearchableSelectContentProps) {
  return (
    <PopoverContent
      align={align}
      className={cn(
        "w-[--radix-popover-trigger-width] p-0 shadow-lg",
        className,
      )}
    >
      <Command>
        <CommandInput placeholder={searchPlaceholder} />
        <CommandList>{children}</CommandList>
      </Command>
    </PopoverContent>
  );
}

interface SearchableSelectItemProps {
  value: string;
  onSelect?: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

export function SearchableSelectItem({
  value: itemValue,
  onSelect,
  children,
  className,
}: SearchableSelectItemProps) {
  const {
    value: selectedValue,
    onValueChange,
    setOpen,
  } = useSearchableSelect();
  const isSelected = selectedValue === itemValue;

  const handleSelect = React.useCallback(() => {
    const newValue = isSelected ? "" : itemValue;
    onValueChange(newValue);
    onSelect?.(newValue);
    setOpen(false);
  }, [isSelected, itemValue, onValueChange, onSelect, setOpen]);

  return (
    <CommandItem
      value={itemValue}
      onSelect={handleSelect}
      className={cn(
        "flex items-center gap-2 px-2 py-1.5 cursor-pointer hover:bg-accent",
        className,
      )}
    >
      <Check
        className={cn(
          "size-4 shrink-0 border-none",
          isSelected ? "opacity-100" : "opacity-0",
        )}
      />
      {children}
    </CommandItem>
  );
}

export function SearchableSelectEmpty({
  children,
}: {
  children: React.ReactNode;
}) {
  return <CommandEmpty>{children}</CommandEmpty>;
}

export function SearchableSelectGroup({
  children,
  heading,
}: {
  children: React.ReactNode;
  heading?: string;
}) {
  return <CommandGroup heading={heading}>{children}</CommandGroup>;
}
