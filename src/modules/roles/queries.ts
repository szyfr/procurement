import { queryOptions } from "@tanstack/react-query";
import { fetchRole, fetchRoles } from "@/modules/roles/api";

export const roleKeys = {
  all: ["roles"] as const,
  list: (page: number, search: string, pageSize?: number) =>
    [...roleKeys.all, "list", page, search, pageSize ?? null] as const,
  detail: (id: string) => [...roleKeys.all, "detail", id] as const,
  /** Keyed by search term only — `useInfiniteQuery` owns the page dimension. */
  infiniteList: (search: string) =>
    [...roleKeys.all, "infinite", search] as const,
};

export function roleListQuery(page: number, search = "", pageSize?: number) {
  return queryOptions({
    queryKey: roleKeys.list(page, search, pageSize),
    queryFn: ({ signal }) =>
      fetchRoles({ page, pageSize, search: search || undefined, signal }),
  });
}

export function roleDetailQuery(id: string) {
  return queryOptions({
    queryKey: roleKeys.detail(id),
    queryFn: ({ signal }) => fetchRole(id, signal),
    enabled: id.length > 0,
  });
}
