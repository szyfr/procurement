import type { NextRequest } from "next/server";

import { toErrorResponse } from "@/lib/api/errors";
import { PERMISSIONS } from "@/modules/auth/constants/permissions";
import { requirePermission } from "@/modules/auth/dal/access";
import { getPrStatusBreakdown } from "@/modules/reports/dal/report.dal";
import { parseReportRange } from "@/modules/reports/validation/report-range.validation";

/** Purchase request status breakdown. Read-only; `parseReportRange` enforces the required bounds. */
export async function GET(request: NextRequest) {
  try {
    await requirePermission(PERMISSIONS.report.prCycle);

    const range = parseReportRange(request.nextUrl.searchParams);

    return Response.json({ data: await getPrStatusBreakdown(range) });
  } catch (error) {
    return toErrorResponse(error);
  }
}
