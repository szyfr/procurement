import type { StatusTone } from "@/lib/types";
import type { CanvassingStatus } from "@/modules/canvassing/models/canvassing";
import type { Quotation } from "@/modules/canvassing/models/quotation";

/**
 * Status → pill tone. There is no matching label map: the backend derives each
 * row's status and sends the finished copy, so the value *is* the label.
 *
 * Declaration order is sourcing order, which is the order the filter lists them
 * in. Tones match the ones the mock list used for the equivalent stages.
 */
export const canvassingStatusTone: Record<CanvassingStatus, StatusTone> = {
  "Awaiting Quotation": "info",
  "Ready for Comparison": "neutral",
  "Vendor Selected": "success",
};

/**
 * How a quote names its vendor. The join is preserved-null, so it can be
 * missing entirely; synced vendors may also arrive with a blank `name`, which
 * is why `no` stands in before the em-dash.
 */
export function quotationVendorLabel(quotation: Quotation | null | undefined) {
  const vendor = quotation?.vendor;

  return vendor?.name?.trim() || vendor?.no || null;
}

/** The statuses a row can carry, for the Status filter. */
export const canvassingStatusOptions = Object.keys(
  canvassingStatusTone,
) as CanvassingStatus[];
