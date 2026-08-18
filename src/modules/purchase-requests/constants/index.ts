import type { StatusTone } from "@/lib/types";
import type {
  PurchaseRequestItemStatus,
  PurchaseRequestStatus,
} from "@/modules/purchase-requests/models/purchase-request";

export { DEFAULT_PAGE_SIZE } from "@/lib/api/pagination";

export { LOOKUP_PAGE_SIZE } from "@/lib/lookup";

/** Ably channel FastAPI's StatusService publishes PR status transitions on. */
export const PURCHASE_REQUESTS_CHANNEL = "purchase-requests";
/** Event name for the above — must match StatusService's `title` verbatim. */
export const PURCHASE_REQUEST_UPDATED_EVENT = "Purchase Request Updated";

/**
 * Status pill copy. Presentation only — the backend stores the slug and no
 * richer label (no PO number, no item counts), so these are the plain names.
 * Declaration order is the order the legend lists them in.
 */
export const purchaseRequestStatusLabels: Record<
  PurchaseRequestStatus,
  string
> = {
  draft: "Draft",
  pending: "Pending Approval",
  canvassing: "Canvassing",
  "po-created": "PO Created",
  "partially-completed": "Partially Completed",
  completed: "Completed",
  rejected: "Rejected",
  canceled: "Canceled",
};

/**
 * Status → pill tone. Single source of truth for how a request status looks.
 *
 * Canceled shares `neutral` with draft rather than taking `danger`: it's a
 * request withdrawn by its own requester, not a decision made against it.
 */
export const purchaseRequestTone: Record<PurchaseRequestStatus, StatusTone> = {
  draft: "neutral",
  pending: "warning",
  canvassing: "info",
  "po-created": "ordered",
  "partially-completed": "partial",
  completed: "success",
  rejected: "danger",
  canceled: "neutral",
};

/** Legend shown above the request list, derived from the labels above. */
export const purchaseRequestStatusLegend = (
  Object.keys(purchaseRequestStatusLabels) as PurchaseRequestStatus[]
).map((status) => ({ status, label: purchaseRequestStatusLabels[status] }));

export const purchaseRequestItemStatusLabels: Record<
  PurchaseRequestItemStatus,
  string
> = {
  pending: "Pending",
  draft: "Draft",
  canvassing: "Canvassing",
  // Matches the label Canvassing's own list uses for the same event, so an
  // awarded item reads identically in both places.
  "quotation-awarded": "Vendor Selected",
  "po-created": "PO Created",
  "partially-completed": "Partially Completed",
  completed: "Completed",
  rejected: "Rejected",
  canceled: "Canceled",
};

export const purchaseRequestItemTone: Record<
  PurchaseRequestItemStatus,
  StatusTone
> = {
  pending: "neutral",
  draft: "neutral",
  canvassing: "info",
  "quotation-awarded": "success",
  "po-created": "ordered",
  "partially-completed": "partial",
  completed: "success",
  rejected: "danger",
  canceled: "neutral",
};

/**
 * Item statuses that take no further quotes. Once an item has reached a PO —
 * or been closed out — canvassing is over for it, so the canvassing screen
 * leaves it unselectable and drops its footer once every item is here.
 */
export const closedToQuotingItemStatuses: readonly PurchaseRequestItemStatus[] =
  ["po-created", "partially-completed", "completed", "rejected", "canceled"];
