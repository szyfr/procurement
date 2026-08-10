import { serverFetch } from "@/lib/api/fetcher";
import { assertObjectId } from "@/lib/api/object-id";
import {
  buildPurchaseRequestProofForm,
  type CreatePurchaseRequestProofDto,
} from "@/modules/purchase-requests/dto";
import type {
  PurchaseRequestProof,
  PurchaseRequestProofDetail,
} from "@/modules/purchase-requests/models/purchase-request-proof";

const NOT_FOUND = "We couldn't find that proof of order.";

/**
 * One proof in full, including its documents. The `proofs` array joined onto
 * the purchase request detail carries no document list, so the dialog reads
 * this instead.
 */
export function getPurchaseRequestProof(
  id: string,
): Promise<PurchaseRequestProofDetail> {
  assertObjectId(id, NOT_FOUND);

  return serverFetch<PurchaseRequestProofDetail>(
    `/purchase-request-proofs/${id}`,
  );
}

/** Server-side only, called from the Route Handler. */
export function createPurchaseRequestProof(
  payload: CreatePurchaseRequestProofDto,
  attachments: File[] = [],
): Promise<PurchaseRequestProof> {
  const form = buildPurchaseRequestProofForm(payload, attachments);

  // Trailing slash required: this route is mounted as `router.post("/")`
  // under the `/purchase-request-proofs` prefix, so a bare path 307s and the
  // redirect can drop the multipart body.
  return serverFetch<PurchaseRequestProof>("/purchase-request-proofs/", {
    method: "POST",
    body: form,
  });
}
