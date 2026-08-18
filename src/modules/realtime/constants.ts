/**
 * The channel FastAPI's StatusService publishes purchase request status
 * transitions on, and the event name it publishes under — the latter must
 * match StatusService's `title` verbatim.
 *
 * They live in `realtime` rather than in `purchase-requests` because three
 * unrelated places subscribe to the same stream: the purchase request views,
 * the canvassing comparison, and the token service that scopes an Ably
 * capability to it.
 */

export const PURCHASE_REQUESTS_CHANNEL = "purchase-requests";
export const PURCHASE_REQUEST_UPDATED_EVENT = "Purchase Request Updated";
