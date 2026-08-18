import { toDayEnd, toDayString } from "@/lib/date";

/**
 * The report date range — the presets the toolbar offers and the resolver that
 * turns one into the `start_date`/`end_date` pair FastAPI requires — plus the
 * few display limits the charts are capped by.
 *
 * Resolution happens on the server (the Reports page shell) so `new Date()`
 * never runs twice with different answers across a hydration boundary.
 */

export type ReportRangePreset = "7d" | "30d" | "90d" | "ytd" | "custom";

export const DEFAULT_RANGE_PRESET = "90d" satisfies ReportRangePreset;

export const reportRangeOptions = [
  { label: "Last 7 days", value: "7d" },
  { label: "Last 30 days", value: "30d" },
  { label: "Last 90 days", value: "90d" },
  { label: "Year to date", value: "ytd" },
  { label: "Custom…", value: "custom" },
] as const;

const PRESET_DAYS = { "7d": 7, "30d": 30, "90d": 90 } as const;

export interface ReportDateRange {
  preset: ReportRangePreset;
  /** Inclusive lower bound, "YYYY-MM-DD". */
  startDate: string;
  /** Inclusive upper bound, carried to the end of the day. */
  endDate: string;
}

export function isRangePreset(
  value: string | undefined,
): value is ReportRangePreset {
  return reportRangeOptions.some((option) => option.value === value);
}

function isDayString(value: string | undefined): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function daysBefore(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() - days);

  return result;
}

/**
 * A preset (plus the custom `start`/`end` params when there is one) becomes the
 * concrete range. A half-filled custom range falls back to the default window
 * rather than sending a bound the backend would reject — both dates are
 * required upstream.
 */
export function resolveDateRange(
  preset: string | undefined,
  start?: string,
  end?: string,
): ReportDateRange {
  const active = isRangePreset(preset) ? preset : DEFAULT_RANGE_PRESET;
  const today = new Date();

  if (active === "custom") {
    return {
      preset: active,
      startDate: isDayString(start)
        ? start
        : toDayString(daysBefore(today, PRESET_DAYS[DEFAULT_RANGE_PRESET])),
      endDate: toDayEnd(isDayString(end) ? end : toDayString(today)),
    };
  }

  return {
    preset: active,
    startDate:
      active === "ytd"
        ? `${today.getFullYear()}-01-01`
        : toDayString(daysBefore(today, PRESET_DAYS[active])),
    endDate: toDayEnd(toDayString(today)),
  };
}

/** Bars in the vendor performance chart; the table still lists every vendor. */
export const CHART_VENDOR_LIMIT = 8;

/** Bars in the purchaser performance chart; the table still lists everyone. */
export const CHART_PURCHASER_LIMIT = 8;

/** The backend's rating scale — ratings come back as 1–5. */
export const RATING_MAX = 5;
