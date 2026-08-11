import type { NextRequest } from "next/server";

import { toErrorResponse } from "@/lib/api/errors";
import { readPageParam } from "@/lib/api/pagination";
import { DEFAULT_PAGE_SIZE } from "@/modules/roles/constants";
import { createRole, listRoles } from "@/modules/roles/dal/role.dal";
import { parseCreateRolePayload } from "@/modules/roles/validation/role.validation";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;

    const result = await listRoles({
      page: readPageParam(searchParams.get("page"), 1),
      pageSize: readPageParam(searchParams.get("pageSize"), DEFAULT_PAGE_SIZE),
      search: searchParams.get("search"),
    });

    return Response.json({ data: result });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = parseCreateRolePayload(
      await request.json().catch(() => null),
    );

    const created = await createRole(payload);

    return Response.json({ data: created }, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
