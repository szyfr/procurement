import type { NextRequest } from "next/server";

import { toErrorResponse } from "@/lib/api/errors";
import { readPageParam } from "@/lib/api/pagination";
import { requireUser } from "@/modules/auth/dal/auth.dal";
import { DEFAULT_PAGE_SIZE } from "@/modules/permissions/constants";
import { listPermissions } from "@/modules/permissions/dal/permission.dal";

/**
 * The permission catalogue the role editor picks from.
 *
 * Gated on being signed in and nothing more, matching upstream:
 * `permission_controller.py` is the one controller with no `require_permission`
 * on any route. Gating it on `role.store` here would be tighter than the API it
 * proxies, and would break the role form for anyone the API would have served.
 */
export async function GET(request: NextRequest) {
  try {
    await requireUser();

    const { searchParams } = request.nextUrl;

    const result = await listPermissions({
      page: readPageParam(searchParams.get("page"), 1),
      pageSize: readPageParam(searchParams.get("pageSize"), DEFAULT_PAGE_SIZE),
      search: searchParams.get("search"),
    });

    return Response.json({ data: result });
  } catch (error) {
    return toErrorResponse(error);
  }
}
