import { bffRequest } from "@/lib/api/bff-client";
import type { Paginated } from "@/lib/api/pagination";
import type { PurchaseRequest } from "@/modules/purchase-requests/models/purchase-request";
import { purchaserEndpoints } from "@/modules/purchaser/api/endpoints";

export interface ListPendingPurchaseRequestsParams {
  page?: number;
  pageSize?: number;
  /** Matches against request title and justification. */
  search?: string;
  priority?: string;
  /** A department id. */
  departments?: string;
  signal?: AbortSignal;
}

/**
 * Every request awaiting a purchaser's decision — pending status is fixed
 * upstream, not a filter this UI sends. Same response shape as
 * `fetchPurchaseRequests`, so the existing table renders it unchanged.
 */
export function fetchPendingPurchaseRequests({
  page,
  pageSize,
  search,
  priority,
  departments,
  signal,
}: ListPendingPurchaseRequestsParams = {}) {
  return bffRequest<Paginated<PurchaseRequest>>(purchaserEndpoints.list, {
    query: { page, pageSize, search, priority, departments },
    signal,
  });
}
