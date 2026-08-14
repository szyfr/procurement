import { serverFetch } from "@/lib/api/fetcher";
import type { VendorPerformanceRow } from "@/modules/reports/models/vendor-report";

/**
 * The vendor performance report from FastAPI. Server-side only, called from
 * Route Handlers — never from a component. The upstream response is handed back
 * as it arrived.
 *
 * `start_date` and `end_date` are required upstream, and they match on the
 * vendor's own `created_at` rather than on delivery dates: the range decides
 * which vendors are evaluated, not which deliveries are counted.
 *
 * The response is a plain array — this report has no pagination envelope and no
 * total count.
 */

export interface VendorPerformanceQuery {
  startDate: string;
  endDate: string;
  /** Matched upstream as a case-insensitive regex on the vendor name alone. */
  search?: string;
}

export function getVendorPerformance(
  query: VendorPerformanceQuery,
): Promise<VendorPerformanceRow[]> {
  // Trailing slash on purpose: the controller registers `"/"` under the
  // `/reports/vendor` prefix, and the bare path answers with a 307.
  return serverFetch<VendorPerformanceRow[]>("/reports/vendor/", {
    query: {
      start_date: query.startDate,
      end_date: query.endDate,
      search: query.search,
    },
  });
}
