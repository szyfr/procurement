import type { NextRequest } from "next/server";

import { toErrorResponse } from "@/lib/api/errors";
import { requireUser } from "@/modules/auth/dal/auth.dal";
import {
  deletePurchaseRequest,
  getPurchaseRequest,
  updatePurchaseRequest,
} from "@/modules/purchase-requests/dal/purchase-request.dal";
import { parseUpdatePayload } from "@/modules/purchase-requests/validation/purchase-request.validation";

/**
 * BFF for a single purchase request.
 *
 * FastAPI answers `PUT` with 201 and `DELETE` with a 204 that carries a body;
 * both are normalized here so the frontend sees ordinary 200/204 responses.
 */

export async function GET(
  _request: NextRequest,
  context: RouteContext<"/api/purchase-requests/[id]">,
) {
  try {
    await requireUser();

    const { id } = await context.params;

    return Response.json({ data: await getPurchaseRequest(id) });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function PUT(
  request: NextRequest,
  context: RouteContext<"/api/purchase-requests/[id]">,
) {
  try {
    await requireUser();

    const { id } = await context.params;
    const body = await request.json().catch(() => null);

    const updated = await updatePurchaseRequest(id, parseUpdatePayload(body));

    return Response.json({ data: updated });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function DELETE(
  _request: NextRequest,
  context: RouteContext<"/api/purchase-requests/[id]">,
) {
  try {
    await requireUser();

    const { id } = await context.params;

    await deletePurchaseRequest(id);

    return new Response(null, { status: 204 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
