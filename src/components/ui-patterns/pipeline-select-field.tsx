"use client";

import { Badge } from "@/components/ui/badge";
import {
  SearchableSelect,
  SearchableSelectContent,
  SearchableSelectEmpty,
  SearchableSelectGroup,
  SearchableSelectItem,
  SearchableSelectTrigger,
} from "@/components/ui-patterns/searchable-select";
import { cn } from "@/lib/utils";

export type PipelineSelectOption = {
  id: number;
  name: string;
  deal_count: number | null;
};

interface PipelineSelectFieldProps {
  value?: number;
  onValueChange: (value: number) => void;
  pipelines: PipelineSelectOption[];
  invalid?: boolean;
  placeholder?: string;
}

/** Select de funil com busca e contagem de oportunidades — padrão oportunidades. */
export function PipelineSelectField({
  value,
  onValueChange,
  pipelines,
  invalid = false,
  placeholder = "Selecione um funil",
}: PipelineSelectFieldProps) {
  const selectedPipeline = pipelines.find((item) => item.id === value);

  return (
    <SearchableSelect
      value={value ? String(value) : ""}
      onValueChange={(nextValue) => onValueChange(Number(nextValue))}
    >
      <SearchableSelectTrigger
        className={cn(
          "w-full justify-between border-muted-foreground/20 font-normal hover:bg-transparent",
          invalid && "border-destructive focus-visible:ring-destructive",
          !value && "text-muted-foreground",
        )}
      >
        <span className="flex-1 truncate text-left">
          {selectedPipeline?.name ?? placeholder}
        </span>
      </SearchableSelectTrigger>
      <SearchableSelectContent
        searchPlaceholder="Pesquisar..."
        className="min-w-80"
      >
        <SearchableSelectEmpty>Nenhum funil encontrado.</SearchableSelectEmpty>
        <SearchableSelectGroup>
          {pipelines.map((pipeline) => (
            <SearchableSelectItem key={pipeline.id} value={String(pipeline.id)}>
              <div className="flex w-full items-center justify-between gap-2">
                <span className="truncate">{pipeline.name}</span>
                <Badge variant="secondary" className="shrink-0 font-medium">
                  {pipeline.deal_count ?? 0}
                </Badge>
              </div>
            </SearchableSelectItem>
          ))}
        </SearchableSelectGroup>
      </SearchableSelectContent>
    </SearchableSelect>
  );
}
