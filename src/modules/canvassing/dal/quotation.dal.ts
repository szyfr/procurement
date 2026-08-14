import { serverFetch } from "@/lib/api/fetcher";
import { assertObjectId } from "@/lib/api/object-id";
import { getCurrentUser } from "@/modules/auth/dal/auth.dal";
import { userId } from "@/modules/auth/models/session";
import {
  buildQuotationForm,
  type CreateQuotationInput,
  type UpdateQuotationInput,
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
 * carries no documents, so the quotation detail sheet reads this instead — and
 * so does the edit form, which needs the same fields to seed itself.
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

/**
 * Rewrites an existing quote.
 *
 * `PUT /quotations/{id}` depends on the same `get_quotation_create` the POST
 * does, so this is a full replace in `multipart/form-data`, not a patch — a
 * missing field is a 422 upstream, never a "leave it alone". The all-optional
 * `QuotationUpdate` schema the router imports is never reached.
 *
 * Two consequences worth naming: the response is the bare updated document
 * with no `documents` join, so it is a `Quotation` and not a `QuotationDetail`;
 * and `user_id` is written on every update, so the quote's recorded user
 * becomes whoever edited it last. Nothing upstream keeps the original author.
 *
 * Any `attachments` are added to the quote — the endpoint's `to_delete` is a
 * repeated query param whose handling is nested inside its "did anything get
 * uploaded" branch, so removal can't be offered reliably and isn't sent.
 */
export async function updateQuotation(
  id: string,
  input: UpdateQuotationInput,
  attachments: File[] = [],
): Promise<Quotation> {
  assertObjectId(id, QUOTATION_NOT_FOUND);

  // Same reasoning as the create: the session picks the user, never the browser.
  const user = await getCurrentUser();

  const form = buildQuotationForm(
    { ...input, user_id: userId(user) },
    attachments,
  );

  return serverFetch<Quotation>(`/quotations/${id}`, {
    method: "PUT",
    body: form,
  });
}
