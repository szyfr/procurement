/**
 * Purchaser module — public surface.
 *
 * Only the browser-safe pieces are re-exported here. The DAL is deliberately
 * left out: it reaches FastAPI and must be imported directly by Route Handlers
 * (`@/modules/purchaser/dal/purchaser.dal`) so it can never be pulled into a
 * client bundle through this barrel.
 */

export { fetchPendingPurchaseRequests } from "@/modules/purchaser/api/client";
export type { PendingPurchaseRequestFilters } from "@/modules/purchaser/queries/purchaser.queries";
export {
  pendingPurchaseRequestsQuery,
  purchaserKeys,
} from "@/modules/purchaser/queries/purchaser.queries";
