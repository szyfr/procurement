import type { NextRequest } from "next/server";

import { toErrorResponse } from "@/lib/api/errors";
import { readPageParam } from "@/lib/api/pagination";
import { PERMISSIONS } from "@/modules/auth/constants/permissions";
import { requirePermission } from "@/modules/auth/dal/access";
import { DEFAULT_PAGE_SIZE } from "@/modules/purchase-requests/constants";
import {
  createPurchaseRequest,
  listPurchaseRequests,
} from "@/modules/purchase-requests/dal/purchase-request.dal";
import { parseCreatePayload } from "@/modules/purchase-requests/validation/purchase-request.validation";

export async function GET(request: NextRequest) {
  try {
    await requirePermission(PERMISSIONS.purchaseRequest.index);

    const { searchParams } = request.nextUrl;
    const status = searchParams.getAll("status");

    const result = await listPurchaseRequests({
      page: readPageParam(searchParams.get("page"), 1),
      pageSize: readPageParam(searchParams.get("pageSize"), DEFAULT_PAGE_SIZE),
      search: searchParams.get("search") || undefined,
      priority: searchParams.get("priority") || undefined,
      departments: searchParams.get("departments") || undefined,
      status: status.length > 0 ? status : undefined,
    });

    return Response.json({ data: result });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requirePermission(PERMISSIONS.purchaseRequest.store);

    const payload = parseCreatePayload(await request.json().catch(() => null));

    const created = await createPurchaseRequest(payload);

    return Response.json({ data: created }, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
