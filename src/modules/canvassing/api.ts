import { bffRequest } from "@/lib/api/bff-client";
import type { Paginated } from "@/lib/api/pagination";
import {
  buildQuotationForm,
  type CreateQuotationInput,
  type UpdateQuotationInput,
} from "@/modules/canvassing/dto";
import type { AwardQuotationResult } from "@/modules/canvassing/models/award";
import type { CanvassingEntry } from "@/modules/canvassing/models/canvassing";
import type {
  ItemQuotations,
  Quotation,
  QuotationDetail,
} from "@/modules/canvassing/models/quotation";

const BASE = "/api/canvassing";
const QUOTATIONS = `${BASE}/quotations`;
const quotationPath = (quotationId: string) => `${QUOTATIONS}/${quotationId}`;
/** The awarded quotation is the path segment; the items it wins are the body. */
const awardPath = (quotationId: string) => `${BASE}/award/${quotationId}`;

export interface ListCanvassingParams {
  page?: number;
  signal?: AbortSignal;
}

export function fetchCanvassing({ page, signal }: ListCanvassingParams = {}) {
  return bffRequest<Paginated<CanvassingEntry>>(BASE, {
    query: { page },
    signal,
  });
}

/** The quotes covering each of the given purchase request items. */
export function fetchCanvassingQuotations(
  itemIds: string[],
  signal?: AbortSignal,
) {
  return bffRequest<ItemQuotations[]>(QUOTATIONS, {
    query: { items: itemIds },
    signal,
  });
}

/** One quotation in full, including its attachments. */
export function fetchQuotation(quotationId: string, signal?: AbortSignal) {
  return bffRequest<QuotationDetail>(quotationPath(quotationId), { signal });
}

/**
 * Records a vendor's quote. Goes up as `multipart/form-data` rather than JSON
 * because the upstream endpoint takes attachments, and the parts carry the
 * upstream's own field names — the Route Handler validates them and passes
 * them straight on. `user_id` is not among them — the BFF adds it from the
 * session on the server leg.
 */
export function createQuotation({
  payload,
  attachments = [],
}: {
  payload: CreateQuotationInput;
  attachments?: File[];
}) {
  const form = buildQuotationForm(payload, attachments);

  return bffRequest<Quotation>(QUOTATIONS, {
    method: "POST",
    body: form,
  });
}

/**
 * Rewrites a quote in full. The upstream reuses its create parser, so this is
 * a whole-document replace rather than a patch — every field goes up, in the
 * same `multipart/form-data` shape, with `user_id` again added server-side.
 *
 * `attachments` are only ever *added*: the upstream's file removal reads its
 * list from a query param and only runs when a new upload accompanies it, so
 * the UI doesn't offer removal at all. Existing documents are untouched.
 */
export function updateQuotation({
  quotationId,
  payload,
  attachments = [],
}: {
  quotationId: string;
  payload: UpdateQuotationInput;
  attachments?: File[];
}) {
  const form = buildQuotationForm(payload, attachments);

  return bffRequest<Quotation>(quotationPath(quotationId), {
    method: "PUT",
    body: form,
  });
}

/**
 * Awards a quotation the items it won. `issues` names any item that already
 * had an award on record for that (purchase request, material) pair — the
 * write for it was refused, not applied, so callers should treat it as a
 * validation failure rather than a partial success.
 */
export function awardQuotation({
  quotationId,
  itemIds,
}: {
  quotationId: string;
  itemIds: string[];
}) {
  return bffRequest<AwardQuotationResult>(awardPath(quotationId), {
    method: "PATCH",
    body: { items: itemIds },
  });
}
