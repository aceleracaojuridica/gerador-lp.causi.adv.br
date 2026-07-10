import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

const CONTATOS_ROW_KEYS = [
  "c-0",
  "c-1",
  "c-2",
  "c-3",
  "c-4",
  "c-5",
  "c-6",
  "c-7",
  "c-8",
  "c-9",
] as const;

export function ContatosTableSkeleton() {
  return (
    <Table container={false}>
      <TableHeader>
        <TableRow className="hover:bg-transparent [&_th:first-child]:pl-4 md:[&_th:first-child]:pl-7 [&_th:last-child]:pr-4 md:[&_th:last-child]:pr-7">
          <TableHead className="w-12">
            <Skeleton className="h-4 w-4" />
          </TableHead>
          <TableHead>
            <Skeleton className="h-4 w-12" />
          </TableHead>
          <TableHead>
            <Skeleton className="h-4 w-16" />
          </TableHead>
          <TableHead>
            <Skeleton className="h-4 w-12" />
          </TableHead>
          <TableHead>
            <Skeleton className="h-4 w-10" />
          </TableHead>
          <TableHead className="w-24 text-right">
            <Skeleton className="ml-auto h-4 w-12" />
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {CONTATOS_ROW_KEYS.map((key, index) => (
          <TableRow
            key={key}
            className={cn(
              "border-b [&_td:first-child]:pl-4 md:[&_td:first-child]:pl-7 [&_td:last-child]:pr-4 md:[&_td:last-child]:pr-7",
              index % 2 === 0
                ? "bg-background"
                : "bg-muted/40 dark:bg-muted/20",
            )}
          >
            <TableCell>
              <Skeleton className="h-4 w-4" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-28" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-24" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-32 max-w-full" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-28" />
            </TableCell>
            <TableCell>
              <div className="flex items-center justify-end gap-1">
                <Skeleton className="size-8 rounded-md" />
                <Skeleton className="size-8 rounded-md" />
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
