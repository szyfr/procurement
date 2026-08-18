import type { NextRequest } from "next/server";

import { toErrorResponse } from "@/lib/api/errors";
import { parseTitleDescriptionPayload } from "@/lib/api/validation";
import { PERMISSIONS } from "@/modules/auth/constants/permissions";
import { requirePermission } from "@/modules/auth/dal/access";
import {
  deleteDepartment,
  getDepartment,
  updateDepartment,
} from "@/modules/departments/dal/department.dal";

export async function GET(
  _request: NextRequest,
  context: RouteContext<"/api/departments/[id]">,
) {
  try {
    await requirePermission(PERMISSIONS.department.show);

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
    await requirePermission(PERMISSIONS.department.update);

    const { id } = await context.params;
    const payload = parseTitleDescriptionPayload(
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
    await requirePermission(PERMISSIONS.department.delete);

    const { id } = await context.params;

    await deleteDepartment(id);

    return new Response(null, { status: 204 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
