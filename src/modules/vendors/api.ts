import { bffRequest } from "@/lib/api/bff-client";
import type { Paginated } from "@/lib/api/pagination";
import type { Vendor } from "@/modules/vendors/models/vendor";

const BASE = "/api/vendors";

export interface ListVendorsParams {
  page?: number;
  signal?: AbortSignal;
}

export function fetchVendors({ page, signal }: ListVendorsParams = {}) {
  return bffRequest<Paginated<Vendor>>(BASE, {
    query: { page },
    signal,
  });
}
