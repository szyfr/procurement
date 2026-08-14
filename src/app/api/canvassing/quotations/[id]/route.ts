import type { NextRequest } from "next/server";

import { toErrorResponse } from "@/lib/api/errors";
import {
  getQuotation,
  updateQuotation,
} from "@/modules/canvassing/dal/quotation.dal";
import { parseUpdateQuotationForm } from "@/modules/canvassing/validation/quotation.validation";

/**
 * BFF for a single quotation. Mirrors FastAPI's `GET /quotations/{id}`, the
 * only read that carries attachments — the list endpoints join neither.
 */
export async function GET(
  _request: NextRequest,
  context: RouteContext<"/api/canvassing/quotations/[id]">,
) {
  try {
    const { id } = await context.params;

    return Response.json({ data: await getQuotation(id) });
  } catch (error) {
    return toErrorResponse(error);
  }
}

/**
 * Rewrites a quote. `multipart/form-data` rather than JSON, because the
 * upstream `PUT /quotations/{id}` reuses the create parser — so the body is a
 * full quote, attachments included, and never a partial one.
 */
export async function PUT(
  request: NextRequest,
  context: RouteContext<"/api/canvassing/quotations/[id]">,
) {
  try {
    const { id } = await context.params;
    const { payload, attachments } = parseUpdateQuotationForm(
      await request.formData(),
    );

    return Response.json({
      data: await updateQuotation(id, payload, attachments),
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}
