import { queryOptions } from "@tanstack/react-query";
import { fetchVendorPerformance } from "@/modules/reports/api/client";

export const reportKeys = {
  vendorPerformance: (startDate: string, endDate: string, search: string) =>
    ["reports", "vendor-performance", startDate, endDate, search] as const,
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
