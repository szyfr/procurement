import { queryOptions } from "@tanstack/react-query";

import { fetchPendingPurchaseRequests } from "@/modules/purchaser/api/client";

export interface PendingPurchaseRequestFilters {
  search?: string;
  priority?: string;
  departments?: string;
}

export const purchaserKeys = {
  all: ["purchaser"] as const,
  pendingList: (page: number, filters: PendingPurchaseRequestFilters = {}) =>
    [...purchaserKeys.all, "pending", page, filters] as const,
};

export function pendingPurchaseRequestsQuery(
  page: number,
  filters: PendingPurchaseRequestFilters = {},
) {
  const { search, priority, departments } = filters;

  return queryOptions({
    queryKey: purchaserKeys.pendingList(page, filters),
    queryFn: ({ signal }) =>
      fetchPendingPurchaseRequests({
        page,
        search,
        priority,
        departments,
        signal,
      }),
  });
}
