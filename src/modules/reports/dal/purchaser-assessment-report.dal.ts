import { serverFetch } from "@/lib/api/fetcher";
import type { PurchaserAssessmentRow } from "@/modules/reports/models/purchaser-assessment-report";

/**
 * Purchaser assessment from FastAPI. Server-side only, called from Route
 * Handlers — never from a component. The upstream response is handed back as it
 * arrived.
 *
 * `start_date` and `end_date` are required upstream and match on the request
 * item's own `created_at`; the end of the range is carried to the end of the
 * day by the backend.
 */

export interface PurchaserAssessmentQuery {
  startDate: string;
  endDate: string;
}

export function getPurchaserAssessment(
  query: PurchaserAssessmentQuery,
): Promise<PurchaserAssessmentRow[]> {
  // No trailing slash, same as department-spending: this controller registers
  // `""` rather than `"/"`, so the slashed path 404s.
  return serverFetch<PurchaserAssessmentRow[]>(
    "/reports/purchaser-assessment",
    {
      query: {
        start_date: query.startDate,
        end_date: query.endDate,
      },
    },
  );
}
