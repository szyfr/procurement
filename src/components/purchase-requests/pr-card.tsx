import Link from "next/link";

import { PriorityBadge } from "@/components/shared/priority-badge";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatShortDate } from "@/lib/date";
import { cn } from "@/lib/utils";
import {
  type PurchaseRequest,
  purchaseRequestStatusLabels,
  purchaseRequestTone,
} from "@/modules/purchase-requests";

/** Left accent stripe echoes the status colour, as in the wireframe. */
const accentClasses: Record<string, string> = {
  neutral: "border-l-status-neutral",
  info: "border-l-status-info",
  ordered: "border-l-status-ordered",
  partial: "border-l-status-partial",
  success: "border-l-status-success",
  warning: "border-l-status-warning",
  danger: "border-l-status-danger",
};

/**
 * The follow-up action a request is waiting on, if any. Drives the button at
 * the foot of the card.
 */
function nextAction(request: PurchaseRequest) {
  if (
    request.status === "po-created" ||
    request.status === "partially-completed"
  ) {
    return {
      label: "Add Proof of Order & Confirm Delivery",
      href: `/purchase-requests/${request._id}`,
    };
  }
  if (request.status === "canvassing") {
    return {
      label: "Manage Canvassing",
      href: `/purchase-requests/${request._id}/canvassing`,
    };
  }
  return null;
}

export function PurchaseRequestCard({ request }: { request: PurchaseRequest }) {
  const tone = purchaseRequestTone[request.status];
  const action = nextAction(request);
  const href = `/purchase-requests/${request._id}`;
  // Either join can miss; the line collapses rather than showing a gap.
  const meta = [request.requester_name, request.department_name].filter(
    Boolean,
  );

  return (
    <Card
      className={cn(
        "border-l-2 transition-colors hover:border-foreground/20",
        accentClasses[tone],
      )}
    >
      <CardContent className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <Link
            href={href}
            className="font-mono text-[13.5px] font-semibold hover:underline"
          >
            {request.no}
          </Link>
          <PriorityBadge priority={request.priority} />
        </div>

        {request.title ? (
          <p className="text-xs text-muted-foreground">{request.title}</p>
        ) : (
          <p className="text-xs text-muted-foreground italic">Untitled</p>
        )}

        {meta.length > 0 ? (
          <p className="text-[12.5px] text-muted-foreground">
            {meta.join(" · ")}
          </p>
        ) : null}
        {/* No amount is stored on a request and materials sync without a
            cost, so there is nothing to total. */}
        <p className="font-semibold tabular-nums">
          <span
            className="text-muted-foreground"
            title="No estimated amount on file"
          >
            —
          </span>
        </p>

        <div className="flex items-center justify-between gap-2">
          <StatusBadge tone={tone}>
            {purchaseRequestStatusLabels[request.status]}
          </StatusBadge>
          <span className="shrink-0 text-xs text-muted-foreground">
            {formatShortDate(request.created_at) ?? "Not submitted"}
          </span>
        </div>

        {action ? (
          <Button
            variant="outline"
            size="sm"
            className="mt-1 w-full"
            render={<Link href={action.href} />}
            nativeButton={false}
          >
            {action.label}
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
