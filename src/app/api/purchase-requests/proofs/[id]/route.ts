import type { NextRequest } from "next/server";

import { toErrorResponse } from "@/lib/api/errors";
import { requireUser } from "@/modules/auth/dal/auth.dal";
import { getPurchaseRequestProof } from "@/modules/purchase-requests/dal/purchase-request-proof.dal";

export async function GET(
  _request: NextRequest,
  context: RouteContext<"/api/purchase-requests/proofs/[id]">,
) {
  try {
    await requireUser();

    const { id } = await context.params;

    return Response.json({ data: await getPurchaseRequestProof(id) });
  } catch (error) {
    return toErrorResponse(error);
  }
}
