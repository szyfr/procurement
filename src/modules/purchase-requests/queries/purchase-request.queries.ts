import { queryOptions } from "@tanstack/react-query";

import {
  fetchDepartmentOptions,
  fetchPurchaseRequest,
  fetchPurchaseRequestProof,
  fetchPurchaseRequests,
} from "@/modules/purchase-requests/api/client";

/**
 * Query definitions for the Purchase Requests UI.
 *
 * These live in the module rather than the components so cache keys and
 * fetchers stay next to the rest of the purchase request surface. The fetchers
 * are still the module's API client, which talks to the BFF — the FastAPI
 * calls themselves stay in the DAL, server-side.
 */

export interface PurchaseRequestListFilters {
  search?: string;
  priority?: string;
  departments?: string;
  status?: string[];
  pageSize?: number;
}

export const purchaseRequestKeys = {
  /** Prefix for everything below; invalidating it refetches the whole module. */
  all: ["purchase-requests"] as const,
  lists: () => [...purchaseRequestKeys.all, "list"] as const,
  list: (page: number, filters: PurchaseRequestListFilters = {}) =>
    [...purchaseRequestKeys.all, "list", page, filters] as const,
  detail: (id: string) => [...purchaseRequestKeys.all, "detail", id] as const,
  proof: (proofId: string) =>
    [...purchaseRequestKeys.all, "proof", proofId] as const,
  /**
   * Reference data. Kept under this module's prefix because it is served by
   * the purchase request lookup routes — the standalone Vendors module owns
   * `["vendors", ...]` separately.
   */
  departmentOptions: () =>
    [...purchaseRequestKeys.all, "lookups", "departments"] as const,
  materialOptions: () =>
    [...purchaseRequestKeys.all, "lookups", "materials"] as const,
  vendorOptions: () =>
    [...purchaseRequestKeys.all, "lookups", "vendors"] as const,
};

export function purchaseRequestListQuery(
  page: number,
  filters: PurchaseRequestListFilters = {},
) {
  const { search, priority, departments, status, pageSize } = filters;

  return queryOptions({
    queryKey: purchaseRequestKeys.list(page, filters),
    queryFn: ({ signal }) =>
      fetchPurchaseRequests({
        page,
        pageSize,
        search,
        priority,
        departments,
        status,
        signal,
      }),
  });
}

export function purchaseRequestDetailQuery(id: string) {
  return queryOptions({
    queryKey: purchaseRequestKeys.detail(id),
    queryFn: ({ signal }) => fetchPurchaseRequest(id, signal),
  });
}

export function purchaseRequestProofQuery(proofId: string) {
  return queryOptions({
    queryKey: purchaseRequestKeys.proof(proofId),
    queryFn: ({ signal }) => fetchPurchaseRequestProof(proofId, signal),
    staleTime: Number.POSITIVE_INFINITY,
  });
}

/**
 * The department collection for the list toolbar's filter. The create/edit
 * forms read the same endpoint through the picker's own infinite query.
 */
export function departmentOptionsQuery() {
  return queryOptions({
    queryKey: purchaseRequestKeys.departmentOptions(),
    queryFn: ({ signal }) => fetchDepartmentOptions({ signal }),
    // Departments change rarely and this only shapes a filter; an hour keeps
    // it from refetching on every visit to the list.
    staleTime: 60 * 60 * 1000,
  });
}
