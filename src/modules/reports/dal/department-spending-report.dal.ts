import { serverFetch } from "@/lib/api/fetcher";
import type { DepartmentSpendingReport } from "@/modules/reports/models/department-spending-report";

/**
 * Department spend from FastAPI. Server-side only, called from Route Handlers —
 * never from a component. The upstream response is handed back as it arrived.
 *
 * `start_date` and `end_date` are required upstream and match on the purchase
 * request's own `created_at`.
 */

export interface DepartmentSpendingQuery {
  startDate: string;
  endDate: string;
}

export function getDepartmentSpending(
  query: DepartmentSpendingQuery,
): Promise<DepartmentSpendingReport> {
  // No trailing slash here, unlike the vendor and pr-cycle reports: this
  // controller registers `""` rather than `"/"`, so the slashed path 404s.
  return serverFetch<DepartmentSpendingReport>("/reports/department-spending", {
    query: {
      start_date: query.startDate,
      end_date: query.endDate,
    },
  });
}
