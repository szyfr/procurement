import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export interface KpiCardData {
  id: string;
  label: string;
  /** Resolved display value, or a static em-dash for metrics with no backend source. */
  value: number | string;
  isPending?: boolean;
}

export function KpiCards({ items }: { items: KpiCardData[] }) {
  return (
    <dl className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
      {items.map((item) => (
        <Card key={item.id}>
          <CardContent className="flex flex-col-reverse gap-2">
            <dd className="text-[26px] leading-none font-bold text-foreground tabular-nums">
              {item.isPending ? (
                <Skeleton className="h-[26px] w-12" />
              ) : (
                item.value
              )}
            </dd>
            <dt className="text-xs text-muted-foreground">{item.label}</dt>
          </CardContent>
        </Card>
      ))}
    </dl>
  );
}
