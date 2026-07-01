"use client";

import { Close } from "@material-symbols-svg/react/rounded/w500";
import type * as React from "react";
import { useEffect, useId, useRef, useState } from "react";
import SearchIcon from "@/components/icons/search-icon";
import { cn } from "@/lib/utils";

type ButtonSearchSize = "xs" | "sm" | "default" | "lg";

const sizeMap = {
  xs: {
    container: "h-7 w-7 px-2",
    expanded: "w-44",
    btn: "mr-[-1px]",
    text: "text-xs",
    svg: "size-3",
  },
  sm: {
    container: "h-8 w-8 px-2",
    expanded: "w-48",
    btn: "mr-[-1px]",
    text: "text-xs",
    svg: "size-3.5",
  },
  default: {
    container: "size-9 px-3",
    expanded: "w-56",
    btn: "mr-[-1px]",
    text: "text-sm",
    svg: "size-4",
  },
  lg: {
    container: "size-9 md:size-10 px-2.5 md:px-3",
    expanded: "w-64 md:w-64",
    btn: "mr-[-1px]",
    text: "text-sm",
    svg: "size-4",
  },
} satisfies Record<
  ButtonSearchSize,
  {
    container: string;
    expanded: string;
    btn: string;
    text: string;
    svg: string;
  }
>;

interface ButtonSearchProps {
  size?: ButtonSearchSize;
  placeholder?: string;
  className?: string;
  value?: string;
  defaultValue?: string;
  disabled?: boolean;
  /** Chamado apos o delay de debounce com o valor atual do input. */
  onChange?: (value: string) => void;
  /** Delay em ms antes de disparar onChange. Padrao: 500ms. */
  debounce?: number;
}

export function ButtonSearch({
  size = "default",
  placeholder = "Buscar...",
  className,
  value: controlledValue,
  defaultValue = "",
  onChange,
  debounce = 500,
  disabled = false,
}: ButtonSearchProps) {
  const inputId = useId();
  const isControlled = controlledValue !== undefined;
  const [isOpen, setIsOpen] = useState(!!(controlledValue ?? defaultValue));
  const [isFocused, setIsFocused] = useState(false);
  const [internalValue, setInternalValue] = useState(
    isControlled ? (controlledValue ?? "") : defaultValue,
  );
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const displayValue = isControlled ? (controlledValue ?? "") : internalValue;

  useEffect(() => {
    if (isControlled && controlledValue) {
      setInternalValue(controlledValue);
      setIsOpen(true);
    }
  }, [isControlled, controlledValue]);

  const fireDebounced = (val: string) => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => onChange?.(val), debounce);
  };

  useEffect(
    () => () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    },
    [],
  );

  const open = () => {
    setIsOpen(true);
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const handleClear = () => {
    setInternalValue("");
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    onChange?.("");
    inputRef.current?.focus();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInternalValue(val);
    fireDebounced(val);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setInternalValue("");
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      onChange?.("");
      setIsOpen(false);
      setIsFocused(false);
      inputRef.current?.blur();
    }
  };

  const handleContainerBlur = (e: React.FocusEvent<HTMLLabelElement>) => {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsFocused(false);
    if (!displayValue) setIsOpen(false);
  };

  const handleLabelMouseDown = (e: React.MouseEvent<HTMLLabelElement>) => {
    const target = e.target as HTMLElement;
    if (target.closest("button")) return;

    const clickedInput = target === inputRef.current;

    if (!isOpen) {
      e.preventDefault();
      open();
      return;
    }

    if (!clickedInput) {
      e.preventDefault();
      inputRef.current?.focus();
    }
  };

  const cfg = sizeMap[size];

  return (
    <label
      htmlFor={inputId}
      onMouseDown={handleLabelMouseDown}
      onFocus={() => setIsFocused(true)}
      onBlur={handleContainerBlur}
      className={cn(
        "relative inline-flex justify-end items-center rounded-md border gap-1",
        "transition-[width,border-color,background-color] duration-200 ease-in-out",
        disabled && "pointer-events-none opacity-50",
        cfg.container,
        isOpen && cfg.expanded,
        isFocused && isOpen
          ? "border-primary/50 bg-background"
          : "border-border bg-background dark:border-input dark:bg-input/30",
        !isOpen && "cursor-pointer hover:bg-accent dark:hover:bg-input/50",
        className,
      )}
    >
      <input
        ref={inputRef}
        id={inputId}
        type="text"
        value={displayValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        aria-label="Buscar"
        tabIndex={isOpen ? 0 : -1}
        className={cn(
          "min-w-0 flex-1 bg-transparent outline-none",
          "placeholder:text-muted-foreground/50 text-foreground",
          "transition-opacity duration-200",
          cfg.text,
          isOpen ? "opacity-100" : "w-0 opacity-0",
        )}
      />

      {isOpen && displayValue && (
        <button
          type="button"
          aria-label="Limpar busca"
          onMouseDown={(e) => e.preventDefault()}
          onClick={(e) => {
            e.stopPropagation();
            handleClear();
          }}
          className="inline-flex shrink-0 items-center justify-center text-muted-foreground hover:text-muted-foreground-light transition-colors"
        >
          <Close className="size-6" />
        </button>
      )}

      <button
        type="button"
        aria-label="Abrir busca"
        onClick={open}
        className={cn(
          "inline-flex shrink-0 items-center justify-center text-muted-foreground",
          cfg.btn,
        )}
      >
        <SearchIcon className={cfg.svg} />
      </button>
    </label>
  );
}
