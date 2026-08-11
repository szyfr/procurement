import { bffRequest } from "@/lib/api/bff-client";
import type { Paginated } from "@/lib/api/pagination";
import { vendorEndpoints } from "@/modules/vendors/api/endpoints";
import type { Vendor } from "@/modules/vendors/models/vendor";

export interface ListVendorsParams {
  page?: number;
  signal?: AbortSignal;
}

export function fetchVendors({ page, signal }: ListVendorsParams = {}) {
  return bffRequest<Paginated<Vendor>>(vendorEndpoints.list, {
    query: { page },
    signal,
  });
}
