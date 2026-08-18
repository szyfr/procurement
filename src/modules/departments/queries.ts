import { queryOptions } from "@tanstack/react-query";

import { fetchDepartments } from "@/modules/departments/api";

export const departmentKeys = {
  /** Prefix for every department query; invalidating it refetches all of them. */
  all: ["departments"] as const,
  list: (page: number) => ["departments", page] as const,
};

export function departmentListQuery(page: number) {
  return queryOptions({
    queryKey: departmentKeys.list(page),
    queryFn: ({ signal }) => fetchDepartments({ page, signal }),
  });
}
