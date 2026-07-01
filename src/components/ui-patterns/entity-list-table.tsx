"use client";

import { flexRender, type Table as TanstackTable } from "@tanstack/react-table";
import type { ReactNode } from "react";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getPageNumbers } from "@/lib/pagination";

interface EntityListTableProps<TData> {
  table: TanstackTable<TData>;
  renderBody: () => ReactNode;
  isLoading?: boolean;
  fillHeight?: boolean;
}

interface EntityListTablePaginationProps {
  currentPage: number;
  pageCount: number;
  isLoading?: boolean;
  onPageChange: (page: number) => void;
}

type EntityColumnMeta = {
  headerClassName?: string;
};

export function EntityListTable<TData>({
  table,
  renderBody,
  isLoading = false,
  fillHeight = false,
}: EntityListTableProps<TData>) {
  return (
    <Table className={fillHeight ? "h-full" : undefined} container={false}>
      <TableHeader
        className={`sticky top-0 ${fillHeight || isLoading ? "pointer-events-none" : ""}`}
      >
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow
            key={headerGroup.id}
            className="[&_th:first-child]:pl-4 md:[&_th:first-child]:pl-7 [&_th:last-child]:pr-4 md:[&_th:last-child]:pr-7 [&_th]:h-11"
          >
            {headerGroup.headers.map((header) => (
              <TableHead
                key={header.id}
                className={
                  (header.column.columnDef.meta as EntityColumnMeta | undefined)
                    ?.headerClassName
                }
              >
                {header.isPlaceholder
                  ? null
                  : flexRender(
                      header.column.columnDef.header,
                      header.getContext(),
                    )}
              </TableHead>
            ))}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody className={isLoading ? "skeleton-ui-fade" : ""}>
        {renderBody()}
      </TableBody>
    </Table>
  );
}

export function EntityListTablePagination({
  currentPage,
  pageCount,
  isLoading = false,
  onPageChange,
}: EntityListTablePaginationProps) {
  if (pageCount <= 1 || isLoading) {
    return null;
  }

  const pageNumbers = getPageNumbers(currentPage, pageCount);

  return (
    <Pagination className="py-2 px-4 md:px-7 border-t justify-start shrink-0">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href="#"
            aria-disabled={currentPage === 0}
            className={
              currentPage === 0 ? "pointer-events-none opacity-50" : ""
            }
            onClick={(e) => {
              e.preventDefault();
              if (currentPage > 0) onPageChange(currentPage - 1);
            }}
          />
        </PaginationItem>

        {pageNumbers.map((page, idx) =>
          page === "ellipsis" ? (
            // biome-ignore lint/suspicious/noArrayIndexKey: ellipsis items have no stable identity
            <PaginationItem key={`ellipsis-${idx}`}>
              <PaginationEllipsis />
            </PaginationItem>
          ) : (
            <PaginationItem key={page}>
              <PaginationLink
                href="#"
                isActive={page === currentPage}
                onClick={(e) => {
                  e.preventDefault();
                  onPageChange(page);
                }}
              >
                {page + 1}
              </PaginationLink>
            </PaginationItem>
          ),
        )}

        <PaginationItem>
          <PaginationNext
            href="#"
            aria-disabled={currentPage >= pageCount - 1}
            className={
              currentPage >= pageCount - 1
                ? "pointer-events-none opacity-50"
                : ""
            }
            onClick={(e) => {
              e.preventDefault();
              if (currentPage < pageCount - 1) onPageChange(currentPage + 1);
            }}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
