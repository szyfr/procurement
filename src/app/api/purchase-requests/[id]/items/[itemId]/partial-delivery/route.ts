import type { NextRequest } from "next/server";

import { toErrorResponse } from "@/lib/api/errors";
import { requireUser } from "@/modules/auth/dal/auth.dal";
import { recordPartialDelivery } from "@/modules/purchase-requests/dal/purchase-request.dal";
import { parsePartialDeliveryPayload } from "@/modules/purchase-requests/validation/purchase-request.validation";

/**
 * Records how much of one item arrived. FastAPI answers 200 with an empty
 * body; there is nothing to hand back, so this returns a 204 like the
 * request's other write routes.
 */
export async function PATCH(
  request: NextRequest,
  context: RouteContext<"/api/purchase-requests/[id]/items/[itemId]/partial-delivery">,
) {
  try {
    await requireUser();

    const { id, itemId } = await context.params;

    await recordPartialDelivery(
      id,
      itemId,
      parsePartialDeliveryPayload(await request.json()),
    );

    return new Response(null, { status: 204 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
