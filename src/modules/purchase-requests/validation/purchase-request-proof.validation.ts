import { ApiError } from "@/lib/api/errors";
import { isObjectId } from "@/lib/api/object-id";
import { readAttachments } from "@/lib/api/uploads";
import type { CreatePurchaseRequestProofInput } from "@/modules/purchase-requests/dto";
import { assertDateOnly } from "@/modules/purchase-requests/validation/purchase-request.validation";

/**
 * Request-body parsing for the proof-upload Route Handler.
 *
 * `POST /purchase-request-proofs` builds its scalar fields inside a FastAPI
 * dependency, which runs before the handler's own `try` — a malformed date or
 * item id would otherwise surface as an opaque 500 rather than a 422 naming
 * the field. Everything the upstream would choke on is checked here first.
 *
 * A `user_id` part is deliberately ignored rather than validated: the DAL takes
 * that one from the session.
 */

function invalid(message: string) {
  return new ApiError(422, "validation_failed", message);
}

function readText(form: FormData, field: string): string {
  const value = form.get(field);
  return typeof value === "string" ? value.trim() : "";
}

export function parseCreatePurchaseRequestProofForm(form: FormData): {
  payload: CreatePurchaseRequestProofInput;
  attachments: File[];
} {
  const deliveryDate = readText(form, "delivery_date");
  if (!deliveryDate) throw invalid("Delivery date is required.");
  assertDateOnly(deliveryDate, "Delivery date");

  const vendorReferenceNo = readText(form, "vendor_reference_no");
  if (!vendorReferenceNo) {
    throw invalid("Vendor reference number is required.");
  }

  const itemIds = form
    .getAll("purchase_request_item_ids")
    .filter(
      (entry): entry is string => typeof entry === "string" && entry !== "",
    );

  if (itemIds.length === 0) {
    throw invalid("Select at least one item.");
  }
  itemIds.forEach((id, index) => {
    if (!isObjectId(id)) throw invalid(`Item ${index + 1} is not valid.`);
  });

  const attachments = readAttachments(form);

  return {
    payload: {
      delivery_date: deliveryDate,
      vendor_reference_no: vendorReferenceNo,
      purchase_request_item_ids: itemIds,
    },
    attachments,
  };
}
