import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatShortDate } from "@/lib/date";
import type { PurchaseRequestDetail } from "@/modules/purchase-requests";

export function PurchaseRequestDetailsPanel({
  request,
}: {
  request: PurchaseRequestDetail;
}) {
  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>Details</CardTitle>
      </CardHeader>
      <CardContent className="px-0">
        <dl className="divide-y text-xs">
          <div className="flex items-center justify-between gap-2 px-4 py-2.5">
            <dt className="text-muted-foreground">Requester</dt>
            <dd>{request.requester_name || "—"}</dd>
          </div>
          <div className="flex items-center justify-between gap-2 px-4 py-2.5">
            <dt className="text-muted-foreground">Department</dt>
            <dd>{request.department?.title || "—"}</dd>
          </div>
          <div className="flex items-center justify-between gap-2 px-4 py-2.5">
            <dt className="text-muted-foreground">Date needed</dt>
            <dd>{formatShortDate(request.date_needed) ?? "—"}</dd>
          </div>
          <div className="flex items-center justify-between gap-2 px-4 py-2.5">
            <dt className="text-muted-foreground">Created</dt>
            <dd>{formatShortDate(request.created_at) ?? "—"}</dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}
