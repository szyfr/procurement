import { bffRequest } from "@/lib/api/bff-client";
import type { Paginated } from "@/lib/api/pagination";
import type {
  CreateUserDto,
  UpdateUserDto,
  UpdateUserRolesDto,
} from "@/modules/users/dto";
import type {
  UpdateUserRolesResult,
  User,
  UserDetail,
} from "@/modules/users/models/user";

const BASE = "/api/users";
const detailPath = (id: string) => `${BASE}/${encodeURIComponent(id)}`;

export interface ListUsersParams {
  page?: number;
  pageSize?: number;
  signal?: AbortSignal;
}

export function fetchUsers({ page, pageSize, signal }: ListUsersParams = {}) {
  return bffRequest<Paginated<User>>(BASE, {
    query: { page, pageSize },
    signal,
  });
}

export function fetchUser(id: string, signal?: AbortSignal) {
  return bffRequest<UserDetail>(detailPath(id), { signal });
}

export function createUser(payload: CreateUserDto) {
  return bffRequest<User>(BASE, {
    method: "POST",
    body: payload,
  });
}

export function updateUser(id: string, payload: UpdateUserDto) {
  return bffRequest<User>(detailPath(id), {
    method: "PUT",
    body: payload,
  });
}

export function updateUserRoles(id: string, payload: UpdateUserRolesDto) {
  return bffRequest<UpdateUserRolesResult>(`${detailPath(id)}/roles`, {
    method: "PATCH",
    body: payload,
  });
}
