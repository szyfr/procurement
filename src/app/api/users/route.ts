import type { NextRequest } from "next/server";

import { toErrorResponse } from "@/lib/api/errors";
import { readPageParam } from "@/lib/api/pagination";
import { requireUser } from "@/modules/auth/dal/auth.dal";
import { DEFAULT_PAGE_SIZE } from "@/modules/users/constants";
import { listUsers } from "@/modules/users/dal/user.dal";

/** BFF for the user collection. No `POST` — the backend has no create endpoint. */

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
