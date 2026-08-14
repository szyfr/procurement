import { serverFetch } from "@/lib/api/fetcher";
import type { CanvassingComplianceRow } from "@/modules/reports/models/canvassing-compliance-report";

/**
 * Canvassing compliance from FastAPI. Server-side only, called from Route
 * Handlers — never from a component. The upstream response is handed back as it
 * arrived.
 *
 * `start_date` and `end_date` are required upstream and match on the purchase
 * request's own `created_at`.
 */

export interface CanvassingComplianceQuery {
  startDate: string;
  endDate: string;
}

export function getCanvassingCompliance(
  query: CanvassingComplianceQuery,
): Promise<CanvassingComplianceRow[]> {
  // No trailing slash, same as department-spending: this controller registers
  // `""` rather than `"/"`, so the slashed path 404s.
  return serverFetch<CanvassingComplianceRow[]>(
    "/reports/canvassing-compliance",
    {
      query: {
        start_date: query.startDate,
        end_date: query.endDate,
      },
    },
  );
}
