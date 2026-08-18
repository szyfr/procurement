import type { Vendor } from "@/modules/vendors";

/**
 * The five report responses, verbatim — what FastAPI sends is what the charts
 * and tables render. None of them are paginated.
 */

/**
 * A row of `GET /reports/vendor` — the vendor document as the Vendors list
 * already knows it, plus the four fields the aggregation computes.
 */
export interface VendorPerformanceRow extends Vendor {
  total_deliveries: number;
  on_time_deliveries: number;
  /** 0–100, rounded to 2dp upstream. 0 when there are no deliveries at all. */
  on_time_percentage: number;
  /** 1–5, bucketed from `on_time_percentage` by the backend. */
  rating: number;
}

/**
 * A row of `GET /reports/pr-cycle` — one purchase request status and how many
 * requests were created in the range with it.
 *
 * Despite the endpoint's name this is a status distribution, not cycle time:
 * the backend loops its `Status` enum counting matches, so all eight statuses
 * always come back, zeros included.
 */
export interface PrStatusCount {
  /**
   * The backend's own titling of the status slug (`"Po Created"`, `"Pending"`)
   * — not display copy. The render site maps it back to a slug and takes the
   * app's label from `purchaseRequestStatusLabels`.
   */
  category: string;
  value: number;
}

/**
 * `GET /reports/department-spending` — spend on purchase requests created in
 * the range, one entry per department. Answers an object rather than an array,
 * with the grand total computed upstream.
 */
export interface DepartmentSpending {
  /** The department's title, not its id — the join happens upstream. */
  department: string;
  /**
   * Σ `quantity × material.last_cost` over the department's `po-created`
   * items. Materials synced without a `last_cost` contribute nothing, so this
   * is spend on priced items rather than every ordered item.
   */
  value: number;
  /** Count of `po-created` request items — ordered lines, not distinct POs. */
  po: number;
}

export interface DepartmentSpendingReport {
  total: number;
  /** Every department, including those with no requests in the range. */
  data: DepartmentSpending[];
}

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
