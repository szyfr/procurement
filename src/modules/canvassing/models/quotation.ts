import type { PaymentTerm } from "@/modules/payment-terms";
import type { Material } from "@/modules/purchase-requests";
import type { Vendor } from "@/modules/vendors";

/**
 * The quotation responses, verbatim.
 *
 * `GET /canvassing/quotations` differs from every other list in the app: it
 * declares no `response_model`, returns raw aggregation output, and answers
 * with a **bare array** rather than the shared `{ data, pagination }` envelope.
 * It takes `items` repeated once per id (`items=a&items=b`).
 */

/** The price one quote puts on one purchase request item. */
export interface QuotationItemPricing {
  item_id: string;
  unit_price: number;
}

/**
 * A vendor's quote. It may price several items at once, which is why the
 * comparison response groups the same quotation under every item it covers.
 *
 * The pipeline joins the vendor and payment term and projects the two ids away,
 * so a quote carries the resolved documents and never `vendor_id` /
 * `payment_term_id`. Both `$unwind`s preserve rows whose lookup missed, which
 * drops the key entirely — hence the optional joins.
 */
export interface Quotation {
  _id: string;
  reference_no: string;
  date: string;
  delivery_date: string;
  item_pricing: QuotationItemPricing[];
  vendor?: Vendor | null;
  payment_term?: PaymentTerm | null;
  /** Who recorded the quote. There is no user join, so this stays an id. */
  user_id: string;
  created_at: string;
  updated_at: string;
}

/** One file attached to a quotation. `url` is presigned and time-limited. */
export interface QuotationDocument {
  _id: string;
  filename: string;
  url: string;
}

/**
 * `GET /quotations/{id}` — the only read that carries attachments. The list
 * endpoints never join them, so this is the sole source for a quote's files.
 */
export interface QuotationDetail extends Quotation {
  documents: QuotationDocument[];
}

/**
 * One purchase request item with the quotes that cover it.
 *
 * Unlike `CanvassingEntry`, `status` here is the item's stored status — the
 * list endpoint's derived labels come from a pipeline this one doesn't run, so
 * the two are not interchangeable despite the shared shape.
 */
export interface ItemQuotations {
  _id: string;
  quantity: number;
  status: string;
  is_needs_canvass: boolean | null;
  purchase_request_id: string;
  vendor_id: string | null;
  created_at: string;
  updated_at: string;
  /**
   * A quotation is attached only if it prices this item, so the array is empty
   * for an item nobody has quoted yet.
   */
  quotations: Quotation[];
  /**
   * The `$unwind` preserves rows whose material lookup missed, dropping the
   * key. The pipeline projects `material_id` away, so when the join misses
   * there is nothing left to identify the item by.
   */
  material?: Material | null;
  /**
   * The winning quote, set by `PATCH /canvassing/award/{quotation_id}` alongside
   * `status: "quotation-awarded"`. Absent (not just null) on older items awarded
   * before this field existed.
   *
   * There is no award timestamp to go with it — only the item's ordinary
   * `updated_at`, which nothing distinguishes from any other write — so the
   * comparison shows no award date.
   */
  quotation_id?: string | null;
}
