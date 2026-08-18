import { serverFetch } from "@/lib/api/fetcher";
import { assertObjectId } from "@/lib/api/object-id";
import {
  clampPageSize,
  DEFAULT_PAGE_SIZE,
  type Paginated,
} from "@/lib/api/pagination";
import type {
  CreatePaymentTermDto,
  UpdatePaymentTermDto,
} from "@/modules/payment-terms/dto";
import type { PaymentTerm } from "@/modules/payment-terms/models/payment-term";

/**
 * Payment term reads and writes against FastAPI. Server-side only, called
 * from Route Handlers — never from a component. The upstream response is
 * handed back as it arrived.
 */

const NOT_FOUND = "Payment term not found";

export interface ListPaymentTermsQuery {
  page?: number;
  pageSize?: number;
  search?: string | null;
}

export function listPaymentTerms(
  query: ListPaymentTermsQuery = {},
): Promise<Paginated<PaymentTerm>> {
  return serverFetch<Paginated<PaymentTerm>>("/payment-terms", {
    query: {
      page: query.page ?? 1,
      page_size: clampPageSize(query.pageSize, DEFAULT_PAGE_SIZE),
      search: query.search || undefined,
    },
  });
}

export function getPaymentTerm(id: string): Promise<PaymentTerm> {
  assertObjectId(id, NOT_FOUND);

  return serverFetch<PaymentTerm>(`/payment-terms/${id}`);
}

export function createPaymentTerm(
  input: CreatePaymentTermDto,
): Promise<PaymentTerm> {
  return serverFetch<PaymentTerm>("/payment-terms", {
    method: "POST",
    body: input,
  });
}

export function updatePaymentTerm(
  id: string,
  input: UpdatePaymentTermDto,
): Promise<PaymentTerm> {
  assertObjectId(id, NOT_FOUND);

  return serverFetch<PaymentTerm>(`/payment-terms/${id}`, {
    method: "PUT",
    body: input,
  });
}

export async function deletePaymentTerm(id: string): Promise<void> {
  assertObjectId(id, NOT_FOUND);

  await serverFetch<null>(`/payment-terms/${id}`, { method: "DELETE" });
}
