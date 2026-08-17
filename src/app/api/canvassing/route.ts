import type { NextRequest } from "next/server";

import { toErrorResponse } from "@/lib/api/errors";
import { readPageParam } from "@/lib/api/pagination";
import { PERMISSIONS } from "@/modules/auth/constants/permissions";
import { requirePermission } from "@/modules/auth/dal/access";
import { DEFAULT_PAGE_SIZE } from "@/modules/canvassing/constants";
import { listCanvassing } from "@/modules/canvassing/dal/canvassing.dal";

export async function GET(request: NextRequest) {
  try {
    await requirePermission(PERMISSIONS.canvassing.index);

    const { searchParams } = request.nextUrl;

    const result = await listCanvassing({
      page: readPageParam(searchParams.get("page"), 1),
      pageSize: readPageParam(searchParams.get("pageSize"), DEFAULT_PAGE_SIZE),
    });

    return Response.json({ data: result });
  } catch (error) {
    return toErrorResponse(error);
  }
}
