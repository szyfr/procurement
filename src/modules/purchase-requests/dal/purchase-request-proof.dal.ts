import { serverFetch } from "@/lib/api/fetcher";
import { assertObjectId } from "@/lib/api/object-id";
import { getCurrentUser } from "@/modules/auth/dal/auth.dal";
import { userId } from "@/modules/auth/models/session";
import {
  buildPurchaseRequestProofForm,
  type CreatePurchaseRequestProofInput,
} from "@/modules/purchase-requests/dto";
import type {
  PurchaseRequestProof,
  PurchaseRequestProofDetail,
} from "@/modules/purchase-requests/models/purchase-request-proof";

const NOT_FOUND = "We couldn't find that proof of order.";

export function getPurchaseRequestProof(
  id: string,
): Promise<PurchaseRequestProofDetail> {
  assertObjectId(id, NOT_FOUND);

  return serverFetch<PurchaseRequestProofDetail>(
    `/purchase-request-proofs/${id}`,
  );
}

export async function createPurchaseRequestProof(
  input: CreatePurchaseRequestProofInput,
  attachments: File[] = [],
): Promise<PurchaseRequestProof> {
  // Supplied server-side from the session cookie; the browser never picks the
  // user a proof is recorded under. Also means an unauthenticated POST fails
  // here with the same 401 `getCurrentUser` throws for any other read.
  const user = await getCurrentUser();

  const form = buildPurchaseRequestProofForm(
    { ...input, user_id: userId(user) },
    attachments,
  );

  // Trailing slash required: this route is mounted as `router.post("/")`
  // under the `/purchase-request-proofs` prefix, so a bare path 307s and the
  // redirect can drop the multipart body.
  return serverFetch<PurchaseRequestProof>("/purchase-request-proofs/", {
    method: "POST",
    body: form,
  });
}
