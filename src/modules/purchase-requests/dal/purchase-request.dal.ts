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
  UpdatePurchaseRequestDto,
} from "@/modules/purchase-requests/dto";
import type {
  PurchaseRequest,
  PurchaseRequestDetail,
  PurchaseRequestStatus,
} from "@/modules/purchase-requests/models/purchase-request";

/**
 * Purchase request reads and writes against FastAPI. Server-side only, called
 * from Route Handlers — never from a component. Every read hands back the
 * upstream response as it arrived.
 */

const NOT_FOUND = "Purchase request not found";

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
): Promise<PurchaseRequestDetail> {
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
  return serverFetch<PurchaseRequestDetail>("/purchase-requests", {
    method: "POST",
    body: payload,
  });
}

export function updatePurchaseRequest(
  id: string,
  input: UpdatePurchaseRequestDto,
): Promise<PurchaseRequestDetail> {
  assertObjectId(id, NOT_FOUND);

  return serverFetch<PurchaseRequestDetail>(`/purchase-requests/${id}`, {
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
 * Bulk delivery. Stamps `delivered_at` on every item named in the payload and
 * moves it to `completed`; the item ids carry the work, and the request id in
 * the path is not read by the controller at all.
 *
 * Two upstream caveats worth knowing before debugging a failure here:
 *
 * - The handler builds its model with `PurchaseRequestItemModel(get_db())` and
 *   declares no `Depends(get_db)`, unlike every other route in that file, so
 *   the un-awaited coroutine lands where the collection should be and the
 *   first write raises — surfacing as a 500. Until that is fixed upstream this
 *   call cannot succeed; nothing on this side can work around it.
 * - It never dispatches `StatusVerificationJob`, so the parent request keeps
 *   its current status even once every item is completed.
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

export async function deletePurchaseRequest(id: string): Promise<void> {
  assertObjectId(id, NOT_FOUND);

  await serverFetch<null>(`/purchase-requests/${id}`, { method: "DELETE" });
}
