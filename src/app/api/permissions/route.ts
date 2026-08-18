import type { NextRequest } from "next/server";

import { toErrorResponse } from "@/lib/api/errors";
import { readPageParam } from "@/lib/api/pagination";
import { PERMISSIONS } from "@/modules/auth/constants/permissions";
import { requirePermission } from "@/modules/auth/dal/access";
import { DEFAULT_PAGE_SIZE } from "@/modules/permissions/constants";
import { listPermissions } from "@/modules/permissions/dal/permission.dal";

/**
 * The permission catalogue the role editor picks from.
 *
 * `permission.index` is what `permission_controller.py` requires, so the role
 * form needs it alongside `role.store` / `role.update` — a role admin without
 * it would be denied the list upstream anyway.
 */
export async function GET(request: NextRequest) {
  try {
    await requirePermission(PERMISSIONS.permission.index);

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
