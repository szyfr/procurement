import type { NextRequest } from "next/server";

import { toErrorResponse } from "@/lib/api/errors";
import { requireUser } from "@/modules/auth/dal/auth.dal";
import { markPurchaseRequestDelivered } from "@/modules/purchase-requests/dal/purchase-request.dal";
import { parseMarkDeliveredPayload } from "@/modules/purchase-requests/validation/purchase-request.validation";

/**
 * Records delivery for a set of the request's items. Mirrors FastAPI's
 * `PATCH /purchase-requests/{id}/delivered`, which answers with a 204 carrying
 * a body; this returns a proper empty 204.
 */
export async function PATCH(
  request: NextRequest,
  context: RouteContext<"/api/purchase-requests/[id]/delivered">,
) {
  try {
    await requireUser();

    const { id } = await context.params;

    await markPurchaseRequestDelivered(
      id,
      parseMarkDeliveredPayload(await request.json()),
    );

    return new Response(null, { status: 204 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
