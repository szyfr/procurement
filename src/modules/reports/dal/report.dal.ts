import { serverFetch } from "@/lib/api/fetcher";
import type {
  CanvassingComplianceReport,
  DepartmentSpendingReport,
  PrStatusCount,
  PurchaserAssessmentRow,
  VendorPerformanceRow,
} from "@/modules/reports/models/report";

/**
 * The five report reads against FastAPI. Server-side only, called from Route
 * Handlers — never from a component. Each upstream response is handed back as
 * it arrived.
 *
 * `start_date` and `end_date` are required on every one of them; what the range
 * matches on differs per report and is noted below.
 *
 * The trailing slashes are not cosmetic. `/reports/vendor` and
 * `/reports/pr-cycle` register their route as `"/"` and answer the bare path
 * with a 307; the other three register `""` and 404 on the slashed path.
 */

export interface ReportRange {
  startDate: string;
  endDate: string;
}

/**
 * Matches on the vendor's own `created_at` rather than on delivery dates: the
 * range decides which vendors are evaluated, not which deliveries are counted.
 */
export function getVendorPerformance(
  range: ReportRange & {
    /** Matched upstream as a case-insensitive regex on the vendor name alone. */
    search?: string;
  },
): Promise<VendorPerformanceRow[]> {
  return serverFetch<VendorPerformanceRow[]>("/reports/vendor/", {
    query: {
      start_date: range.startDate,
      end_date: range.endDate,
      search: range.search,
    },
  });
}

/** Matches on the request's own `created_at`: the range decides which requests are counted. */
export function getPrStatusBreakdown(
  range: ReportRange,
): Promise<PrStatusCount[]> {
  return serverFetch<PrStatusCount[]>("/reports/pr-cycle/", {
    query: { start_date: range.startDate, end_date: range.endDate },
  });
}

/** Matches on the purchase request's own `created_at`. */
export function getDepartmentSpending(
  range: ReportRange,
): Promise<DepartmentSpendingReport> {
  return serverFetch<DepartmentSpendingReport>("/reports/department-spending", {
    query: { start_date: range.startDate, end_date: range.endDate },
  });
}

/** Matches on the purchase request's own `created_at`. */
export function getCanvassingCompliance(
  range: ReportRange,
): Promise<CanvassingComplianceReport> {
  return serverFetch<CanvassingComplianceReport>(
    "/reports/canvassing-compliance",
    { query: { start_date: range.startDate, end_date: range.endDate } },
  );
}

/**
 * Matches on the request item's own `created_at`; the end of the range is
 * carried to the end of the day by the backend.
 */
export function getPurchaserAssessment(
  range: ReportRange,
): Promise<PurchaserAssessmentRow[]> {
  return serverFetch<PurchaserAssessmentRow[]>(
    "/reports/purchaser-assessment",
    { query: { start_date: range.startDate, end_date: range.endDate } },
  );
}
