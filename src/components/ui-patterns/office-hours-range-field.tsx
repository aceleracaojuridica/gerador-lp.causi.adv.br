"use client";

import type { ComponentProps } from "react";
import { OfficeHoursSelect } from "@/components/ui-patterns/office-hours-select";
import {
  filterOfficeHoursEndOptions,
  filterOfficeHoursStartOptions,
} from "@/lib/agents/office-hours";
import {
  AGENT_OFFICE_HOURS_END,
  AGENT_OFFICE_HOURS_START,
  AGENT_OFFICE_HOURS_TIME_OPTIONS,
} from "@/lib/constants/agents";

interface OfficeHoursRangeFieldProps {
  startValue: string;
  endValue: string;
  onStartChange: ComponentProps<"select">["onChange"];
  onEndChange: ComponentProps<"select">["onChange"];
  startSelectProps?: Omit<
    ComponentProps<typeof OfficeHoursSelect>,
    "options" | "placeholder" | "value" | "onChange"
  >;
  endSelectProps?: Omit<
    ComponentProps<typeof OfficeHoursSelect>,
    "options" | "placeholder" | "value" | "onChange"
  >;
  startOptions?: readonly string[];
  endOptions?: readonly string[];
  recommendedStart?: string;
  recommendedEnd?: string;
  onApplyRecommendedStart?: () => void;
  onApplyRecommendedEnd?: () => void;
}

export function OfficeHoursRangeField({
  startValue,
  endValue,
  onStartChange,
  onEndChange,
  startSelectProps,
  endSelectProps,
  startOptions = filterOfficeHoursStartOptions(
    endValue,
    AGENT_OFFICE_HOURS_TIME_OPTIONS,
  ),
  endOptions = filterOfficeHoursEndOptions(
    startValue,
    AGENT_OFFICE_HOURS_TIME_OPTIONS,
  ),
  recommendedStart = AGENT_OFFICE_HOURS_START,
  recommendedEnd = AGENT_OFFICE_HOURS_END,
  onApplyRecommendedStart,
  onApplyRecommendedEnd,
}: OfficeHoursRangeFieldProps) {
  return (
    <div className="flex items-start gap-2">
      <div className="flex-1 space-y-2">
        <OfficeHoursSelect
          options={startOptions}
          placeholder="Início"
          value={startValue}
          onChange={onStartChange}
          recommendedValue={recommendedStart}
          onApplyRecommended={onApplyRecommendedStart}
          {...startSelectProps}
        />
      </div>
      <div className="flex-1 space-y-2">
        <OfficeHoursSelect
          options={endOptions}
          placeholder="Fim"
          value={endValue}
          onChange={onEndChange}
          recommendedValue={recommendedEnd}
          onApplyRecommended={onApplyRecommendedEnd}
          {...endSelectProps}
        />
      </div>
    </div>
  );
}
