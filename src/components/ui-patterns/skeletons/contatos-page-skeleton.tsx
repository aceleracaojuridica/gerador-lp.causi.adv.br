import { Skeleton } from "@/components/ui/skeleton";
import {
  Container,
  ContainerSection,
} from "@/components/ui-patterns/container";
import { ContatosTableSkeleton } from "./contatos-table-skeleton";
import { PageHeaderSkeleton } from "./page-header-skeleton";

export function ContatosPageSkeleton() {
  return (
    <Container orientation="vertical" overflow="hidden">
      <PageHeaderSkeleton
        titleWidth="w-28"
        showBadge
        actions={
          <>
            <Skeleton className="h-10 w-56 rounded-lg" />
            <Skeleton className="size-10 rounded-lg" />
            <Skeleton className="h-10 w-28 rounded-lg" />
          </>
        }
      />
      <ContainerSection grow overflow="hidden" className="min-h-0">
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden border border-border">
          <div className="flex-1 overflow-y-auto">
            <ContatosTableSkeleton />
          </div>
        </div>
      </ContainerSection>
    </Container>
  );
}
