import type { NextRequest } from "next/server";

import { toErrorResponse } from "@/lib/api/errors";
import { DEFAULT_PAGE_SIZE, readPageParam } from "@/lib/api/pagination";
import { parseTitleDescriptionPayload } from "@/lib/api/validation";
import { PERMISSIONS } from "@/modules/auth/constants/permissions";
import { requirePermission } from "@/modules/auth/dal/access";
import {
  createPaymentTerm,
  listPaymentTerms,
} from "@/modules/payment-terms/dal/payment-term.dal";

/**
 * BFF for the payment term collection. Serves both the Payment Terms
 * management screen and the quotation form's picker — the picker passes its
 * own `pageSize` and `search` and reads the records as they arrive.
 */

export async function GET(request: NextRequest) {
  try {
    await requirePermission(PERMISSIONS.paymentTerm.index);

    const { searchParams } = request.nextUrl;

    const result = await listPaymentTerms({
      page: readPageParam(searchParams.get("page"), 1),
      pageSize: readPageParam(searchParams.get("pageSize"), DEFAULT_PAGE_SIZE),
      search: searchParams.get("search"),
    });

    return Response.json({ data: result });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requirePermission(PERMISSIONS.paymentTerm.write);

    const payload = parseTitleDescriptionPayload(
      await request.json().catch(() => null),
    );

    const created = await createPaymentTerm(payload);

    return Response.json({ data: created }, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
