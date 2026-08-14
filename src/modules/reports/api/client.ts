import { bffRequest } from "@/lib/api/bff-client";
import { reportEndpoints } from "@/modules/reports/api/endpoints";
import type { DepartmentSpendingReport } from "@/modules/reports/models/department-spending-report";
import type { PrStatusCount } from "@/modules/reports/models/pr-cycle-report";
import type { VendorPerformanceRow } from "@/modules/reports/models/vendor-report";

export interface VendorPerformanceParams {
  startDate: string;
  endDate: string;
  /** Vendor name; matched upstream as a case-insensitive substring. */
  search?: string;
  signal?: AbortSignal;
}

export function fetchVendorPerformance({
  startDate,
  endDate,
  search,
  signal,
}: VendorPerformanceParams) {
  return bffRequest<VendorPerformanceRow[]>(reportEndpoints.vendorPerformance, {
    query: { start_date: startDate, end_date: endDate, search },
    signal,
  });
}

export interface PrStatusBreakdownParams {
  startDate: string;
  endDate: string;
  signal?: AbortSignal;
}

export function fetchPrStatusBreakdown({
  startDate,
  endDate,
  signal,
}: PrStatusBreakdownParams) {
  return bffRequest<PrStatusCount[]>(reportEndpoints.prCycle, {
    query: { start_date: startDate, end_date: endDate },
    signal,
  });
}

export interface DepartmentSpendingParams {
  startDate: string;
  endDate: string;
  signal?: AbortSignal;
}

export function fetchDepartmentSpending({
  startDate,
  endDate,
  signal,
}: DepartmentSpendingParams) {
  return bffRequest<DepartmentSpendingReport>(
    reportEndpoints.departmentSpending,
    {
      query: { start_date: startDate, end_date: endDate },
      signal,
    },
  );
}
