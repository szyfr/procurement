import { queryOptions } from "@tanstack/react-query";

import { fetchVendors } from "@/modules/vendors/api";

export const vendorKeys = {
  list: (page: number) => ["vendors", page] as const,
};

export function vendorListQuery(page: number) {
  return queryOptions({
    queryKey: vendorKeys.list(page),
    // TanStack supplies an AbortSignal that it aborts when the query is
    // cancelled, which is what unmount/page-change used to do by hand.
    queryFn: ({ signal }) => fetchVendors({ page, signal }),
  });
}
