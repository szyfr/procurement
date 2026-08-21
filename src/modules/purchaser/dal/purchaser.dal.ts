import { serverFetch } from "@/lib/api/fetcher";
import { clampPageSize, type Paginated } from "@/lib/api/pagination";
import type { PurchaseRequest } from "@/modules/purchase-requests/models/purchase-request";
import { DEFAULT_PAGE_SIZE } from "@/modules/purchaser/constants";

/**
 * The purchaser's queue against FastAPI. Server-side only, called from Route
 * Handlers — never from a component.
 *
 * `GET /purchaser` is a separate endpoint from `GET /purchase-requests`, not a
 * filter on it: it is not scoped to `requester_id`, so it surfaces every
 * requester's pending request rather than only the caller's own, and it
 * further narrows to items still awaiting a vendor (`vendor_id: None`), so a
 * request whose lines already have one drops out even while `pending`. The
 * upstream response shape matches the list pipeline's, so it renders through
 * the same `PurchaseRequest` model and table.
 */

export interface ListPendingPurchaseRequestsQuery {
  page?: number;
  pageSize?: number;
  /** Matches against request title and justification. */
  search?: string;
  priority?: string;
  /** A department id. */
  departments?: string;
}

export function listPendingPurchaseRequests(
  query: ListPendingPurchaseRequestsQuery = {},
): Promise<Paginated<PurchaseRequest>> {
  return serverFetch<Paginated<PurchaseRequest>>("/purchaser", {
    query: {
      page: query.page ?? 1,
      page_size: clampPageSize(query.pageSize, DEFAULT_PAGE_SIZE),
      search: query.search,
      priority: query.priority,
      departments: query.departments,
    },
  });
}
