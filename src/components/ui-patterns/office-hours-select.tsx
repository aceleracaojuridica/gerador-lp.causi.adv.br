"use client";

import { Refresh } from "@material-symbols-svg/react/w400";
import type { ComponentProps } from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface OfficeHoursSelectProps
  extends Omit<ComponentProps<"select">, "children"> {
  options: readonly string[];
  placeholder: string;
  recommendedValue?: string;
  onApplyRecommended?: () => void;
  showRecommendedButton?: boolean;
}

export function OfficeHoursSelect({
  options,
  placeholder,
  recommendedValue,
  onApplyRecommended,
  showRecommendedButton = Boolean(recommendedValue && onApplyRecommended),
  disabled,
  className,
  value,
  "aria-invalid": ariaInvalid,
  ...selectProps
}: OfficeHoursSelectProps) {
  const hasValue = typeof value === "string" && value.length > 0;

  return (
    <div className="flex items-center gap-2">
      {showRecommendedButton ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              className="shrink-0 rounded-full"
              disabled={disabled}
              aria-label={`Aplicar recomendado: ${recommendedValue}`}
              onClick={onApplyRecommended}
            >
              <Refresh className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {`Aplica o horário recomendado: ${recommendedValue}`}
          </TooltipContent>
        </Tooltip>
      ) : null}
      <div className="relative flex-1">
        <select
          disabled={disabled}
          value={value}
          aria-invalid={ariaInvalid}
          className={cn(
            "h-10 w-full min-w-0 rounded-md border border-input bg-background px-3 py-1 text-sm text-foreground transition-[color,box-shadow,background,border] outline-none selection:bg-primary selection:text-primary-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30",
            "hover:border-muted-foreground/35",
            "focus-visible:border-primary/50",
            "aria-invalid:border-destructive/50",
            "appearance-none pr-12 tabular-nums",
            !hasValue && "text-muted-foreground/70",
            ariaInvalid && "border-destructive",
            className,
          )}
          {...selectProps}
        >
          <option
            value=""
            disabled
            className="bg-background text-muted-foreground"
          >
            {placeholder}
          </option>
          {options.map((time) => (
            <option
              key={time}
              value={time}
              className="bg-background text-foreground"
            >
              {time}
            </option>
          ))}
        </select>
        <span
          className={cn(
            "pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-muted-foreground/70 tabular-nums",
            hasValue && "opacity-0",
          )}
        >
          HH:MM
        </span>
      </div>
    </div>
  );
}
