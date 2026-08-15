/**
 * `PATCH /purchase-requests/{id}/delivered` — one date for the whole batch.
 *
 * Upstream stores it as `delivered_at` and moves every listed item to
 * `completed`; the request field and the stored field deliberately differ.
 */
export interface MarkPurchaseRequestDeliveredDto {
  item_ids: string[];
  /**
   * `YYYY-MM-DD`. Always sent explicitly: the backend declares this optional
   * with `= datetime.now` — the function object rather than a call — so an
   * omitted date is written to Mongo as the method itself.
   */
  delivery_date: string;
}
