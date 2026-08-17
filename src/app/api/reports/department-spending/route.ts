import type { NextRequest } from "next/server";

import { ApiError, toErrorResponse } from "@/lib/api/errors";
import { PERMISSIONS } from "@/modules/auth/constants/permissions";
import { requirePermission } from "@/modules/auth/dal/access";
import { getDepartmentSpending } from "@/modules/reports/dal/department-spending-report.dal";

/**
 * Department spend report. Read-only, and both dates are required — FastAPI
 * rejects the call without them, so the missing-parameter case is answered here
 * rather than round-tripped.
 */

export async function GET(request: NextRequest) {
  try {
    await requirePermission(PERMISSIONS.report.departmentSpending);

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

    const result = await getDepartmentSpending({ startDate, endDate });

    return Response.json({ data: result });
  } catch (error) {
    return toErrorResponse(error);
  }
}
