/**
 * `POST /purchase-request-proofs` response, verbatim. One proof record can
 * cover several items — `purchase_request_item_ids` is how the backend groups
 * a single vendor confirmation across a PO's lines, the same grouping the
 * bulk dialog uses client-side.
 *
 * The detail pipeline (`purchase_request.py:get_full_details`) `$lookup`s
 * every proof touching one of the request's items onto `PurchaseRequest.proofs`
 * — but only this shape, not the S3-backed document list. That join only
 * happens on `GET /purchase-request-proofs/{id}`, which the detail page reads
 * lazily when a proof is opened.
 */
export interface PurchaseRequestProof {
  _id: string;
  /** `YYYY-MM-DD`. */
  delivery_date: string;
  vendor_reference_no: string;
  purchase_request_item_ids: string[];
  created_at: string;
  updated_at: string;
}

/** An uploaded proof file. `url` is pre-signed upstream — link to it as given. */
export interface PurchaseRequestProofDocument {
  _id: string;
  filename: string;
  url: string;
}

/** `GET /purchase-request-proofs/{id}` — the only read that carries documents. */
export interface PurchaseRequestProofDetail extends PurchaseRequestProof {
  documents: PurchaseRequestProofDocument[];
}
