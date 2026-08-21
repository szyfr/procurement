import type { NextRequest } from "next/server";

import { toErrorResponse } from "@/lib/api/errors";
import { PERMISSIONS } from "@/modules/auth/constants/permissions";
import { requirePermission } from "@/modules/auth/dal/access";
import { assignPurchaseRequestItemVendors } from "@/modules/purchase-requests/dal/purchase-request.dal";
import { parseAssignVendorPayload } from "@/modules/purchase-requests/validation/purchase-request.validation";

/**
 * Gives a set of the request's items a vendor in one call. FastAPI answers
 * 200 with a `{}` body; there is nothing to hand back, so this returns a 204
 * like the request's other write routes.
 */
export async function PATCH(
  request: NextRequest,
  context: RouteContext<"/api/purchase-requests/[id]/items/assign-vendor">,
) {
  try {
    await requirePermission(PERMISSIONS.purchaseRequestItem.assignVendor);

    const { id } = await context.params;

    await assignPurchaseRequestItemVendors(
      id,
      parseAssignVendorPayload(await request.json()),
    );

    return new Response(null, { status: 204 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
