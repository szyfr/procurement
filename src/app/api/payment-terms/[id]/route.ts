import type { NextRequest } from "next/server";

import { toErrorResponse } from "@/lib/api/errors";
import { requireUser } from "@/modules/auth/dal/auth.dal";
import {
  deletePaymentTerm,
  getPaymentTerm,
  updatePaymentTerm,
} from "@/modules/payment-terms/dal/payment-term.dal";
import { parsePaymentTermPayload } from "@/modules/payment-terms/validation/payment-term.validation";

export async function GET(
  _request: NextRequest,
  context: RouteContext<"/api/payment-terms/[id]">,
) {
  try {
    await requireUser();

    const { id } = await context.params;

    return Response.json({ data: await getPaymentTerm(id) });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function PUT(
  request: NextRequest,
  context: RouteContext<"/api/payment-terms/[id]">,
) {
  try {
    await requireUser();

    const { id } = await context.params;
    const payload = parsePaymentTermPayload(
      await request.json().catch(() => null),
    );

    const updated = await updatePaymentTerm(id, payload);

    return Response.json({ data: updated });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function DELETE(
  _request: NextRequest,
  context: RouteContext<"/api/payment-terms/[id]">,
) {
  try {
    await requireUser();

    const { id } = await context.params;

    await deletePaymentTerm(id);

    return new Response(null, { status: 204 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
