import type { NextRequest } from "next/server";

import { toErrorResponse } from "@/lib/api/errors";
import { readPageParam } from "@/lib/api/pagination";
import { PERMISSIONS } from "@/modules/auth/constants/permissions";
import { requirePermission } from "@/modules/auth/dal/access";
import { DEFAULT_PAGE_SIZE } from "@/modules/departments/constants";
import {
  createDepartment,
  listDepartments,
} from "@/modules/departments/dal/department.dal";
import { parseDepartmentPayload } from "@/modules/departments/validation/department.validation";

export async function GET(request: NextRequest) {
  try {
    await requirePermission(PERMISSIONS.department.index);

    const { searchParams } = request.nextUrl;

    const result = await listDepartments({
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
    await requirePermission(PERMISSIONS.department.store);

    const payload = parseDepartmentPayload(
      await request.json().catch(() => null),
    );

    const created = await createDepartment(payload);

    return Response.json({ data: created }, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
