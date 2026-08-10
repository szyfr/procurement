import { StatusDot } from "@/components/shared/status-badge";
import {
  purchaseRequestStatusLegend,
  purchaseRequestTone,
} from "@/modules/purchase-requests";

export function StatusLegend() {
  return (
    <ul className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
      {purchaseRequestStatusLegend.map((entry) => (
        <li key={entry.status} className="flex items-center gap-1.5">
          <StatusDot tone={purchaseRequestTone[entry.status]} />
          {entry.label}
        </li>
      ))}
    </ul>
  );
}
