import type { NextRequest } from "next/server";

import { toErrorResponse } from "@/lib/api/errors";
import {
  getQuotation,
  updateQuotation,
} from "@/modules/canvassing/dal/quotation.dal";
import { parseQuotationForm } from "@/modules/canvassing/validation/quotation.validation";

/**
 * BFF for a single quotation. Mirrors FastAPI's `GET /quotations/{id}`, the
 * only read that carries attachments — the list endpoints join neither.
 *
 * The PUT is `multipart/form-data` for the same reason the create is, and
 * takes the identical fields; it replaces the quote rather than patching it,
 * so the browser sends the whole thing back. See the DAL for what that costs.
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

export async function PUT(
  request: NextRequest,
  context: RouteContext<"/api/canvassing/quotations/[id]">,
) {
  try {
    const { id } = await context.params;
    const { payload, attachments } = parseQuotationForm(
      await request.formData(),
    );

    return Response.json({
      data: await updateQuotation(id, payload, attachments),
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}
