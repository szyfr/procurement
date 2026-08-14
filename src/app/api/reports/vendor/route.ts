import type { NextRequest } from "next/server";

import { ApiError, toErrorResponse } from "@/lib/api/errors";
import { getVendorPerformance } from "@/modules/reports/dal/vendor-report.dal";

/**
 * Vendor performance report. Read-only, and both dates are required — FastAPI
 * rejects the call without them, so the missing-parameter case is answered here
 * rather than round-tripped.
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;

    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");

    if (!startDate || !endDate) {
      throw new ApiError(
        422,
        "validation_failed",
        "A start and end date are required.",
      );
    }

    const result = await getVendorPerformance({
      startDate,
      endDate,
      search: searchParams.get("search") || undefined,
    });

    return Response.json({ data: result });
  } catch (error) {
    return toErrorResponse(error);
  }
}
