import type { NextRequest } from "next/server";

import { toErrorResponse } from "@/lib/api/errors";
import { getPurchaseRequestProof } from "@/modules/purchase-requests/dal/purchase-request-proof.dal";

/**
 * BFF for a single proof of order. Mirrors FastAPI's
 * `GET /purchase-request-proofs/{id}`, the only read that carries the
 * uploaded documents — the `proofs` join on the request detail does not.
 */
export async function GET(
  _request: NextRequest,
  context: RouteContext<"/api/purchase-requests/proofs/[id]">,
) {
  try {
    const { id } = await context.params;

    return Response.json({ data: await getPurchaseRequestProof(id) });
  } catch (error) {
    return toErrorResponse(error);
  }
}
