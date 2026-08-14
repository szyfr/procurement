import { queryOptions } from "@tanstack/react-query";

import {
  fetchCanvassing,
  fetchCanvassingQuotations,
  fetchQuotation,
} from "@/modules/canvassing/api/client";

export const canvassingKeys = {
  all: ["canvassing"] as const,
  list: (page: number) => ["canvassing", page] as const,
  // Sorted, so the same set of items is one cache entry however it was ordered.
  quotations: (itemIds: string[]) =>
    ["canvassing", "quotations", [...itemIds].sort()] as const,
  quotation: (quotationId: string) =>
    ["canvassing", "quotation", quotationId] as const,
};

export function canvassingListQuery(page: number) {
  return queryOptions({
    queryKey: canvassingKeys.list(page),
    // TanStack supplies an AbortSignal it aborts when the query is cancelled,
    // which covers unmount and page changes.
    queryFn: ({ signal }) => fetchCanvassing({ page, signal }),
  });
}

export function canvassingQuotationsQuery(itemIds: string[]) {
  return queryOptions({
    queryKey: canvassingKeys.quotations(itemIds),
    queryFn: ({ signal }) => fetchCanvassingQuotations(itemIds, signal),
    // The ids come from the purchase request, so this waits for that query.
    enabled: itemIds.length > 0,
  });
}

/**
 * A single quotation, including its attachments. The comparison enables this
 * only while the detail sheet is open, so it isn't fetched per row; the edit
 * form runs it unconditionally, seeding itself from the same cache entry.
 */
export function quotationDetailQuery(quotationId: string) {
  return queryOptions({
    queryKey: canvassingKeys.quotation(quotationId),
    queryFn: ({ signal }) => fetchQuotation(quotationId, signal),
  });
}
