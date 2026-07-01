"use client";

import {
  ArrowDownward,
  ArrowUpward,
  UnfoldMore,
} from "@material-symbols-svg/react/rounded/w600";
import type { Column } from "@tanstack/react-table";
import type { ReactNode } from "react";

interface TableSortableHeaderProps<TData> {
  column: Column<TData>;
  children: ReactNode;
}

export function TableSortableHeader<TData>({
  column,
  children,
}: TableSortableHeaderProps<TData>) {
  const sorted = column.getIsSorted();
  return (
    <button
      type="button"
      className="group -ml-0.5 flex items-center gap-1"
      onClick={() => column.toggleSorting(sorted === "asc")}
    >
      {children}
      {sorted === "asc" ? (
        <ArrowUpward className="size-3.5 text-muted-foreground" />
      ) : sorted === "desc" ? (
        <ArrowDownward className="size-3.5 text-muted-foreground" />
      ) : (
        <UnfoldMore className="size-3.5 text-muted-foreground-light group-hover:text-muted-foreground transition-colors" />
      )}
    </button>
  );
}
