import { bffRequest } from "@/lib/api/bff-client";
import type { Paginated } from "@/lib/api/pagination";
import type { Department } from "@/modules/departments";
import { purchaseRequestEndpoints } from "@/modules/purchase-requests/api/endpoints";
import {
  buildPurchaseRequestProofForm,
  type CreatePurchaseRequestInput,
  type CreatePurchaseRequestProofDto,
  type UpdatePurchaseRequestDto,
} from "@/modules/purchase-requests/dto";
import type { Material } from "@/modules/purchase-requests/models/material";
import type {
  PurchaseRequest,
  PurchaseRequestDetail,
  SettablePurchaseRequestStatus,
} from "@/modules/purchase-requests/models/purchase-request";
import type {
  PurchaseRequestProof,
  PurchaseRequestProofDetail,
} from "@/modules/purchase-requests/models/purchase-request-proof";
import type { Vendor } from "@/modules/vendors";

/**
 * Purchase request calls against the BFF. Runs in the browser and knows nothing
 * about FastAPI's address — Route Handlers pass the upstream response through
 * untouched. The transport itself lives in `lib/api/bff-client`.
 */

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
  return bffRequest<PurchaseRequestDetail>(purchaseRequestEndpoints.create, {
    method: "POST",
    body: payload,
  });
}

export function updatePurchaseRequest(
  id: string,
  payload: UpdatePurchaseRequestDto,
) {
  return bffRequest<PurchaseRequestDetail>(
    purchaseRequestEndpoints.detail(id),
    { method: "PUT", body: payload },
  );
}

/**
 * Submitting for approval (`pending`) and cancelling (`canceled`) are the same
 * transition endpoint with a different segment. Deliberately not folded into
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
 * One proof record covers every item id passed in — a single vendor
 * confirmation for a whole vendor group, not one call per item.
 */
export function createPurchaseRequestProof(
  payload: CreatePurchaseRequestProofDto,
  attachments: File[] = [],
) {
  const form = buildPurchaseRequestProofForm(payload, attachments);

  return bffRequest<PurchaseRequestProof>(purchaseRequestEndpoints.proofs, {
    method: "POST",
    body: form,
  });
}

/**
 * One proof with its documents. The request detail's `proofs` join carries no
 * filenames, so the proof dialog reads this on demand.
 */
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
