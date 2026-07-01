"use client";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { AGENT_WEEK_DAY_OPTIONS } from "@/lib/constants/agents";
import { cn } from "@/lib/utils";

interface WeekDaysToggleProps {
  value: string[];
  onValueChange: (values: string[]) => void;
  disabled?: boolean;
  className?: string;
}

export function WeekDaysToggle({
  value,
  onValueChange,
  disabled,
  className,
}: WeekDaysToggleProps) {
  return (
    <ToggleGroup
      type="multiple"
      variant="secondary"
      value={value}
      spacing={0.6}
      onValueChange={onValueChange}
      disabled={disabled}
      className={cn("w-full flex-wrap", className)}
      size="xs"
    >
      {AGENT_WEEK_DAY_OPTIONS.map((day) => (
        <ToggleGroupItem
          key={day.value}
          value={day.value}
          aria-label={day.ariaLabel}
          className="flex-1 px-2 text-xs"
        >
          {day.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
