import type { NextRequest } from "next/server";

import { toErrorResponse } from "@/lib/api/errors";
import { PERMISSIONS } from "@/modules/auth/constants/permissions";
import { requirePermission } from "@/modules/auth/dal/access";
import { processPurchaseRequestItem } from "@/modules/purchase-requests/dal/purchase-request.dal";
import { parseProcessItemPayload } from "@/modules/purchase-requests/validation/purchase-request.validation";

/**
 * Approves or rejects one of the request's items. Approving is what creates
 * the purchase order upstream — see the DAL. FastAPI answers 200 with a `{}`
 * body, so this returns a 204 like the request's other write routes.
 */
export async function PATCH(
  request: NextRequest,
  context: RouteContext<"/api/purchase-requests/[id]/items/[itemId]">,
) {
  try {
    await requirePermission(PERMISSIONS.purchaseRequestItem.process);

    const { id, itemId } = await context.params;

    await processPurchaseRequestItem(
      id,
      itemId,
      parseProcessItemPayload(await request.json()),
    );

    return new Response(null, { status: 204 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
