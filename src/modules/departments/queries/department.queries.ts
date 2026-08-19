import { queryOptions } from "@tanstack/react-query";

import type { ListSearchFilters } from "@/lib/api/pagination";
import { fetchDepartments } from "@/modules/departments/api/client";

export const departmentKeys = {
  /** Prefix for every department query; invalidating it refetches all of them. */
  all: ["departments"] as const,
  list: (page: number, filters: ListSearchFilters = {}) =>
    ["departments", page, filters] as const,
};

export function departmentListQuery(
  page: number,
  filters: ListSearchFilters = {},
) {
  return queryOptions({
    queryKey: departmentKeys.list(page, filters),
    queryFn: ({ signal }) =>
      fetchDepartments({ page, search: filters.search, signal }),
  });
}
