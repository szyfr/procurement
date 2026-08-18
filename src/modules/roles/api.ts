import { bffRequest } from "@/lib/api/bff-client";
import type { Paginated } from "@/lib/api/pagination";
import type { CreateRoleDto, UpdateRoleDto } from "@/modules/roles/dto";
import type {
  Role,
  RoleDetail,
  UpdateRoleResult,
} from "@/modules/roles/models/role";

const BASE = "/api/roles";
const detailPath = (id: string) => `${BASE}/${encodeURIComponent(id)}`;

export interface ListRolesParams {
  page?: number;
  pageSize?: number;
  search?: string;
  signal?: AbortSignal;
}

export function fetchRoles({
  page,
  pageSize,
  search,
  signal,
}: ListRolesParams = {}) {
  return bffRequest<Paginated<Role>>(BASE, {
    query: { page, pageSize, search },
    signal,
  });
}

export function fetchRole(id: string, signal?: AbortSignal) {
  return bffRequest<RoleDetail>(detailPath(id), { signal });
}

export function createRole(payload: CreateRoleDto) {
  return bffRequest<Role>(BASE, {
    method: "POST",
    body: payload,
  });
}

export function updateRole(id: string, payload: UpdateRoleDto) {
  return bffRequest<UpdateRoleResult>(detailPath(id), {
    method: "PUT",
    body: payload,
  });
}
