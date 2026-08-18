import { bffRequest } from "@/lib/api/bff-client";
import type {
  CanvassingComplianceReport,
  DepartmentSpendingReport,
  PrStatusCount,
  PurchaserAssessmentRow,
  VendorPerformanceRow,
} from "@/modules/reports/models/report";

const BASE = "/api/reports";

/** Every report is scoped by the same required date range. */
export interface ReportRangeParams {
  startDate: string;
  endDate: string;
  signal?: AbortSignal;
}

function reportRangeQuery({ startDate, endDate }: ReportRangeParams) {
  return { start_date: startDate, end_date: endDate };
}

export function fetchVendorPerformance({
  search,
  ...params
}: ReportRangeParams & {
  /** Vendor name; matched upstream as a case-insensitive substring. */
  search?: string;
}) {
  return bffRequest<VendorPerformanceRow[]>(`${BASE}/vendor`, {
    query: { ...reportRangeQuery(params), search },
    signal: params.signal,
  });
}

export function fetchPrStatusBreakdown(params: ReportRangeParams) {
  return bffRequest<PrStatusCount[]>(`${BASE}/pr-cycle`, {
    query: reportRangeQuery(params),
    signal: params.signal,
  });
}

export function fetchDepartmentSpending(params: ReportRangeParams) {
  return bffRequest<DepartmentSpendingReport>(`${BASE}/department-spending`, {
    query: reportRangeQuery(params),
    signal: params.signal,
  });
}

export function fetchCanvassingCompliance(params: ReportRangeParams) {
  return bffRequest<CanvassingComplianceReport>(
    `${BASE}/canvassing-compliance`,
    { query: reportRangeQuery(params), signal: params.signal },
  );
}

export function fetchPurchaserAssessment(params: ReportRangeParams) {
  return bffRequest<PurchaserAssessmentRow[]>(`${BASE}/purchaser-assessment`, {
    query: reportRangeQuery(params),
    signal: params.signal,
  });
}
