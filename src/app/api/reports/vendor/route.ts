import type { NextRequest } from "next/server";

import { toErrorResponse } from "@/lib/api/errors";
import { PERMISSIONS } from "@/modules/auth/constants/permissions";
import { requirePermission } from "@/modules/auth/dal/access";
import { getVendorPerformance } from "@/modules/reports/dal/report.dal";
import { parseReportRange } from "@/modules/reports/validation/report-range.validation";

/** Vendor performance report. Read-only; `parseReportRange` enforces the required bounds. */
export async function GET(request: NextRequest) {
  try {
    await requirePermission(PERMISSIONS.report.vendor);

    const { searchParams } = request.nextUrl;

    const result = await getVendorPerformance({
      ...parseReportRange(searchParams),
      search: searchParams.get("search") || undefined,
    });

    return Response.json({ data: result });
  } catch (error) {
    return toErrorResponse(error);
  }
}
