/**
 * Every BFF path the Purchase Requests UI is allowed to call. All relative —
 * the browser only ever talks to this app's own origin.
 */

const BASE = "/api/purchase-requests";

export const purchaseRequestEndpoints = {
  list: BASE,
  create: BASE,
  detail: (id: string) => `${BASE}/${encodeURIComponent(id)}`,
  /** Status transitions are their own endpoint — see the client for why. */
  status: (id: string, status: string) =>
    `${BASE}/${encodeURIComponent(id)}/status/${encodeURIComponent(status)}`,
  /** Bulk delivery: closes out the items named in the body, not the request. */
  delivered: (id: string) => `${BASE}/${encodeURIComponent(id)}/delivered`,
  /** Bulk approve/reject: one decision across the items named in the body. */
  items: (id: string) => `${BASE}/${encodeURIComponent(id)}/items`,
  /** Approve/reject a single item — a separate grant upstream, see the client. */
  item: (id: string, itemId: string) =>
    `${BASE}/${encodeURIComponent(id)}/items/${encodeURIComponent(itemId)}`,
  /** Partial delivery: how much of a single item arrived. */
  partialDelivery: (id: string, itemId: string) =>
    `${BASE}/${encodeURIComponent(id)}/items/${encodeURIComponent(itemId)}/partial-delivery`,
  proofs: `${BASE}/proofs`,
  proofDetail: (id: string) => `${BASE}/proofs/${encodeURIComponent(id)}`,
  departments: `${BASE}/lookups/departments`,
  materials: `${BASE}/lookups/materials`,
  vendors: `${BASE}/lookups/vendors`,
} as const;
