import type { NextRequest } from "next/server";

import { toErrorResponse } from "@/lib/api/errors";
import { DEFAULT_PAGE_SIZE, readPageParam } from "@/lib/api/pagination";
import { parseTitleDescriptionPayload } from "@/lib/api/validation";
import { PERMISSIONS } from "@/modules/auth/constants/permissions";
import { requirePermission } from "@/modules/auth/dal/access";
import {
  createDepartment,
  listDepartments,
} from "@/modules/departments/dal/department.dal";

export async function GET(request: NextRequest) {
  try {
    await requirePermission(PERMISSIONS.department.index);

    const { searchParams } = request.nextUrl;

    const result = await listDepartments({
      page: readPageParam(searchParams.get("page"), 1),
      pageSize: readPageParam(searchParams.get("pageSize"), DEFAULT_PAGE_SIZE),
    });

    return Response.json({ data: result });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requirePermission(PERMISSIONS.department.store);

    const payload = parseTitleDescriptionPayload(
      await request.json().catch(() => null),
    );

    const created = await createDepartment(payload);

    return Response.json({ data: created }, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
