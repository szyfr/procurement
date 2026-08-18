import type { NextRequest } from "next/server";

import { toErrorResponse } from "@/lib/api/errors";
import { readPageParam } from "@/lib/api/pagination";
import { LOOKUP_PAGE_SIZE } from "@/lib/lookup";
import { PERMISSIONS } from "@/modules/auth/constants/permissions";
import { requirePermission } from "@/modules/auth/dal/access";
import { listVendors } from "@/modules/purchase-requests/dal/lookup.dal";

/**
 * Vendors for the create form, used on directly-sourced lines where the
 * requester picks a vendor instead of routing the item to canvassing.
 */
export async function GET(request: NextRequest) {
  try {
    await requirePermission(PERMISSIONS.vendor.index);

    const { searchParams } = request.nextUrl;

    const result = await listVendors({
      page: readPageParam(searchParams.get("page"), 1),
      pageSize: readPageParam(searchParams.get("pageSize"), LOOKUP_PAGE_SIZE),
      search: searchParams.get("search"),
    });

    return Response.json({ data: result });
  } catch (error) {
    return toErrorResponse(error);
  }
}
