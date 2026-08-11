import { bffRequest } from "@/lib/api/bff-client";
import type { Paginated } from "@/lib/api/pagination";
import { paymentTermEndpoints } from "@/modules/payment-terms/api/endpoints";
import type {
  CreatePaymentTermDto,
  UpdatePaymentTermDto,
} from "@/modules/payment-terms/dto";
import type { PaymentTerm } from "@/modules/payment-terms/models/payment-term";

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
  return bffRequest<Paginated<PaymentTerm>>(paymentTermEndpoints.list, {
    query: { page, pageSize, search },
    signal,
  });
}

export function createPaymentTerm(payload: CreatePaymentTermDto) {
  return bffRequest<PaymentTerm>(paymentTermEndpoints.create, {
    method: "POST",
    body: payload,
  });
}

export function updatePaymentTerm(id: string, payload: UpdatePaymentTermDto) {
  return bffRequest<PaymentTerm>(paymentTermEndpoints.detail(id), {
    method: "PUT",
    body: payload,
  });
}

export function deletePaymentTerm(id: string) {
  return bffRequest<null>(paymentTermEndpoints.detail(id), {
    method: "DELETE",
  });
}
