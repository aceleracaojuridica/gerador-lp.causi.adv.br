"use client";

import { Sell } from "@material-symbols-svg/react/rounded/w600";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import SearchIcon from "../icons/search-icon";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "../ui/input-group";

/**
 * Variants for the MultiSelect component trigger.
 */
const multiSelectVariants = cva("m-1 transition-all duration-300", {
  variants: {
    variant: {
      default: "border-foreground/10 text-foreground bg-card hover:bg-card/80",
      secondary:
        "border-foreground/10 bg-secondary text-secondary-foreground hover:bg-secondary/80",
      destructive:
        "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
      inverted: "inverted",
    },
    size: {
      default: "h-10",
      sm: "h-8",
      xs: "h-6",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "default",
  },
});

interface MultiSelectProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof multiSelectVariants> {
  /**
   * The options available for selection.
   */
  options: {
    /** The text to display for the option. */
    label: string;
    /** The unique value identifier for the option. */
    value: string;
    /** Optional icon component to display alongside the label. */
    icon?: React.ComponentType<{ className?: string }>;
  }[];

  /**
   * Callback function triggered when the selected values change.
   */
  onValueChange: (value: string[]) => void;

  /** The current selected values. */
  value?: string[];

  /** Default selected values for uncontrolled usage. */
  defaultValue?: string[];

  /** Placeholder text when nothing is selected or in the search input. */
  placeholder?: string;

  /** Whether to render the popover as a modal. */
  modalPopover?: boolean;

  /** Additional CSS classes for the container. */
  className?: string;
}

const MultiSelect = React.forwardRef<HTMLButtonElement, MultiSelectProps>(
  (
    {
      options,
      onValueChange,
      variant,
      size,
      value,
      defaultValue = [],
      placeholder = "Selecionar opções",
      modalPopover = false,
      className,
      ...props
    },
    ref,
  ) => {
    // Determine if we are controlled or uncontrolled
    const isControlled = value !== undefined;
    const [internalValues, setInternalValues] =
      React.useState<string[]>(defaultValue);

    // The active values are either from props or internal state
    const selectedValues = isControlled ? value : internalValues;

    const [isPopoverOpen, setIsPopoverOpen] = React.useState(false);
    const [searchQuery, setSearchQuery] = React.useState("");

    const toggleOption = (optionValue: string) => {
      const newValues = selectedValues.includes(optionValue)
        ? selectedValues.filter((v) => v !== optionValue)
        : [...selectedValues, optionValue];

      if (!isControlled) {
        setInternalValues(newValues);
      }
      onValueChange(newValues);
    };

    const filteredOptions = options.filter((option) =>
      option.label.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    return (
      <Popover
        open={isPopoverOpen}
        onOpenChange={setIsPopoverOpen}
        modal={modalPopover}
      >
        <div className={cn("flex flex-col gap-2 w-full", className)}>
          {/* Selected Tags Row (Top placement as per original UI) */}
          {selectedValues.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {selectedValues.map((val) => {
                const option = options.find((o) => o.value === val);
                if (!option) return null;
                const IconComponent = option.icon;
                return (
                  <Badge
                    asChild
                    key={val}
                    variant="muted"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleOption(val);
                    }}
                  >
                    <button type="button">
                      {IconComponent && <IconComponent className="size-3" />}
                      {option.label}
                    </button>
                  </Badge>
                );
              })}
            </div>
          )}

          <PopoverTrigger asChild>
            <Button ref={ref} {...props} variant="outline" size="sm">
              <Sell className="text-muted-foreground-light" />
              {placeholder}
            </Button>
          </PopoverTrigger>
        </div>
        <PopoverContent className="w-72 p-2" align="end" sideOffset={4}>
          <div className="space-y-2">
            {/* Search Input */}
            <InputGroup className="h-9">
              <InputGroupInput
                className="h-9"
                placeholder="Buscar etiquetas"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <InputGroupAddon align="inline-start">
                <SearchIcon className="text-muted-foreground-light" />
              </InputGroupAddon>
            </InputGroup>

            {/* Tags Cloud/Flex List */}
            <div className="flex flex-wrap gap-1.5 max-h-41 overflow-y-auto custom-scrollbar">
              {filteredOptions.length === 0 ? (
                <p className="text-[10px] text-muted-foreground w-full text-center py-4">
                  Nenhuma etiqueta encontrada.
                </p>
              ) : (
                filteredOptions.map((option) => {
                  const isSelected = selectedValues.includes(option.value);
                  return (
                    <Badge
                      asChild
                      key={option.value}
                      variant={isSelected ? "secondary" : "muted"}
                      onClick={() => toggleOption(option.value)}
                    >
                      <button type="button">{option.label}</button>
                    </Badge>
                  );
                })
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    );
  },
);

MultiSelect.displayName = "MultiSelect";

export { MultiSelect };
