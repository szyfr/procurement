import { serverFetch } from "@/lib/api/fetcher";
import { assertObjectId } from "@/lib/api/object-id";
import { getCurrentUser } from "@/modules/auth/dal/auth.dal";
import { userId } from "@/modules/auth/models/session";
import {
  buildQuotationForm,
  type CreateQuotationInput,
} from "@/modules/canvassing/dto";
import type {
  ItemQuotations,
  Quotation,
  QuotationDetail,
} from "@/modules/canvassing/models/quotation";

/**
 * Quote reads and writes against FastAPI. Server-side only, called from Route
 * Handlers — never from a component. The upstream response is handed back as
 * it arrived.
 *
 * The read hangs off `/canvassing`, but quotations are their own top-level
 * router upstream, so the write posts to `/quotations` instead.
 */

const NOT_FOUND = "We couldn't find that item.";
const QUOTATION_NOT_FOUND = "We couldn't find that quotation.";

/**
 * The quotes covering each of the given purchase request items.
 *
 * `items` repeats once per id upstream. The response is a bare array, not the
 * paginated envelope the other lists use, and it comes back in whatever order
 * the aggregation produced — callers that care about order should sort.
 */
export function listItemQuotations(
  itemIds: string[],
): Promise<ItemQuotations[]> {
  // Asking for nothing is a legitimate state: a request whose items all source
  // directly has no ids to send.
  if (itemIds.length === 0) return Promise.resolve([]);

  for (const itemId of itemIds) assertObjectId(itemId, NOT_FOUND);

  return serverFetch<ItemQuotations[]>("/canvassing/quotations", {
    query: { items: itemIds },
  });
}

/**
 * One quotation in full, including its attachments. `GET /canvassing/quotations`
 * carries no documents, so the "view quotation" dialog reads this instead.
 */
export function getQuotation(id: string): Promise<QuotationDetail> {
  assertObjectId(id, QUOTATION_NOT_FOUND);

  return serverFetch<QuotationDetail>(`/quotations/${id}`);
}

/**
 * Records a vendor's quote for one or more items.
 *
 * The endpoint is `multipart/form-data` because it accepts attachments, and
 * every scalar is a form part rather than a JSON key. Two of its quirks are
 * worth naming: `item_pricing` is a JSON *string* inside a single part — not
 * repeated fields and not bracket notation — and the path must not carry a
 * trailing slash, which would earn a 307 instead of a write.
 *
 * The form is rebuilt from the validated payload rather than forwarded from
 * the Route Handler, so nothing reaches FastAPI that hasn't been checked.
 */
export async function createQuotation(
  input: CreateQuotationInput,
  attachments: File[] = [],
): Promise<Quotation> {
  // Supplied server-side from the session cookie; the browser never picks the
  // user a quote is recorded under. Also means an unauthenticated POST fails
  // here with the same 401 `getCurrentUser` throws for any other read.
  const user = await getCurrentUser();

  const form = buildQuotationForm(
    { ...input, user_id: userId(user) },
    attachments,
  );

  // Answers 200 with the bare inserted document — no `{ data }` envelope and
  // no uploaded-document list, so there is nothing else to read back.
  return serverFetch<Quotation>("/quotations", {
    method: "POST",
    body: form,
  });
}
