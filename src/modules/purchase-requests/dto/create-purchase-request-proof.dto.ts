/**
 * What the UI submits to record a proof of order — `POST /purchase-request-proofs`.
 *
 * `user_id` is absent by design; the DAL fills it in from the session.
 */
export interface CreatePurchaseRequestProofInput {
  /** `YYYY-MM-DD`. FastAPI parses this as a date and rejects a time component. */
  delivery_date: string;
  vendor_reference_no: string;
  purchase_request_item_ids: string[];
}

/**
 * `get_purchase_request_proof_create`'s form fields in full, as sent upstream.
 * `user_id` is declared `Form(...)` with no default, so the write is refused
 * without it.
 */
export interface CreatePurchaseRequestProofDto
  extends CreatePurchaseRequestProofInput {
  user_id: string;
}

/**
 * `purchase_request_item_ids` and `attachments` are both repeated form parts
 * under the same field name — FastAPI reads them back as `list[str]` /
 * `list[UploadFile]` via `Form(...)`/`File(...)`, not a JSON-stringified part.
 *
 * Shared by the browser client and the server DAL so the two can't drift on
 * field names. Only the server half has a `user_id` to contribute, hence the
 * conditional part.
 */
export function buildPurchaseRequestProofForm(
  payload: CreatePurchaseRequestProofInput | CreatePurchaseRequestProofDto,
  attachments: File[] = [],
): FormData {
  const form = new FormData();

  form.set("delivery_date", payload.delivery_date);
  form.set("vendor_reference_no", payload.vendor_reference_no);

  for (const itemId of payload.purchase_request_item_ids) {
    form.append("purchase_request_item_ids", itemId);
  }

  if ("user_id" in payload) form.set("user_id", payload.user_id);

  for (const attachment of attachments) {
    form.append("attachments", attachment, attachment.name);
  }

  return form;
}
