import { queryOptions } from "@tanstack/react-query";
import { fetchDepartmentSpending } from "@/modules/reports/api/client";

export const departmentSpendingKeys = {
  report: (startDate: string, endDate: string) =>
    ["reports", "department-spending", startDate, endDate] as const,
};

export function departmentSpendingQuery(startDate: string, endDate: string) {
  return queryOptions({
    queryKey: departmentSpendingKeys.report(startDate, endDate),
    queryFn: ({ signal }) =>
      fetchDepartmentSpending({ startDate, endDate, signal }),
  });
}
