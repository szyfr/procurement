import type { QuotationItemPricing } from "@/modules/canvassing/models/quotation";

/**
 * What the UI submits to record a quote — `POST /quotations`, in the field
 * names the endpoint declares.
 *
 * The write is `multipart/form-data` because it accepts attachments, and every
 * scalar is a form part rather than a JSON key. Attachments travel alongside
 * this rather than inside it: the payload has to survive being read back out of
 * a `FormData`, and files don't round-trip through that the way scalars do.
 *
 * There is no response DTO. The endpoint answers with the bare inserted
 * document — the `Quotation` model — and the caller only reads `reference_no`
 * off it before refetching the comparison.
 *
 * `user_id` is absent by design; the DAL fills it in from the session.
 */
export interface CreateQuotationInput {
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
 * `get_quotation_create`'s form fields in full, as sent upstream. `user_id` is
 * declared `Form(...)` with no default and parsed as an ObjectId, so the write
 * is refused without it.
 */
export interface CreateQuotationDto extends CreateQuotationInput {
  user_id: string;
}

/**
 * Serializes a quote into the `multipart/form-data` body `POST /quotations`
 * expects — every scalar as its own part, `item_pricing` as a single JSON
 * string part, attachments appended last. Shared by the browser client and
 * the server DAL so the two can't drift on field names or ordering. Only the
 * server half has a `user_id` to contribute, hence the conditional part.
 */
export function buildQuotationForm(
  payload: CreateQuotationInput | CreateQuotationDto,
  attachments: File[] = [],
): FormData {
  const form = new FormData();

  form.set("reference_no", payload.reference_no);
  form.set("date", payload.date);
  form.set("delivery_date", payload.delivery_date);
  form.set("vendor_id", payload.vendor_id);
  form.set("payment_term_id", payload.payment_term_id);
  form.set("item_pricing", JSON.stringify(payload.item_pricing));

  if ("user_id" in payload) form.set("user_id", payload.user_id);

  for (const attachment of attachments) {
    form.append("attachments", attachment, attachment.name);
  }

  return form;
}
