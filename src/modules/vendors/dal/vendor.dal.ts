import { serverFetch } from "@/lib/api/fetcher";
import { clampPageSize, type Paginated } from "@/lib/api/pagination";
import { DEFAULT_PAGE_SIZE } from "@/modules/vendors/constants";
import type { Vendor } from "@/modules/vendors/models/vendor";

/**
 * Vendor reads against FastAPI. Server-side only, called from Route Handlers —
 * never from a component. The upstream response is handed back as it arrived.
 *
 * Only the list is wired up; FastAPI exposes no create, update, delete or
 * by-id read for vendors yet.
 */

export interface ListVendorsQuery {
  page?: number;
  pageSize?: number;
  /** Matches against vendor name and number. */
  search?: string;
}

export function listVendors(
  query: ListVendorsQuery = {},
): Promise<Paginated<Vendor>> {
  return serverFetch<Paginated<Vendor>>("/vendors", {
    query: {
      page: query.page ?? 1,
      page_size: clampPageSize(query.pageSize, DEFAULT_PAGE_SIZE),
      search: query.search,
    },
  });
}
