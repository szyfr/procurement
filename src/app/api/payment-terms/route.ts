import type { NextRequest } from "next/server";

import { toErrorResponse } from "@/lib/api/errors";
import { readPageParam } from "@/lib/api/pagination";
import { requireUser } from "@/modules/auth/dal/auth.dal";
import { DEFAULT_PAGE_SIZE } from "@/modules/payment-terms/constants";
import {
  createPaymentTerm,
  listPaymentTerms,
} from "@/modules/payment-terms/dal/payment-term.dal";
import { parsePaymentTermPayload } from "@/modules/payment-terms/validation/payment-term.validation";

/**
 * BFF for the payment term collection. Serves both the Payment Terms
 * management screen and the quotation form's picker — the picker passes its
 * own `pageSize` and `search` and reads the records as they arrive.
 */

export async function GET(request: NextRequest) {
  try {
    await requireUser();

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
    await requireUser();

    const payload = parsePaymentTermPayload(
      await request.json().catch(() => null),
    );

    const created = await createPaymentTerm(payload);

    return Response.json({ data: created }, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
