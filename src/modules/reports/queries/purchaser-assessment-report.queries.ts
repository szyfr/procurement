import { queryOptions } from "@tanstack/react-query";
import { fetchPurchaserAssessment } from "@/modules/reports/api/client";

export const purchaserAssessmentKeys = {
  report: (startDate: string, endDate: string) =>
    ["reports", "purchaser-assessment", startDate, endDate] as const,
};

export function purchaserAssessmentQuery(startDate: string, endDate: string) {
  return queryOptions({
    queryKey: purchaserAssessmentKeys.report(startDate, endDate),
    queryFn: ({ signal }) =>
      fetchPurchaserAssessment({ startDate, endDate, signal }),
  });
}
