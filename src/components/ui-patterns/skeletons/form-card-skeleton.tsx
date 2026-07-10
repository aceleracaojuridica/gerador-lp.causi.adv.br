import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { FieldRowSkeleton } from "./field-row-skeleton";

const FORM_ROW_KEYS = ["row-a", "row-b", "row-c", "row-d", "row-e"] as const;

type FormCardSkeletonProps = {
  rowCount?: number;
};

export function FormCardSkeleton({ rowCount = 3 }: FormCardSkeletonProps) {
  return (
    <Card>
      <CardHeader className="border-b">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-3.5 w-64 max-w-full" />
      </CardHeader>
      <CardContent className="flex flex-col gap-5 pt-6">
        {FORM_ROW_KEYS.slice(0, rowCount).map((key, index) => (
          <FieldRowSkeleton key={key} borderless={index === rowCount - 1} />
        ))}
      </CardContent>
    </Card>
  );
}
