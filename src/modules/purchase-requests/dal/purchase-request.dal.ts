import { ApiError } from "@/lib/api/errors";
import { serverFetch } from "@/lib/api/fetcher";
import { assertObjectId } from "@/lib/api/object-id";
import { clampPageSize, type Paginated } from "@/lib/api/pagination";
import { getCurrentUser } from "@/modules/auth/dal/auth.dal";
import { userId } from "@/modules/auth/models/session";
import { DEFAULT_PAGE_SIZE } from "@/modules/purchase-requests/constants";
import type {
  CreatePurchaseRequestDto,
  CreatePurchaseRequestInput,
  MarkPurchaseRequestDeliveredDto,
  ProcessPurchaseRequestItemDto,
  ProcessPurchaseRequestItemsDto,
  RecordPartialDeliveryDto,
  UpdatePurchaseRequestDto,
} from "@/modules/purchase-requests/dto";
import type {
  PurchaseRequest,
  PurchaseRequestDetail,
  PurchaseRequestStatus,
  PurchaseRequestWriteResult,
} from "@/modules/purchase-requests/models/purchase-request";

/**
 * Purchase request reads and writes against FastAPI. Server-side only, called
 * from Route Handlers — never from a component. Every read hands back the
 * upstream response as it arrived.
 */

const NOT_FOUND = "Purchase request not found";
const ITEM_NOT_FOUND = "Purchase request item not found";

export interface ListPurchaseRequestsQuery {
  page?: number;
  pageSize?: number;
  /** Matches against request title and justification. */
  search?: string;
  priority?: string;
  /** A department id. */
  departments?: string;
  /** Matches the backend's `pr_status` param. */
  status?: string[];
}

export function listPurchaseRequests(
  query: ListPurchaseRequestsQuery = {},
): Promise<Paginated<PurchaseRequest>> {
  return serverFetch<Paginated<PurchaseRequest>>("/purchase-requests", {
    query: {
      page: query.page ?? 1,
      page_size: clampPageSize(query.pageSize, DEFAULT_PAGE_SIZE),
      search: query.search,
      priority: query.priority,
      departments: query.departments,
      pr_status: query.status,
    },
  });
}

export async function getPurchaseRequest(
  id: string,
): Promise<PurchaseRequestDetail> {
  assertObjectId(id, NOT_FOUND);

  const request = await serverFetch<PurchaseRequestDetail | null>(
    `/purchase-requests/${id}`,
  );

  // `get_full_details` returns a bare `null` body when the aggregation misses.
  if (!request) {
    throw new ApiError(404, "not_found", NOT_FOUND);
  }

  return request;
}

export async function createPurchaseRequest(
  input: CreatePurchaseRequestInput,
): Promise<PurchaseRequestWriteResult> {
  // Supplied server-side from the session cookie; the browser never picks its
  // own requester. Also means an unauthenticated POST fails here with the
  // same 401 `getCurrentUser` throws for any other read.
  const requester = await getCurrentUser();

  const payload: CreatePurchaseRequestDto = {
    ...input,
    requester_id: userId(requester),
  };

  // The create response carries no material join, so its items name only ids.
  // Callers that need full items re-read the request by id.
  return serverFetch<PurchaseRequestWriteResult>("/purchase-requests", {
    method: "POST",
    body: payload,
  });
}

/**
 * Replaces the request, and with it every item: upstream deletes the existing
 * rows and recreates them from the payload, so an item's `_id` changes on each
 * save. Like create, the response is the written document without the detail
 * pipeline's joins.
 */
export function updatePurchaseRequest(
  id: string,
  input: UpdatePurchaseRequestDto,
): Promise<PurchaseRequestWriteResult> {
  assertObjectId(id, NOT_FOUND);

  return serverFetch<PurchaseRequestWriteResult>(`/purchase-requests/${id}`, {
    method: "PUT",
    body: input,
  });
}

/**
 * The dedicated status transition. Unlike a PUT carrying `status`, this also
 * writes the new status onto every item on the request, which is what makes it
 * the only correct way to submit a draft.
 *
 * Two backend quirks: the 204 comes back with a `{}` body (dropped by
 * `serverFetch`), and a missing request is reported as 400 rather than 404
 * because the controller catches its own `HTTPException`. `assertObjectId`
 * still turns a malformed id into a local 404 before the round trip.
 */
export async function updatePurchaseRequestStatus(
  id: string,
  status: PurchaseRequestStatus,
): Promise<void> {
  assertObjectId(id, NOT_FOUND);

  await serverFetch<null>(`/purchase-requests/${id}/status/${status}`, {
    method: "PATCH",
  });
}

/**
 * Approves or rejects one item. Upstream maps the decision onto a status
 * itself — `approved` to `po-created`, `rejected` to `rejected` — and, for an
 * approval, dispatches the job that creates the Business Central purchase
 * order.
 *
 * That dispatch is the whole point of this route now. `StatusService` used to
 * create the PO itself while assessing a newly submitted request; that code is
 * commented out upstream, so a directly-sourced item stays `pending` until
 * someone approves it here. Canvassed items still reach a PO through an award
 * instead.
 *
 * FastAPI answers 200 with a `{}` body, which `serverFetch` drops.
 */
export async function processPurchaseRequestItem(
  id: string,
  itemId: string,
  payload: ProcessPurchaseRequestItemDto,
): Promise<void> {
  assertObjectId(id, NOT_FOUND);
  assertObjectId(itemId, ITEM_NOT_FOUND);

  await serverFetch<null>(`/purchase-requests/${id}/items/${itemId}`, {
    method: "PATCH",
    body: payload,
  });
}

/**
 * The same decision across several items in one call. Upstream hangs it off
 * the collection path — `PATCH` where the item list is a `GET`.
 *
 * Upstream applies the statuses one item at a time and dispatches a single PO
 * job for the batch, so a partial failure leaves earlier items already
 * written — callers refetch rather than assuming the whole selection moved.
 * Like the single-item route, the 200 arrives with a `{}` body.
 */
export async function processPurchaseRequestItems(
  id: string,
  payload: ProcessPurchaseRequestItemsDto,
): Promise<void> {
  assertObjectId(id, NOT_FOUND);
  for (const itemId of payload.items) assertObjectId(itemId, ITEM_NOT_FOUND);

  await serverFetch<null>(`/purchase-requests/${id}/items`, {
    method: "PATCH",
    body: payload,
  });
}

/**
 * Bulk delivery. Stamps `delivered_at` on every item named in the payload and
 * moves it to `completed`; the item ids carry the work, and the request id in
 * the path is not read by the controller at all.
 *
 * The handler never dispatches `StatusVerificationJob`, so the parent request
 * keeps its current status even once every item on it is completed — a fully
 * delivered request still reads "PO Created" until something else recalculates
 * it.
 *
 * Like the status transition, the 204 arrives with a `{}` body that
 * `serverFetch` drops.
 */
export async function markPurchaseRequestDelivered(
  id: string,
  payload: MarkPurchaseRequestDeliveredDto,
): Promise<void> {
  assertObjectId(id, NOT_FOUND);

  await serverFetch<null>(`/purchase-requests/${id}/delivered`, {
    method: "PATCH",
    body: payload,
  });
}

/**
 * Records a partial delivery against one item: writes `partial_delivered` and
 * moves the item to `partially-completed`.
 *
 * Two things to know about what this does and doesn't do upstream:
 *
 * - The write is a `$set`, so the amount **replaces** whatever was there
 *   rather than accumulating. Recording 2 and then 3 leaves 3, not 5 — the
 *   caller sends the running total received, not an increment.
 * - Like `markPurchaseRequestDelivered`, it never dispatches
 *   `StatusVerificationJob`, so the parent request's own status does not move.
 *
 * FastAPI answers 200 with an empty body here rather than the 204 the delivery
 * routes use; the Route Handler normalizes that to a 204 either way.
 */
export async function recordPartialDelivery(
  id: string,
  itemId: string,
  payload: RecordPartialDeliveryDto,
): Promise<void> {
  assertObjectId(id, NOT_FOUND);
  assertObjectId(itemId, ITEM_NOT_FOUND);

  await serverFetch<null>(
    `/purchase-requests/${id}/items/${itemId}/partial-delivery`,
    { method: "PATCH", body: payload },
  );
}

export async function deletePurchaseRequest(id: string): Promise<void> {
  assertObjectId(id, NOT_FOUND);

  await serverFetch<null>(`/purchase-requests/${id}`, { method: "DELETE" });
}
