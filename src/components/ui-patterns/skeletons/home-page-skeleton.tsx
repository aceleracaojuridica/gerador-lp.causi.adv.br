import { Container } from "@/components/ui-patterns/container";
import { LpCardSkeleton } from "./lp-card-skeleton";
import { PageHeaderSkeleton } from "./page-header-skeleton";

const LP_CARD_KEYS = ["lp-a", "lp-b", "lp-c", "lp-d", "lp-e", "lp-f"] as const;

export function HomePageSkeleton() {
  return (
    <Container orientation="vertical" overflow="hidden">
      <PageHeaderSkeleton titleWidth="w-52" showBadge actionCount={1} />
      <div className="flex flex-1 flex-wrap justify-center gap-3 overflow-y-auto p-4 sm:justify-start sm:gap-4 sm:p-6">
        {LP_CARD_KEYS.map((key) => (
          <LpCardSkeleton key={key} />
        ))}
      </div>
    </Container>
  );
}
