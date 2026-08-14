import { serverFetch } from "@/lib/api/fetcher";
import type { PrStatusCount } from "@/modules/reports/models/pr-cycle-report";

/**
 * The purchase request status breakdown from FastAPI. Server-side only, called
 * from Route Handlers — never from a component. The upstream response is handed
 * back as it arrived.
 *
 * `start_date` and `end_date` are required upstream and match on the request's
 * own `created_at`: the range decides which requests are counted.
 *
 * The response is a plain array with no pagination envelope — one entry per
 * status, always all of them.
 */

export interface PrStatusBreakdownQuery {
  startDate: string;
  endDate: string;
}

export function getPrStatusBreakdown(
  query: PrStatusBreakdownQuery,
): Promise<PrStatusCount[]> {
  // Trailing slash on purpose: the controller registers `"/"` under the
  // `/reports/pr-cycle` prefix, and the bare path answers with a 307.
  return serverFetch<PrStatusCount[]>("/reports/pr-cycle/", {
    query: {
      start_date: query.startDate,
      end_date: query.endDate,
    },
  });
}
