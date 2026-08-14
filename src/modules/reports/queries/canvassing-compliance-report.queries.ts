import { queryOptions } from "@tanstack/react-query";
import { fetchCanvassingCompliance } from "@/modules/reports/api/client";

export const canvassingComplianceKeys = {
  report: (startDate: string, endDate: string) =>
    ["reports", "canvassing-compliance", startDate, endDate] as const,
};

export function canvassingComplianceQuery(startDate: string, endDate: string) {
  return queryOptions({
    queryKey: canvassingComplianceKeys.report(startDate, endDate),
    queryFn: ({ signal }) =>
      fetchCanvassingCompliance({ startDate, endDate, signal }),
  });
}
