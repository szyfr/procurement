/**
 * `GET /reports/canvassing-compliance` — how the canvassing done in the period
 * measured against the three-quote minimum, one entry per department.
 *
 * The range matches the purchase request's own `created_at`, and only items
 * sitting at `canvassing` inside a request that drew at least one quotation are
 * counted at all.
 *
 * There is no server-side notion of an **exemption** — a request excused from
 * the minimum is indistinguishable from one that simply fell short, so every
 * shortfall lands in `below_minimum`.
 *
 * Like department spending, this one answers an object rather than an array,
 * with the totals summed upstream.
 */

export interface CanvassingComplianceRow {
  /** The department's title, not its id — the join happens upstream. */
  department: string;
  /**
   * Canvassing request *items*, not purchase requests, despite the name: the
   * controller sums the items of every matching request.
   */
  pr_canvassed: number;
  /** Items with three or more quotations. */
  met_minimum: number;
  /**
   * The remainder of `pr_canvassed`. Includes items with no quotation at all —
   * the "has quotations" filter applies to the request, not to each item.
   */
  below_minimum: number;
}

export interface CanvassingComplianceReport {
  /** Σ `met_minimum` across every department. */
  total_minimum: number;
  /** Σ `below_minimum` across every department. */
  total_below_minimum: number;
  /** Every department, including those that canvassed nothing in the range. */
  data: CanvassingComplianceRow[];
}
