"use client";

import { Check, Close } from "@material-symbols-svg/react";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import FilterIcon from "../icons/filter-icon";

interface FunnelItem {
  id: number;
  name: string;
}

interface FunnelsSelectProps {
  items: FunnelItem[];
  selected: number[];
  onChange: (next: number[]) => void;
  ownedIds?: number[];
  className?: string;
}

export default function FunnelsSelect({
  items,
  selected,
  onChange,
  ownedIds,
  className,
}: FunnelsSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [localSelected, setLocalSelected] = React.useState<number[]>(selected);

  // Sync with prop when NOT open (e.g. initial load or external reset)
  React.useEffect(() => {
    if (!open) setLocalSelected(selected);
  }, [selected, open]);

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      // Only trigger change if the selection actually changed
      const isDifferent =
        localSelected.length !== selected.length ||
        localSelected.some((id) => !selected.includes(id));
      if (isDifferent) {
        onChange(localSelected);
      }
    }
  };

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? items.filter((i) => i.name.toLowerCase().includes(q)) : items;
  }, [items, query]);

  const handleToggle = (id: number) => {
    setLocalSelected((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  };

  return (
    <div className="flex items-center gap-2">
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "min-h-9 h-max flex flex-wrap items-center justify-start gap-2",
              className,
            )}
          >
            <div className="flex items-center gap-2 max-w-full">
              <FilterIcon className="h-6 w-6 text-primary inline-block" />
              <span className="text-md text-primary inline-block">Funis</span>
            </div>
            {localSelected.length === 0 && (
              <span className="text-muted-foreground text-sm">
                Selecionar funis
              </span>
            )}
            {localSelected.length > 0 && (
              <Badge className="flex items-center gap-1">
                {localSelected.length === items.length
                  ? "Todos selecionados"
                  : `${localSelected.length} selecionados`}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="min-w-[200px] p-2" align="start">
          <div className="space-y-2">
            <Input
              placeholder="Buscar funil..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <div className="max-h-64 overflow-auto">
              {filtered.length === 0 ? (
                <div className="text-sm text-muted-foreground px-2 py-6 text-center">
                  Nenhum funil encontrado
                </div>
              ) : (
                <ul className="space-y-1">
                  {filtered.map((f) => {
                    const isSelected = localSelected.includes(f.id);
                    const isOwned =
                      Array.isArray(ownedIds) && ownedIds.includes(f.id);
                    return (
                      <li key={f.id}>
                        <button
                          type="button"
                          className={cn(
                            "w-full flex items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-muted",
                            isSelected && "bg-muted",
                          )}
                          onClick={() => handleToggle(f.id)}
                        >
                          <span className="flex items-center gap-2">
                            {isOwned ? (
                              <span
                                aria-hidden
                                className="inline-block h-2 w-2 rounded-full bg-primary"
                              />
                            ) : null}
                            {f.name}
                          </span>
                          {isSelected && (
                            <Check
                              className="text-muted-foreground"
                              size={14}
                            />
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {localSelected.length > 0 && (
        <Button
          size="icon-sm"
          className="transition-transform rounded-full scale-95 hover:scale-100 active:scale-95"
          onClick={(e) => {
            e.stopPropagation();
            setLocalSelected([]);
            onChange([]);
          }}
        >
          <Close size={12} className="pointer-events-none" />
        </Button>
      )}
    </div>
  );
}
