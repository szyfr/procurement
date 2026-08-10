/**
 * Purchase Requests module — public surface.
 *
 * Only the browser-safe pieces are re-exported here. The DAL is deliberately
 * left out: it reaches FastAPI and must be imported directly by Route Handlers
 * (`@/modules/purchase-requests/dal/...`) so it can never be pulled into a
 * client bundle through this barrel.
 */

export {
  createPurchaseRequest,
  createPurchaseRequestProof,
  fetchDepartmentOptions,
  fetchMaterialOptions,
  fetchPurchaseRequests,
  fetchVendorOptions,
  setPurchaseRequestStatus,
  updatePurchaseRequest,
} from "@/modules/purchase-requests/api/client";
export {
  LOOKUP_PAGE_SIZE,
  PURCHASE_REQUEST_UPDATED_EVENT,
  PURCHASE_REQUESTS_CHANNEL,
  purchaseRequestItemStatusLabels,
  purchaseRequestItemTone,
  purchaseRequestStatusLabels,
  purchaseRequestStatusLegend,
  purchaseRequestTone,
} from "@/modules/purchase-requests/constants";
export type {
  CreatePurchaseRequestInput,
  CreatePurchaseRequestProofDto,
  UpdatePurchaseRequestDto,
} from "@/modules/purchase-requests/dto";
export { usePurchaseRequestUpdates } from "@/modules/purchase-requests/hooks/use-purchase-request-updates";
export type { Material } from "@/modules/purchase-requests/models/material";
export type {
  Priority,
  PurchaseRequest,
  PurchaseRequestDetail,
  PurchaseRequestItem,
  PurchaseRequestStatus,
  SettablePurchaseRequestStatus,
} from "@/modules/purchase-requests/models/purchase-request";
export type { PurchaseRequestProof } from "@/modules/purchase-requests/models/purchase-request-proof";
export type { PurchaseRequestListFilters } from "@/modules/purchase-requests/queries/purchase-request.queries";
export {
  departmentOptionsQuery,
  purchaseRequestDetailQuery,
  purchaseRequestKeys,
  purchaseRequestListQuery,
} from "@/modules/purchase-requests/queries/purchase-request.queries";
export type { DraftLineItem } from "@/modules/purchase-requests/types";
