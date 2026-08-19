import { queryOptions } from "@tanstack/react-query";
import type { ListSearchFilters } from "@/lib/api/pagination";
import { fetchUser, fetchUsers } from "@/modules/users/api/client";

export const userKeys = {
  all: ["users"] as const,
  list: (page: number, filters: ListSearchFilters = {}) =>
    [...userKeys.all, "list", page, filters] as const,
  detail: (id: string) => [...userKeys.all, "detail", id] as const,
};

export function userListQuery(page: number, filters: ListSearchFilters = {}) {
  return queryOptions({
    queryKey: userKeys.list(page, filters),
    queryFn: ({ signal }) =>
      fetchUsers({ page, search: filters.search, signal }),
  });
}

export function userDetailQuery(id: string) {
  return queryOptions({
    queryKey: userKeys.detail(id),
    queryFn: ({ signal }) => fetchUser(id, signal),
    enabled: id.length > 0,
  });
}
