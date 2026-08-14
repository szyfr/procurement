/**
 * `GET /reports/department-spending` — spend on purchase requests created in
 * the range, one entry per department.
 *
 * Unlike the other two reports this one answers an object rather than an array,
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
