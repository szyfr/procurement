import { bffRequest } from "@/lib/api/bff-client";
import type { Paginated } from "@/lib/api/pagination";
import { canvassingEndpoints } from "@/modules/canvassing/api/endpoints";
import {
  buildQuotationForm,
  type CreateQuotationDto,
} from "@/modules/canvassing/dto";
import type { AwardQuotationResult } from "@/modules/canvassing/models/award";
import type { CanvassingEntry } from "@/modules/canvassing/models/canvassing";
import type {
  ItemQuotations,
  Quotation,
  QuotationDetail,
} from "@/modules/canvassing/models/quotation";

export interface ListCanvassingParams {
  page?: number;
  signal?: AbortSignal;
}

export function fetchCanvassing({ page, signal }: ListCanvassingParams = {}) {
  return bffRequest<Paginated<CanvassingEntry>>(canvassingEndpoints.list, {
    query: { page },
    signal,
  });
}

/** The quotes covering each of the given purchase request items. */
export function fetchCanvassingQuotations(
  itemIds: string[],
  signal?: AbortSignal,
) {
  return bffRequest<ItemQuotations[]>(canvassingEndpoints.quotations, {
    query: { items: itemIds },
    signal,
  });
}

/** One quotation in full, including its attachments. */
export function fetchQuotation(quotationId: string, signal?: AbortSignal) {
  return bffRequest<QuotationDetail>(
    canvassingEndpoints.quotation(quotationId),
    { signal },
  );
}

/**
 * Records a vendor's quote. Goes up as `multipart/form-data` rather than JSON
 * because the upstream endpoint takes attachments, and the parts carry the
 * upstream's own field names — the Route Handler validates them and passes
 * them straight on.
 */
export function createQuotation({
  payload,
  attachments = [],
}: {
  payload: CreateQuotationDto;
  attachments?: File[];
}) {
  const form = buildQuotationForm(payload, attachments);

  return bffRequest<Quotation>(canvassingEndpoints.quotations, {
    method: "POST",
    body: form,
  });
}

/**
 * Rewrites an existing quote, in the same `multipart/form-data` contract the
 * create uses. The upstream replaces rather than patches, so `payload` has to
 * carry every field the quote keeps — `item_pricing` included, down to the
 * rows the user didn't touch.
 *
 * `attachments` are additions only; the upstream can't remove a document
 * without one being added in the same call, so nothing here offers to.
 */
export function updateQuotation({
  quotationId,
  payload,
  attachments = [],
}: {
  quotationId: string;
  payload: CreateQuotationDto;
  attachments?: File[];
}) {
  const form = buildQuotationForm(payload, attachments);

  return bffRequest<Quotation>(canvassingEndpoints.quotation(quotationId), {
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
  return bffRequest<AwardQuotationResult>(
    canvassingEndpoints.award(quotationId),
    { method: "PATCH", body: { items: itemIds } },
  );
}
