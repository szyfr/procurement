import type { NextRequest } from "next/server";

import { toErrorResponse } from "@/lib/api/errors";
import { PERMISSIONS } from "@/modules/auth/constants/permissions";
import { requirePermission } from "@/modules/auth/dal/access";
import { awardQuotation } from "@/modules/canvassing/dal/canvassing.dal";
import { parseAwardItems } from "@/modules/canvassing/validation/award.validation";

/**
 * BFF for awarding a quotation. Mirrors FastAPI's
 * `PATCH /canvassing/award/{quotation_id}`, whose body is the list of purchase
 * request items the quote wins.
 *
 * The upstream answers 200 with `{ awards, issues }` — inserted award
 * documents carry no joins, so the browser refetches the comparison rather
 * than reading them, but `issues` (an item that already had an award on
 * record) is meant to be shown, not just logged.
 */
export async function PATCH(
  request: NextRequest,
  context: RouteContext<"/api/canvassing/award/[quotationId]">,
) {
  try {
    await requirePermission(PERMISSIONS.canvassing.award);

    const { quotationId } = await context.params;
    const items = parseAwardItems(await request.json().catch(() => null));

    return Response.json({ data: await awardQuotation(quotationId, items) });
  } catch (error) {
    return toErrorResponse(error);
  }
}
