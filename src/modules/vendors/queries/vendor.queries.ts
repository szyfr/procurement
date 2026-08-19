import { queryOptions } from "@tanstack/react-query";

import type { ListSearchFilters } from "@/lib/api/pagination";
import { fetchVendors } from "@/modules/vendors/api/client";

export const vendorKeys = {
  list: (page: number, filters: ListSearchFilters = {}) =>
    ["vendors", page, filters] as const,
};

export function vendorListQuery(page: number, filters: ListSearchFilters = {}) {
  return queryOptions({
    queryKey: vendorKeys.list(page, filters),
    // TanStack supplies an AbortSignal that it aborts when the query is
    // cancelled, which is what unmount/page-change used to do by hand.
    queryFn: ({ signal }) =>
      fetchVendors({ page, search: filters.search, signal }),
  });
}
