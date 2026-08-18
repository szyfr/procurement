import type { NextRequest } from "next/server";

import { toErrorResponse } from "@/lib/api/errors";
import { PERMISSIONS } from "@/modules/auth/constants/permissions";
import { requirePermission } from "@/modules/auth/dal/access";
import { createPurchaseRequestProof } from "@/modules/purchase-requests/dal/purchase-request-proof.dal";
import { parseCreatePurchaseRequestProofForm } from "@/modules/purchase-requests/validation/purchase-request-proof.validation";

export async function POST(request: NextRequest) {
  try {
    await requirePermission(PERMISSIONS.purchaseRequestProof.store);

    const { payload, attachments } = parseCreatePurchaseRequestProofForm(
      await request.formData(),
    );

    const created = await createPurchaseRequestProof(payload, attachments);

    return Response.json({ data: created }, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
