import type { NextRequest } from "next/server";

import { toErrorResponse } from "@/lib/api/errors";
import { PERMISSIONS } from "@/modules/auth/constants/permissions";
import { requirePermission } from "@/modules/auth/dal/access";
import { getCanvassingCompliance } from "@/modules/reports/dal/report.dal";
import { parseReportRange } from "@/modules/reports/validation/report-range.validation";

/** Canvassing compliance report. Read-only; `parseReportRange` enforces the required bounds. */
export async function GET(request: NextRequest) {
  try {
    await requirePermission(PERMISSIONS.report.canvassingCompliance);

    const range = parseReportRange(request.nextUrl.searchParams);

    return Response.json({ data: await getCanvassingCompliance(range) });
  } catch (error) {
    return toErrorResponse(error);
  }
}
