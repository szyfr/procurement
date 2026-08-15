import type { NextRequest } from "next/server";

import { toErrorResponse } from "@/lib/api/errors";
import { MAX_PAGE_SIZE, readPageParam } from "@/lib/api/pagination";
import { requireUser } from "@/modules/auth/dal/auth.dal";
import { listDepartments } from "@/modules/purchase-requests/dal/lookup.dal";

/**
 * Departments for the create form and the list's department filter.
 *
 * Scoped under `purchase-requests/lookups` on purpose: departments have no
 * module of their own yet, and this route exists only to serve Purchase
 * Requests screens. It should move to a Departments module when one is built.
 */
export async function GET(request: NextRequest) {
  try {
    await requireUser();

    const { searchParams } = request.nextUrl;

    const result = await listDepartments({
      page: readPageParam(searchParams.get("page"), 1),
      // The whole collection fits in one page today, so the picker normally
      // makes a single request.
      pageSize: readPageParam(searchParams.get("pageSize"), MAX_PAGE_SIZE),
    });

    return Response.json({ data: result });
  } catch (error) {
    return toErrorResponse(error);
  }
}
