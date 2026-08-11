import type { QuotationItemPricing } from "@/modules/canvassing/models/quotation";

/**
 * What the UI submits to record a quote — `POST /quotations`, in the field
 * names the endpoint declares.
 *
 * `PUT /quotations/{id}` takes the same shape: it declares the identical
 * `get_quotation_create` dependency upstream, so there is no separate update
 * DTO. That endpoint is a full replace rather than a patch — it writes every
 * field it is handed, `item_pricing` included — so a caller editing a quote
 * has to send the whole thing back, not just what changed.
 *
 * The write is `multipart/form-data` because it accepts attachments, and every
 * scalar is a form part rather than a JSON key. Attachments travel alongside
 * this rather than inside it: the payload has to survive being read back out of
 * a `FormData`, and files don't round-trip through that the way scalars do.
 *
 * There is no response DTO. The endpoint answers with the bare inserted
 * document — the `Quotation` model — and the caller only reads `reference_no`
 * off it before refetching the comparison.
 */
export interface CreateQuotationDto {
  reference_no: string;
  /** `YYYY-MM-DD`. FastAPI parses these as dates and rejects a time component. */
  date: string;
  delivery_date: string;
  /** The vendor's Mongo `_id` — not the `vendor_id` ERP field of the same name. */
  vendor_id: string;
  payment_term_id: string;
  item_pricing: QuotationItemPricing[];
}

/**
 * Serializes a quote into the `multipart/form-data` body `POST /quotations`
 * and `PUT /quotations/{id}` expect — every scalar as its own part,
 * `item_pricing` as a single JSON string part, attachments appended last.
 * Shared by the browser client and the server DAL so the two can't drift on
 * field names or ordering.
 */
export function buildQuotationForm(
  payload: CreateQuotationDto,
  attachments: File[] = [],
): FormData {
  const form = new FormData();

  form.set("reference_no", payload.reference_no);
  form.set("date", payload.date);
  form.set("delivery_date", payload.delivery_date);
  form.set("vendor_id", payload.vendor_id);
  form.set("payment_term_id", payload.payment_term_id);
  form.set("item_pricing", JSON.stringify(payload.item_pricing));

  for (const attachment of attachments) {
    form.append("attachments", attachment, attachment.name);
  }

  return form;
}
