/**
 * A row of `GET /reports/purchaser-assessment`. The keys carry spaces and
 * capitals because the aggregation's `$project` names them that way; they are
 * the backend's shape and are read as they arrive.
 *
 * Two of the three fields say less than their names suggest, and neither is
 * papered over here — see the render site for how each is labelled.
 */
export interface PurchaserAssessmentRow {
  /**
   * `firstname lastname`, concatenated upstream. Null when either half is
   * missing — Mongo's `$concat` returns null if any argument is. There is no
   * `_id` alongside it, so this is also the only thing identifying the row.
   */
  Purchaser: string | null;
  /**
   * Purchase request *items* across every proof the purchaser filed, not
   * requests — the pipeline sums the size of each proof's item list. Only
   * items created inside the requested range are counted.
   */
  "PRs Processed": number;
  /**
   * 0–100, unrounded, so expect long decimals. An item counts as on time when
   * its `delivered_at` is at or before the proof's `delivery_date`, and BSON
   * sorts null below every date — so an item that was never delivered passes
   * the test and raises this figure.
   */
  "Delivery Accuracy": number;
}
