import { queryOptions } from "@tanstack/react-query";

import {
  fetchCanvassingCompliance,
  fetchDepartmentSpending,
  fetchPrStatusBreakdown,
  fetchPurchaserAssessment,
  fetchVendorPerformance,
} from "@/modules/reports/api";

/** One key namespace for all five reports; each is keyed by its own range. */
export const reportKeys = {
  all: ["reports"] as const,
  vendorPerformance: (startDate: string, endDate: string, search: string) =>
    ["reports", "vendor-performance", startDate, endDate, search] as const,
  prStatusBreakdown: (startDate: string, endDate: string) =>
    ["reports", "pr-status-breakdown", startDate, endDate] as const,
  departmentSpending: (startDate: string, endDate: string) =>
    ["reports", "department-spending", startDate, endDate] as const,
  canvassingCompliance: (startDate: string, endDate: string) =>
    ["reports", "canvassing-compliance", startDate, endDate] as const,
  purchaserAssessment: (startDate: string, endDate: string) =>
    ["reports", "purchaser-assessment", startDate, endDate] as const,
};

export function vendorPerformanceQuery(
  startDate: string,
  endDate: string,
  search = "",
) {
  return queryOptions({
    queryKey: reportKeys.vendorPerformance(startDate, endDate, search),
    queryFn: ({ signal }) =>
      fetchVendorPerformance({
        startDate,
        endDate,
        search: search || undefined,
        signal,
      }),
  });
}

export function prStatusBreakdownQuery(startDate: string, endDate: string) {
  return queryOptions({
    queryKey: reportKeys.prStatusBreakdown(startDate, endDate),
    queryFn: ({ signal }) =>
      fetchPrStatusBreakdown({ startDate, endDate, signal }),
  });
}

export function departmentSpendingQuery(startDate: string, endDate: string) {
  return queryOptions({
    queryKey: reportKeys.departmentSpending(startDate, endDate),
    queryFn: ({ signal }) =>
      fetchDepartmentSpending({ startDate, endDate, signal }),
  });
}

export function canvassingComplianceQuery(startDate: string, endDate: string) {
  return queryOptions({
    queryKey: reportKeys.canvassingCompliance(startDate, endDate),
    queryFn: ({ signal }) =>
      fetchCanvassingCompliance({ startDate, endDate, signal }),
  });
}

export function purchaserAssessmentQuery(startDate: string, endDate: string) {
  return queryOptions({
    queryKey: reportKeys.purchaserAssessment(startDate, endDate),
    queryFn: ({ signal }) =>
      fetchPurchaserAssessment({ startDate, endDate, signal }),
  });
}
