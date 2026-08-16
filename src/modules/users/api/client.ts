import { bffRequest } from "@/lib/api/bff-client";
import type { Paginated } from "@/lib/api/pagination";
import { userEndpoints } from "@/modules/users/api/endpoints";
import type { CreateUserDto } from "@/modules/users/dto/create-user.dto";
import type { UpdateUserDto } from "@/modules/users/dto/update-user.dto";
import type { UpdateUserRolesDto } from "@/modules/users/dto/update-user-roles.dto";
import type {
  UpdateUserRolesResult,
  User,
  UserDetail,
} from "@/modules/users/models/user";

export interface ListUsersParams {
  page?: number;
  pageSize?: number;
  signal?: AbortSignal;
}

export function fetchUsers({ page, pageSize, signal }: ListUsersParams = {}) {
  return bffRequest<Paginated<User>>(userEndpoints.list, {
    query: { page, pageSize },
    signal,
  });
}

export function fetchUser(id: string, signal?: AbortSignal) {
  return bffRequest<UserDetail>(userEndpoints.detail(id), { signal });
}

export function createUser(payload: CreateUserDto) {
  return bffRequest<User>(userEndpoints.create, {
    method: "POST",
    body: payload,
  });
}

export function updateUser(id: string, payload: UpdateUserDto) {
  return bffRequest<User>(userEndpoints.detail(id), {
    method: "PUT",
    body: payload,
  });
}

export function updateUserRoles(id: string, payload: UpdateUserRolesDto) {
  return bffRequest<UpdateUserRolesResult>(userEndpoints.roles(id), {
    method: "PATCH",
    body: payload,
  });
}
