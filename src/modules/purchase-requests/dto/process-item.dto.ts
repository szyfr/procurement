/**
 * `PATCH .../items/{itemId}` and `PATCH .../items` — the approve/reject
 * decision on a submitted item.
 *
 * The wire value is the decision, not the status it produces: upstream maps
 * `approved` onto `po-created` and `rejected` onto `rejected` itself, in
 * `purchase_request_items_controller.py`.
 *
 * Approving is also what dispatches `GeneratePOJob`, so this is the call that
 * creates the Business Central purchase order. `StatusService` used to create
 * one automatically when a request was submitted; it no longer does, which
 * makes this the only path a directly-sourced item reaches `po-created` by —
 * canvassed items still get there through an award.
 */
export type ProcessItemDecision = "approved" | "rejected";

/** Body of the single-item route, gated on `purchase_request_item.process`. */
export interface ProcessPurchaseRequestItemDto {
  status: ProcessItemDecision;
}

/**
 * Body of the bulk route, gated on `purchase_request_item.mass-process`. One
 * decision covers every id in `items` — there is no per-item override, so a
 * mixed approve/reject has to be two calls.
 *
 * Upstream declares `items: List[PyObjectId]`, so the ids go up as plain
 * strings rather than objects.
 */
export interface ProcessPurchaseRequestItemsDto
  extends ProcessPurchaseRequestItemDto {
  items: string[];
}
