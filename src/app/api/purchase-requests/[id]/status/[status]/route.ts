import type { NextRequest } from "next/server";

import { toErrorResponse } from "@/lib/api/errors";
import { requireUser } from "@/modules/auth/dal/auth.dal";
import { updatePurchaseRequestStatus } from "@/modules/purchase-requests/dal/purchase-request.dal";
import { parseSettableStatus } from "@/modules/purchase-requests/validation/purchase-request.validation";

/**
 * Status transitions for a purchase request. Mirrors FastAPI's
 * `PATCH /purchase-requests/{id}/status/{status}`, which is the only write that
 * cascades the new status onto the request's items.
 *
 * The path stays open-ended like the backend's, but `parseSettableStatus`
 * narrows it to what the UI is allowed to set. FastAPI answers with a 204
 * carrying a body; this returns a proper empty 204.
 */
export async function PATCH(
  _request: NextRequest,
  context: RouteContext<"/api/purchase-requests/[id]/status/[status]">,
) {
  try {
    await requireUser();

    const { id, status } = await context.params;

    await updatePurchaseRequestStatus(id, parseSettableStatus(status));

    return new Response(null, { status: 204 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
