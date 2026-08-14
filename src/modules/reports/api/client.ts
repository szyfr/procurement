import { bffRequest } from "@/lib/api/bff-client";
import { reportEndpoints } from "@/modules/reports/api/endpoints";
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
