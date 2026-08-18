import { serverFetch } from "@/lib/api/fetcher";
import {
  clampPageSize,
  DEFAULT_PAGE_SIZE,
  type Paginated,
} from "@/lib/api/pagination";
import type { Permission } from "@/modules/permissions/models/permission";

export interface ListPermissionsQuery {
  page?: number;
  pageSize?: number;
  search?: string | null;
}

export function listPermissions(
  query: ListPermissionsQuery = {},
): Promise<Paginated<Permission>> {
  return serverFetch<Paginated<Permission>>("/permissions", {
    query: {
      page: query.page ?? 1,
      page_size: clampPageSize(query.pageSize, DEFAULT_PAGE_SIZE),
      search: query.search || undefined,
    },
  });
}
