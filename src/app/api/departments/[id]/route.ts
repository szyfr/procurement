import type { NextRequest } from "next/server";

import { toErrorResponse } from "@/lib/api/errors";
import { requireUser } from "@/modules/auth/dal/auth.dal";
import {
  deleteDepartment,
  getDepartment,
  updateDepartment,
} from "@/modules/departments/dal/department.dal";
import { parseDepartmentPayload } from "@/modules/departments/validation/department.validation";

export async function GET(
  _request: NextRequest,
  context: RouteContext<"/api/departments/[id]">,
) {
  try {
    await requireUser();

    const { id } = await context.params;

    return Response.json({ data: await getDepartment(id) });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function PUT(
  request: NextRequest,
  context: RouteContext<"/api/departments/[id]">,
) {
  try {
    await requireUser();

    const { id } = await context.params;
    const payload = parseDepartmentPayload(
      await request.json().catch(() => null),
    );

    const updated = await updateDepartment(id, payload);

    return Response.json({ data: updated });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function DELETE(
  _request: NextRequest,
  context: RouteContext<"/api/departments/[id]">,
) {
  try {
    await requireUser();

    const { id } = await context.params;

    await deleteDepartment(id);

    return new Response(null, { status: 204 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
