import { bffRequest } from "@/lib/api/bff-client";
import type { Paginated } from "@/lib/api/pagination";
import { vendorEndpoints } from "@/modules/vendors/api/endpoints";
import type { Vendor } from "@/modules/vendors/models/vendor";

export interface ListVendorsParams {
  page?: number;
  /** Matches against vendor name and number. */
  search?: string;
  signal?: AbortSignal;
}

export function fetchVendors({ page, search, signal }: ListVendorsParams = {}) {
  return bffRequest<Paginated<Vendor>>(vendorEndpoints.list, {
    query: { page, search },
    signal,
  });
}
