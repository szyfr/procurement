import { bffRequest } from "@/lib/api/bff-client";
import type { Paginated } from "@/lib/api/pagination";
import type {
  CreatePaymentTermDto,
  UpdatePaymentTermDto,
} from "@/modules/payment-terms/dto";
import type { PaymentTerm } from "@/modules/payment-terms/models/payment-term";

const BASE = "/api/payment-terms";
const detailPath = (id: string) => `${BASE}/${encodeURIComponent(id)}`;

/**
 * One list serves two screens: the management table and the quotation form's
 * picker, which pages through the same endpoint with its own `pageSize` and
 * `search` and reads the records as they arrive.
 */

export interface ListPaymentTermsParams {
  page?: number;
  pageSize?: number;
  search?: string;
  signal?: AbortSignal;
}

export function fetchPaymentTerms({
  page,
  pageSize,
  search,
  signal,
}: ListPaymentTermsParams = {}) {
  return bffRequest<Paginated<PaymentTerm>>(BASE, {
    query: { page, pageSize, search },
    signal,
  });
}

export function createPaymentTerm(payload: CreatePaymentTermDto) {
  return bffRequest<PaymentTerm>(BASE, {
    method: "POST",
    body: payload,
  });
}

export function updatePaymentTerm(id: string, payload: UpdatePaymentTermDto) {
  return bffRequest<PaymentTerm>(detailPath(id), {
    method: "PUT",
    body: payload,
  });
}

export function deletePaymentTerm(id: string) {
  return bffRequest<null>(detailPath(id), {
    method: "DELETE",
  });
}
