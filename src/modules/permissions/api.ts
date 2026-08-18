import { bffRequest } from "@/lib/api/bff-client";
import type { Paginated } from "@/lib/api/pagination";
import type { Permission } from "@/modules/permissions/models/permission";

const BASE = "/api/permissions";

export interface ListPermissionsParams {
  page?: number;
  pageSize?: number;
  search?: string;
  signal?: AbortSignal;
}

export function fetchPermissions({
  page,
  pageSize,
  search,
  signal,
}: ListPermissionsParams = {}) {
  return bffRequest<Paginated<Permission>>(BASE, {
    query: { page, pageSize, search },
    signal,
  });
}
