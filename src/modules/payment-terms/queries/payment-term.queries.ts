import { queryOptions } from "@tanstack/react-query";

import type { ListSearchFilters } from "@/lib/api/pagination";
import { fetchPaymentTerms } from "@/modules/payment-terms/api/client";

/**
 * `options()` is the cache key the shared `LookupPicker` builds its own
 * `useInfiniteQuery` from; its page loader is `fetchPaymentTerms`, passed
 * directly by the consumer. `list()`/`listQuery()` back the management table.
 */

export const paymentTermKeys = {
  /** Prefix for every payment term query; invalidating it refetches all of them. */
  all: ["payment-terms"] as const,
  options: () => [...paymentTermKeys.all, "options"] as const,
  list: (page: number, filters: ListSearchFilters = {}) =>
    [...paymentTermKeys.all, page, filters] as const,
};

export function paymentTermListQuery(
  page: number,
  filters: ListSearchFilters = {},
) {
  return queryOptions({
    queryKey: paymentTermKeys.list(page, filters),
    queryFn: ({ signal }) =>
      fetchPaymentTerms({ page, search: filters.search, signal }),
  });
}
