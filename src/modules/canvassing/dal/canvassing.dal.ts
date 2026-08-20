import { serverFetch } from "@/lib/api/fetcher";
import { assertObjectId } from "@/lib/api/object-id";
import { clampPageSize, type Paginated } from "@/lib/api/pagination";
import { DEFAULT_PAGE_SIZE } from "@/modules/canvassing/constants";
import type { AwardQuotationResult } from "@/modules/canvassing/models/award";
import type { CanvassingEntry } from "@/modules/canvassing/models/canvassing";

/**
 * Canvassing reads and awards against FastAPI. Server-side only, called from
 * Route Handlers — never from a component. The upstream response is handed
 * back as it arrived.
 *
 * The list and the award live here; the quote comparison is in
 * `quotation.dal.ts`. There is no by-id read for a canvassing case at all.
 */

const NOT_FOUND = "We couldn't find that quotation.";

export interface ListCanvassingQuery {
  page?: number;
  pageSize?: number;
  /** Matches against the item's title and description. */
  search?: string;
}

export function listCanvassing(
  query: ListCanvassingQuery = {},
): Promise<Paginated<CanvassingEntry>> {
  return serverFetch<Paginated<CanvassingEntry>>("/canvassing", {
    query: {
      page: query.page ?? 1,
      page_size: clampPageSize(query.pageSize, DEFAULT_PAGE_SIZE),
      search: query.search,
    },
  });
}

/**
 * Awards a quotation the given purchase request items.
 *
 * Two upstream quirks shape what the UI can promise here:
 *
 * - The award records the *item's* stored `vendor_id`, never the awarded
 *   quotation's. Items routed to canvassing are created without a vendor and no
 *   endpoint sets one, so awarding such an item fails upstream as a 500 until
 *   the backend takes the vendor from the quotation.
 * - Awards are keyed by (purchase request, material); a second one for the same
 *   pair isn't inserted, and comes back as an `issues` entry instead of an
 *   award — the caller renders those as validation, not a thrown error.
 */
export function awardQuotation(
  quotationId: string,
  itemIds: string[],
): Promise<AwardQuotationResult> {
  assertObjectId(quotationId, NOT_FOUND);

  return serverFetch<AwardQuotationResult>(`/canvassing/award/${quotationId}`, {
    method: "PATCH",
    body: { items: itemIds },
  });
}
