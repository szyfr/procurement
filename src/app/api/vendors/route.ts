import type { NextRequest } from "next/server";

import { toErrorResponse } from "@/lib/api/errors";
import { readPageParam } from "@/lib/api/pagination";
import { PERMISSIONS } from "@/modules/auth/constants/permissions";
import { requirePermission } from "@/modules/auth/dal/access";
import { DEFAULT_PAGE_SIZE } from "@/modules/vendors/constants";
import { listVendors } from "@/modules/vendors/dal/vendor.dal";

/**
 * Read-only — vendors are synced upstream and FastAPI exposes no write
 * endpoints for them yet.
 */

export async function GET(request: NextRequest) {
  try {
    await requirePermission(PERMISSIONS.vendor.index);

    const { searchParams } = request.nextUrl;

    const result = await listVendors({
      page: readPageParam(searchParams.get("page"), 1),
      pageSize: readPageParam(searchParams.get("pageSize"), DEFAULT_PAGE_SIZE),
    });

    return Response.json({ data: result });
  } catch (error) {
    return toErrorResponse(error);
  }
}
