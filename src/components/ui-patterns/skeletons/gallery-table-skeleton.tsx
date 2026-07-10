import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const FILTER_KEYS = [
  "f-all",
  "f-account",
  "f-system",
  "f-used",
  "f-unused",
] as const;
const GALLERY_ROW_KEYS = [
  "g-0",
  "g-1",
  "g-2",
  "g-3",
  "g-4",
  "g-5",
  "g-6",
  "g-7",
] as const;

type GalleryTableSkeletonProps = {
  showFilterBar?: boolean;
};

export function GalleryTableSkeleton({
  showFilterBar = true,
}: GalleryTableSkeletonProps) {
  return (
    <div className="space-y-4">
      {showFilterBar ? (
        <div className="flex flex-wrap gap-1">
          {FILTER_KEYS.map((key) => (
            <Skeleton key={key} className="h-8 w-24 rounded-md" />
          ))}
        </div>
      ) : null}

      <Table container={false}>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-14">
              <Skeleton className="h-4 w-12" />
            </TableHead>
            <TableHead>
              <Skeleton className="h-4 w-12" />
            </TableHead>
            <TableHead className="hidden sm:table-cell">
              <Skeleton className="h-4 w-12" />
            </TableHead>
            <TableHead className="hidden md:table-cell">
              <Skeleton className="h-4 w-20" />
            </TableHead>
            <TableHead className="hidden lg:table-cell">
              <Skeleton className="h-4 w-8" />
            </TableHead>
            <TableHead className="w-20 text-right">
              <Skeleton className="ml-auto h-4 w-12" />
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {GALLERY_ROW_KEYS.map((key) => (
            <TableRow key={key}>
              <TableCell>
                <Skeleton className="size-10 rounded-md" />
              </TableCell>
              <TableCell className="max-w-[200px]">
                <Skeleton className="h-4 w-36 max-w-full" />
                <div className="mt-1 flex gap-1.5 sm:hidden">
                  <Skeleton className="h-4 w-14 rounded-full" />
                  <Skeleton className="h-3.5 w-20" />
                </div>
              </TableCell>
              <TableCell className="hidden sm:table-cell">
                <Skeleton className="h-5 w-14 rounded-full" />
              </TableCell>
              <TableCell className="hidden md:table-cell">
                <Skeleton className="h-4 w-24" />
              </TableCell>
              <TableCell className="hidden lg:table-cell">
                <Skeleton className="h-3.5 w-40 max-w-full" />
              </TableCell>
              <TableCell className="text-right">
                <Skeleton className="ml-auto size-8 rounded-md" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
