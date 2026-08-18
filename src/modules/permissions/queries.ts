import { queryOptions } from "@tanstack/react-query";
import { fetchPermissions } from "@/modules/permissions/api";

export const permissionKeys = {
  all: ["permissions"] as const,
  list: (page: number, pageSize?: number) =>
    [...permissionKeys.all, page, pageSize ?? null] as const,
};

export function permissionListQuery(page = 1, pageSize?: number) {
  return queryOptions({
    queryKey: permissionKeys.list(page, pageSize),
    queryFn: ({ signal }) => fetchPermissions({ page, pageSize, signal }),
  });
}
