import { Skeleton } from "@/components/ui/skeleton";
import { Container } from "@/components/ui-patterns/container";
import { GalleryTableSkeleton } from "./gallery-table-skeleton";
import { PageHeaderSkeleton } from "./page-header-skeleton";

export function GalleryPageSkeleton() {
  return (
    <Container orientation="vertical" overflow="hidden">
      <PageHeaderSkeleton
        titleWidth="w-48"
        actions={
          <>
            <Skeleton className="h-10 w-40 rounded-lg" />
            <Skeleton className="h-10 w-36 rounded-lg" />
          </>
        }
      />
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <GalleryTableSkeleton />
      </div>
    </Container>
  );
}
