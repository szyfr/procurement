/**
 * Reports module — public surface.
 *
 * The DAL is deliberately left out: it reaches FastAPI and must be imported
 * directly by Route Handlers (`@/modules/reports/dal/report.dal`) so it can
 * never be pulled into a client bundle through this barrel.
 */

export {
  CHART_PURCHASER_LIMIT,
  CHART_VENDOR_LIMIT,
  DEFAULT_RANGE_PRESET,
  isRangePreset,
  RATING_MAX,
  type ReportDateRange,
  type ReportRangePreset,
  reportRangeOptions,
  resolveDateRange,
} from "@/modules/reports/constants";
export type {
  CanvassingComplianceReport,
  CanvassingComplianceRow,
  DepartmentSpending,
  DepartmentSpendingReport,
  PrStatusCount,
  PurchaserAssessmentRow,
  VendorPerformanceRow,
} from "@/modules/reports/models/report";
export {
  canvassingComplianceQuery,
  departmentSpendingQuery,
  prStatusBreakdownQuery,
  purchaserAssessmentQuery,
  reportKeys,
  vendorPerformanceQuery,
} from "@/modules/reports/queries";
