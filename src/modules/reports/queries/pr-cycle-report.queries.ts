import { queryOptions } from "@tanstack/react-query";
import { fetchPrStatusBreakdown } from "@/modules/reports/api/client";

export const prCycleKeys = {
  statusBreakdown: (startDate: string, endDate: string) =>
    ["reports", "pr-status-breakdown", startDate, endDate] as const,
};

export function prStatusBreakdownQuery(startDate: string, endDate: string) {
  return queryOptions({
    queryKey: prCycleKeys.statusBreakdown(startDate, endDate),
    queryFn: ({ signal }) =>
      fetchPrStatusBreakdown({ startDate, endDate, signal }),
  });
}
