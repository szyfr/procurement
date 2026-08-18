import type { NextRequest } from "next/server";

import { toErrorResponse } from "@/lib/api/errors";
import { readPageParam } from "@/lib/api/pagination";
import { LOOKUP_PAGE_SIZE } from "@/lib/lookup";
import { PERMISSIONS } from "@/modules/auth/constants/permissions";
import { requirePermission } from "@/modules/auth/dal/access";
import { listMaterials } from "@/modules/purchase-requests/dal/lookup.dal";

/**
 * Material catalog for the create form's item picker.
 *
 * There are ~1,900 materials, so the picker pages through them and narrows with
 * `search` rather than loading the whole catalog into a select.
 */
export async function GET(request: NextRequest) {
  try {
    await requirePermission(PERMISSIONS.material.index);

    const { searchParams } = request.nextUrl;

    const result = await listMaterials({
      page: readPageParam(searchParams.get("page"), 1),
      pageSize: readPageParam(searchParams.get("pageSize"), LOOKUP_PAGE_SIZE),
      search: searchParams.get("search"),
    });

    return Response.json({ data: result });
  } catch (error) {
    return toErrorResponse(error);
  }
}
