import type { NextRequest } from "next/server";

import { toErrorResponse } from "@/lib/api/errors";
import { readPageParam } from "@/lib/api/pagination";
import { requireUser } from "@/modules/auth/dal/auth.dal";
import { DEFAULT_PAGE_SIZE } from "@/modules/users/constants";
import { createUser, listUsers } from "@/modules/users/dal/user.dal";
import { parseCreateUserPayload } from "@/modules/users/validation/user.validation";

/**
 * BFF for the user collection.
 *
 * `POST` here rather than under `/api/auth/register`: FastAPI creates users
 * through `/auth/register`, but routes under `/api/auth/*` are the ones exempt
 * from `requireUser()`, and registration upstream has no auth of its own.
 * Keeping it on the users collection is what puts an admin gate in front of it.
 */

export async function GET(request: NextRequest) {
  try {
    await requireUser();

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
