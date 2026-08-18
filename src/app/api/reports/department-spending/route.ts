import type { NextRequest } from "next/server";

import { toErrorResponse } from "@/lib/api/errors";
import { PERMISSIONS } from "@/modules/auth/constants/permissions";
import { requirePermission } from "@/modules/auth/dal/access";
import { getDepartmentSpending } from "@/modules/reports/dal/report.dal";
import { parseReportRange } from "@/modules/reports/validation/report-range.validation";

/** Department spend report. Read-only; `parseReportRange` enforces the required bounds. */
export async function GET(request: NextRequest) {
  try {
    await requirePermission(PERMISSIONS.report.departmentSpending);

    const range = parseReportRange(request.nextUrl.searchParams);

    return Response.json({ data: await getDepartmentSpending(range) });
  } catch (error) {
    return toErrorResponse(error);
  }
}
