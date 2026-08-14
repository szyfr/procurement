export {
  DEFAULT_RANGE_PRESET,
  isRangePreset,
  type ReportDateRange,
  type ReportRangePreset,
  reportRangeOptions,
  resolveDateRange,
} from "@/modules/reports/constants/date-ranges";

/** Bars in the vendor performance chart; the table still lists every vendor. */
export const CHART_VENDOR_LIMIT = 8;

/** The backend's rating scale — ratings come back as 1–5. */
export const RATING_MAX = 5;
