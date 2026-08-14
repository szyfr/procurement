import { ApiError } from "@/lib/api/errors";
import { isObjectId } from "@/lib/api/object-id";
import type { CreateQuotationInput } from "@/modules/canvassing/dto";
import type { QuotationItemPricing } from "@/modules/canvassing/models/quotation";

/**
 * Request-body parsing for the quotation Route Handler.
 *
 * This layer earns its keep more than most. `POST /quotations` builds its form
 * fields inside a FastAPI dependency, which runs *before* the handler's own
 * `try` — so a malformed `item_pricing` string or a single bad ObjectId
 * escapes as an opaque 500 rather than a 422 naming the field. Everything the
 * upstream would choke on is therefore checked here first.
 *
 * `validation_failed` is also the one code whose message `toPublicMessage`
 * passes through, so these strings are what the user actually reads.
 */

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function invalid(message: string) {
  return new ApiError(422, "validation_failed", message);
}

function readText(form: FormData, field: string): string {
  const value = form.get(field);
  return typeof value === "string" ? value.trim() : "";
}

function readDate(form: FormData, field: string, label: string): string {
  const value = readText(form, field);

  if (!value) throw invalid(`${label} is required.`);

  // FastAPI parses these as `datetime.date`; anything carrying a time is
  // rejected upstream, and any other shape never reaches a date at all.
  if (!DATE_PATTERN.test(value) || Number.isNaN(Date.parse(value))) {
    throw invalid(`${label} must be a valid date.`);
  }

  return value;
}

function readObjectId(form: FormData, field: string, label: string): string {
  const value = readText(form, field);

  if (!value) throw invalid(`${label} is required.`);
  if (!isObjectId(value)) throw invalid(`${label} is not valid.`);

  return value;
}

function parseItemPricing(raw: string): QuotationItemPricing[] {
  if (!raw) throw invalid("Price at least one item.");

  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch {
    throw invalid("Item pricing couldn't be read.");
  }

  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw invalid("Price at least one item.");
  }

  return parsed.map((entry, index) => {
    const row = entry as Partial<QuotationItemPricing> | null;
    const position = index + 1;

    if (!row || !isObjectId(row.item_id)) {
      throw invalid(`Item ${position} is not a valid purchase request item.`);
    }

    if (!Number.isFinite(row.unit_price) || (row.unit_price as number) < 0) {
      throw invalid(`Item ${position} needs a unit price of zero or more.`);
    }

    return { item_id: row.item_id, unit_price: row.unit_price as number };
  });
}

/**
 * The browser posts `multipart/form-data` because the upstream does, so the
 * scalars arrive as strings and `item_pricing` as a JSON blob in one field.
 *
 * A `user_id` part is deliberately ignored rather than validated: the DAL takes
 * that one from the session.
 */
export function parseCreateQuotationForm(form: FormData): {
  payload: CreateQuotationInput;
  attachments: File[];
} {
  const referenceNo = readText(form, "reference_no");
  if (!referenceNo) throw invalid("Quote reference number is required.");

  const payload: CreateQuotationInput = {
    reference_no: referenceNo,
    date: readDate(form, "date", "Quote date"),
    delivery_date: readDate(form, "delivery_date", "Delivery date"),
    vendor_id: readObjectId(form, "vendor_id", "Vendor"),
    payment_term_id: readObjectId(form, "payment_term_id", "Payment term"),
    item_pricing: parseItemPricing(readText(form, "item_pricing")),
  };

  // Empty parts are what a file input contributes when nothing was picked.
  const attachments = form
    .getAll("attachments")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);

  return { payload, attachments };
}

/**
 * `PUT /quotations/{id}` takes the identical body: it depends on the same
 * `get_quotation_create`, so every field is required on an update and none of
 * them may be omitted. The alias is deliberate — if the backend ever grows a
 * real partial update (its unused `QuotationUpdate` schema), this must become
 * its own parser rather than inherit create's "required" rules.
 */
export const parseUpdateQuotationForm = parseCreateQuotationForm;
