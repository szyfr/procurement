import type { NextRequest } from "next/server";

import { toErrorResponse } from "@/lib/api/errors";
import { DEFAULT_PAGE_SIZE, readPageParam } from "@/lib/api/pagination";
import { PERMISSIONS } from "@/modules/auth/constants/permissions";
import { requirePermission } from "@/modules/auth/dal/access";
import { requireUser } from "@/modules/auth/dal/auth.dal";
import { createUser, listUsers } from "@/modules/users/dal/user.dal";
import { parseCreateUserPayload } from "@/modules/users/validation/user.validation";

/**
 * BFF for the user collection.
 *
 * `POST` here rather than under `/api/auth/register`: FastAPI creates users
 * through `/auth/register`, but routes under `/api/auth/*` are the ones exempt
 * from `requireUser()`, and registration upstream has no auth of its own.
 * Keeping it on the users collection is what puts an admin gate in front of it.
 *
 * That gate stays `requireUser()` rather than a permission: `/auth/register` is
 * the one write in the API with no `require_permission` on it, so there is no
 * slug to check and none to grant. Anyone signed in can create a user — a
 * backend gap, not something this layer can close by inventing a permission.
 */

export async function GET(request: NextRequest) {
  try {
    await requirePermission(PERMISSIONS.user.index);

    const { searchParams } = request.nextUrl;

    const result = await listUsers({
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
    await requireUser();

    const payload = parseCreateUserPayload(
      await request.json().catch(() => null),
    );

    return Response.json({ data: await createUser(payload) }, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
