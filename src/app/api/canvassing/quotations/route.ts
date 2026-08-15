import type { NextRequest } from "next/server";

import { toErrorResponse } from "@/lib/api/errors";
import { requireUser } from "@/modules/auth/dal/auth.dal";
import {
  createQuotation,
  listItemQuotations,
} from "@/modules/canvassing/dal/quotation.dal";
import { parseCreateQuotationForm } from "@/modules/canvassing/validation/quotation.validation";

/**
 * BFF for the quotes covering a set of purchase request items, and for
 * recording a new one.
 *
 * `items` is repeated once per id (`?items=a&items=b`), matching the upstream
 * `list[str]` parameter — a comma-joined value is rejected by FastAPI.
 *
 * The POST is `multipart/form-data` the whole way through, because the
 * upstream write takes attachments and declares every other field with
 * `Form(...)`.
 */

export async function GET(request: NextRequest) {
  try {
    await requireUser();

    const items = request.nextUrl.searchParams.getAll("items");

    return Response.json({ data: await listItemQuotations(items) });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireUser();

    const { payload, attachments } = parseCreateQuotationForm(
      await request.formData(),
    );

    const created = await createQuotation(payload, attachments);

    return Response.json({ data: created }, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
