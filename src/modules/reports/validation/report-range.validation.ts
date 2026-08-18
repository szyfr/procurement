import { ApiError } from "@/lib/api/errors";
import type { ReportRange } from "@/modules/reports/dal/report.dal";

/**
 * The date range every report route requires. FastAPI rejects a call without
 * both bounds, so the missing-parameter case is answered here rather than
 * round-tripped.
 */
export function parseReportRange(searchParams: URLSearchParams): ReportRange {
  const startDate = searchParams.get("start_date");
  const endDate = searchParams.get("end_date");

  if (!startDate || !endDate) {
    throw new ApiError(
      422,
      "validation_failed",
      "A start and end date are required.",
    );
  }

  return { startDate, endDate };
}
