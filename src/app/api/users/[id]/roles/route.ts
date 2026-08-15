import type { NextRequest } from "next/server";

import { toErrorResponse } from "@/lib/api/errors";
import { requireUser } from "@/modules/auth/dal/auth.dal";
import { updateUserRoles } from "@/modules/users/dal/user.dal";
import { parseUpdateUserRolesPayload } from "@/modules/users/validation/user.validation";

/** BFF for a user's role assignment. The one write endpoint the backend exposes for users today. */

export async function PATCH(
  request: NextRequest,
  context: RouteContext<"/api/users/[id]/roles">,
) {
  try {
    await requireUser();

    const { id } = await context.params;
    const payload = parseUpdateUserRolesPayload(
      await request.json().catch(() => null),
    );

    return Response.json({ data: await updateUserRoles(id, payload) });
  } catch (error) {
    return toErrorResponse(error);
  }
}
