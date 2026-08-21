import type { NextRequest } from "next/server";

import { toErrorResponse } from "@/lib/api/errors";
import { readPageParam } from "@/lib/api/pagination";
import { PERMISSIONS } from "@/modules/auth/constants/permissions";
import { requirePermission } from "@/modules/auth/dal/access";
import { DEFAULT_PAGE_SIZE } from "@/modules/purchaser/constants";
import { listPendingPurchaseRequests } from "@/modules/purchaser/dal/purchaser.dal";

export async function GET(request: NextRequest) {
  try {
    await requirePermission(PERMISSIONS.purchaser.index);

    const { searchParams } = request.nextUrl;

    const result = await listPendingPurchaseRequests({
      page: readPageParam(searchParams.get("page"), 1),
      pageSize: readPageParam(searchParams.get("pageSize"), DEFAULT_PAGE_SIZE),
      search: searchParams.get("search") || undefined,
      priority: searchParams.get("priority") || undefined,
      departments: searchParams.get("departments") || undefined,
    });

    return Response.json({ data: result });
  } catch (error) {
    return toErrorResponse(error);
  }
}
