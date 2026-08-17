import type { NextRequest } from "next/server";

import { toErrorResponse } from "@/lib/api/errors";
import { PERMISSIONS } from "@/modules/auth/constants/permissions";
import { requirePermission } from "@/modules/auth/dal/access";
import { getRole, updateRole } from "@/modules/roles/dal/role.dal";
import { parseUpdateRolePayload } from "@/modules/roles/validation/role.validation";

/** BFF for a single role. Delete is not wired — no delete endpoint exists yet. */

export async function GET(
  _request: NextRequest,
  context: RouteContext<"/api/roles/[id]">,
) {
  try {
    await requirePermission(PERMISSIONS.role.show);

    const { id } = await context.params;

    return Response.json({ data: await getRole(id) });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function PUT(
  request: NextRequest,
  context: RouteContext<"/api/roles/[id]">,
) {
  try {
    await requirePermission(PERMISSIONS.role.update);

    const { id } = await context.params;
    const payload = parseUpdateRolePayload(
      await request.json().catch(() => null),
    );

    return Response.json({ data: await updateRole(id, payload) });
  } catch (error) {
    return toErrorResponse(error);
  }
}
