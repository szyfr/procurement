import { queryOptions } from "@tanstack/react-query";

import { fetchPaymentTerms } from "@/modules/payment-terms/api";

/**
 * `options()` is the cache key the shared `LookupPicker` builds its own
 * `useInfiniteQuery` from; its page loader is `fetchPaymentTerms`, passed
 * directly by the consumer. `list()`/`listQuery()` back the management table.
 */

export const paymentTermKeys = {
  /** Prefix for every payment term query; invalidating it refetches all of them. */
  all: ["payment-terms"] as const,
  options: () => [...paymentTermKeys.all, "options"] as const,
  list: (page: number) => [...paymentTermKeys.all, page] as const,
};

export function paymentTermListQuery(page: number) {
  return queryOptions({
    queryKey: paymentTermKeys.list(page),
    queryFn: ({ signal }) => fetchPaymentTerms({ page, signal }),
  });
}
