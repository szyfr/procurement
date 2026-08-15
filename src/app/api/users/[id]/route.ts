import type { NextRequest } from "next/server";

import { toErrorResponse } from "@/lib/api/errors";
import { requireUser } from "@/modules/auth/dal/auth.dal";
import { getUser } from "@/modules/users/dal/user.dal";

/**
 * BFF for a single user. No `PUT`/`DELETE` here — the only write the backend
 * exposes for users is role assignment, at `PATCH /api/users/[id]/roles`.
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
