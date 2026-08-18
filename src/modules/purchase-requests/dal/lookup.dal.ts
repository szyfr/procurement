import { serverFetch } from "@/lib/api/fetcher";
import {
  clampPageSize,
  MAX_PAGE_SIZE,
  type Paginated,
} from "@/lib/api/pagination";
import { LOOKUP_PAGE_SIZE } from "@/lib/lookup";
import type { Department } from "@/modules/departments";
import type { Material } from "@/modules/purchase-requests/models/material";
import type { Vendor } from "@/modules/vendors";

/**
 * Reference data reads for the create and edit form pickers. Server-side only —
 * this talks to FastAPI, never to the BFF.
 *
 * These are searchable, paginated lists, not name resolution. Purchase requests
 * store `department_id` and `vendor_id` and the backend joins neither, so those
 * ids render as-is until it does.
 *
 * The collections belong to other modules, so their shapes are imported rather
 * than restated — the picker reads the records exactly as they arrive.
 */

export interface LookupQuery {
  page?: number;
  pageSize?: number;
  search?: string | null;
}

/**
 * Departments are a short list, so the default page holds the whole
 * collection; the picker still pages if one day it doesn't.
 */
export function listDepartments(
  query: LookupQuery = {},
): Promise<Paginated<Department>> {
  return serverFetch<Paginated<Department>>("/departments", {
    query: {
      page: query.page ?? 1,
      page_size: clampPageSize(query.pageSize, MAX_PAGE_SIZE),
    },
  });
}

export function listMaterials(
  query: LookupQuery = {},
): Promise<Paginated<Material>> {
  return serverFetch<Paginated<Material>>("/materials", {
    query: {
      page: query.page ?? 1,
      page_size: clampPageSize(query.pageSize, LOOKUP_PAGE_SIZE),
      search: query.search || undefined,
    },
  });
}

export function listVendors(
  query: LookupQuery = {},
): Promise<Paginated<Vendor>> {
  return serverFetch<Paginated<Vendor>>("/vendors", {
    query: {
      page: query.page ?? 1,
      page_size: clampPageSize(query.pageSize, LOOKUP_PAGE_SIZE),
      search: query.search || undefined,
    },
  });
}
