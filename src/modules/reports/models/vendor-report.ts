import type { Vendor } from "@/modules/vendors/models/vendor";

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
