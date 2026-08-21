import { bffRequest } from "@/lib/api/bff-client";
import type { Paginated } from "@/lib/api/pagination";
import type { Department } from "@/modules/departments";
import { purchaseRequestEndpoints } from "@/modules/purchase-requests/api/endpoints";
import {
  buildPurchaseRequestProofForm,
  type CreatePurchaseRequestInput,
  type CreatePurchaseRequestProofInput,
  type MarkPurchaseRequestDeliveredDto,
  type ProcessPurchaseRequestItemDto,
  type ProcessPurchaseRequestItemsDto,
  type RecordPartialDeliveryDto,
  type UpdatePurchaseRequestDto,
} from "@/modules/purchase-requests/dto";
import type { Material } from "@/modules/purchase-requests/models/material";
import type {
  PurchaseRequest,
  PurchaseRequestDetail,
  PurchaseRequestWriteResult,
  SettablePurchaseRequestStatus,
} from "@/modules/purchase-requests/models/purchase-request";
import type {
  PurchaseRequestProof,
  PurchaseRequestProofDetail,
} from "@/modules/purchase-requests/models/purchase-request-proof";
import type { Vendor } from "@/modules/vendors";

export interface ListPurchaseRequestsParams {
  page?: number;
  pageSize?: number;
  /** Matches against request title and justification. */
  search?: string;
  priority?: string;
  /** A department id. */
  departments?: string;
  /** Repeats the query key, e.g. `status=pending&status=canvassing`. */
  status?: string[];
  signal?: AbortSignal;
}

export function fetchPurchaseRequests({
  page,
  pageSize,
  search,
  priority,
  departments,
  status,
  signal,
}: ListPurchaseRequestsParams = {}) {
  return bffRequest<Paginated<PurchaseRequest>>(purchaseRequestEndpoints.list, {
    query: { page, pageSize, search, priority, departments, status },
    signal,
  });
}

export function fetchPurchaseRequest(id: string, signal?: AbortSignal) {
  return bffRequest<PurchaseRequestDetail>(
    purchaseRequestEndpoints.detail(id),
    { signal },
  );
}

export function createPurchaseRequest(payload: CreatePurchaseRequestInput) {
  return bffRequest<PurchaseRequestWriteResult>(
    purchaseRequestEndpoints.create,
    { method: "POST", body: payload },
  );
}

export function updatePurchaseRequest(
  id: string,
  payload: UpdatePurchaseRequestDto,
) {
  return bffRequest<PurchaseRequestWriteResult>(
    purchaseRequestEndpoints.detail(id),
    { method: "PUT", body: payload },
  );
}

/**
 * Submitting for approval (`pending`), cancelling (`canceled`) and closing a
 * fully delivered request out (`completed`) are the same transition endpoint
 * with a different segment. Deliberately not folded into
 * `updatePurchaseRequest`: this also cascades the new status onto the request's
 * items, which a plain PUT does not do. Returns nothing — callers refetch.
 */
export function setPurchaseRequestStatus(
  id: string,
  status: SettablePurchaseRequestStatus,
) {
  return bffRequest<void>(purchaseRequestEndpoints.status(id, status), {
    method: "PATCH",
  });
}

/**
 * Records delivery against the items named in the payload: each is stamped
 * with `delivered_at` and moved to `completed`. One call covers the whole
 * selection — the date is per batch, not per item. Returns nothing; callers
 * refetch, and the request's own status does not move (see the DAL).
 */
export function markPurchaseRequestDelivered(
  id: string,
  payload: MarkPurchaseRequestDeliveredDto,
) {
  return bffRequest<void>(purchaseRequestEndpoints.delivered(id), {
    method: "PATCH",
    body: payload,
  });
}

/**
 * Records how much of a single item arrived. Per item and per call — unlike
 * `markPurchaseRequestDelivered`, the amount is specific to one line, so there
 * is no bulk form of this. Returns nothing; callers refetch.
 */
export function recordPartialDelivery(
  id: string,
  itemId: string,
  payload: RecordPartialDeliveryDto,
) {
  return bffRequest<void>(
    purchaseRequestEndpoints.partialDelivery(id, itemId),
    { method: "PATCH", body: payload },
  );
}

/**
 * Approves or rejects one submitted item. Approving is what creates the
 * purchase order: the backend dispatches its PO job from here, and since
 * `StatusService` stopped creating one on submit this is the only way a
 * directly-sourced item reaches `po-created`. Neither decision can be walked
 * back from this UI.
 *
 * Returns nothing; callers refetch.
 */
export function processPurchaseRequestItem(
  id: string,
  itemId: string,
  payload: ProcessPurchaseRequestItemDto,
) {
  return bffRequest<void>(purchaseRequestEndpoints.item(id, itemId), {
    method: "PATCH",
    body: payload,
  });
}

/**
 * The same decision across a selection, in one call — the whole selection
 * approves or rejects together, so a mixed outcome is two calls.
 *
 * Deliberately not folded into `processPurchaseRequestItem`: upstream gates
 * this route on `purchase_request_item.mass-process` and the single-item one on
 * `purchase_request_item.process`, so a caller can hold one grant and not the
 * other. Returns nothing; callers refetch.
 */
export function processPurchaseRequestItems(
  id: string,
  payload: ProcessPurchaseRequestItemsDto,
) {
  return bffRequest<void>(purchaseRequestEndpoints.items(id), {
    method: "PATCH",
    body: payload,
  });
}

/**
 * One proof record covers every item id passed in — a single vendor
 * confirmation for a whole vendor group, not one call per item.
 */
export function createPurchaseRequestProof(
  payload: CreatePurchaseRequestProofInput,
  attachments: File[] = [],
) {
  const form = buildPurchaseRequestProofForm(payload, attachments);

  return bffRequest<PurchaseRequestProof>(purchaseRequestEndpoints.proofs, {
    method: "POST",
    body: form,
  });
}

export function fetchPurchaseRequestProof(id: string, signal?: AbortSignal) {
  return bffRequest<PurchaseRequestProofDetail>(
    purchaseRequestEndpoints.proofDetail(id),
    { signal },
  );
}

export interface LookupParams {
  page?: number;
  pageSize?: number;
  search?: string;
  signal?: AbortSignal;
}

export function fetchDepartmentOptions({
  page,
  pageSize,
  signal,
}: LookupParams = {}) {
  return bffRequest<Paginated<Department>>(
    purchaseRequestEndpoints.departments,
    { query: { page, pageSize }, signal },
  );
}

export function fetchMaterialOptions({
  page,
  pageSize,
  search,
  signal,
}: LookupParams = {}) {
  return bffRequest<Paginated<Material>>(purchaseRequestEndpoints.materials, {
    query: { page, pageSize, search },
    signal,
  });
}

export function fetchVendorOptions({
  page,
  pageSize,
  search,
  signal,
}: LookupParams = {}) {
  return bffRequest<Paginated<Vendor>>(purchaseRequestEndpoints.vendors, {
    query: { page, pageSize, search },
    signal,
  });
}
