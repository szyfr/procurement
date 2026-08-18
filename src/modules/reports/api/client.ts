import { bffRequest } from "@/lib/api/bff-client";
import { reportEndpoints } from "@/modules/reports/api/endpoints";
import type { CanvassingComplianceReport } from "@/modules/reports/models/canvassing-compliance-report";
import type { DepartmentSpendingReport } from "@/modules/reports/models/department-spending-report";
import type { PrStatusCount } from "@/modules/reports/models/pr-cycle-report";
import type { PurchaserAssessmentRow } from "@/modules/reports/models/purchaser-assessment-report";
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

export interface CanvassingComplianceParams {
  startDate: string;
  endDate: string;
  signal?: AbortSignal;
}

export function fetchCanvassingCompliance({
  startDate,
  endDate,
  signal,
}: CanvassingComplianceParams) {
  return bffRequest<CanvassingComplianceReport>(
    reportEndpoints.canvassingCompliance,
    {
      query: { start_date: startDate, end_date: endDate },
      signal,
    },
  );
}

export interface PurchaserAssessmentParams {
  startDate: string;
  endDate: string;
  signal?: AbortSignal;
}

export function fetchPurchaserAssessment({
  startDate,
  endDate,
  signal,
}: PurchaserAssessmentParams) {
  return bffRequest<PurchaserAssessmentRow[]>(
    reportEndpoints.purchaserAssessment,
    {
      query: { start_date: startDate, end_date: endDate },
      signal,
    },
  );
}
