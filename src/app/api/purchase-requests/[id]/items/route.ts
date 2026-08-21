import type { NextRequest } from "next/server";

import { toErrorResponse } from "@/lib/api/errors";
import { PERMISSIONS } from "@/modules/auth/constants/permissions";
import { requirePermission } from "@/modules/auth/dal/access";
import { processPurchaseRequestItems } from "@/modules/purchase-requests/dal/purchase-request.dal";
import { parseProcessItemsPayload } from "@/modules/purchase-requests/validation/purchase-request.validation";

/**
 * Approves or rejects a set of the request's items in one call.
 *
 * A different grant from the single-item route beside it: upstream gates this
 * one on `purchase_request_item.mass-process` and that one on
 * `purchase_request_item.process`, so holding either says nothing about the
 * other. FastAPI answers 200 with a `{}` body; there is nothing to hand back,
 * so this returns a 204 like the request's other write routes.
 */
export async function PATCH(
  request: NextRequest,
  context: RouteContext<"/api/purchase-requests/[id]/items">,
) {
  try {
    await requirePermission(PERMISSIONS.purchaseRequestItem.massProcess);

    const { id } = await context.params;

    await processPurchaseRequestItems(
      id,
      parseProcessItemsPayload(await request.json()),
    );

    return new Response(null, { status: 204 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
