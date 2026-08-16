import type { NextRequest } from "next/server";

import { toErrorResponse } from "@/lib/api/errors";
import { requireUser } from "@/modules/auth/dal/auth.dal";
import { getUser, updateUser } from "@/modules/users/dal/user.dal";
import { parseUpdateUserPayload } from "@/modules/users/validation/user.validation";

/**
 * BFF for a single user. No `DELETE` — FastAPI's soft delete is on the model
 * and no controller exposes it. Role assignment has its own route at
 * `PATCH /api/users/[id]/roles`, and password changes only ever act on the
 * caller, so neither belongs in the `PUT` body here.
 */

export async function GET(
  _request: NextRequest,
  context: RouteContext<"/api/users/[id]">,
) {
  try {
    await requireUser();

    const { id } = await context.params;

    return Response.json({ data: await getUser(id) });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function PUT(
  request: NextRequest,
  context: RouteContext<"/api/users/[id]">,
) {
  try {
    await requireUser();

    const { id } = await context.params;
    const payload = parseUpdateUserPayload(
      await request.json().catch(() => null),
    );

    return Response.json({ data: await updateUser(id, payload) });
  } catch (error) {
    return toErrorResponse(error);
  }
}
