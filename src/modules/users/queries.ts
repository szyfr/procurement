import { queryOptions } from "@tanstack/react-query";
import { fetchUser, fetchUsers } from "@/modules/users/api";

export const userKeys = {
  all: ["users"] as const,
  list: (page: number) => [...userKeys.all, "list", page] as const,
  detail: (id: string) => [...userKeys.all, "detail", id] as const,
};

export function userListQuery(page: number) {
  return queryOptions({
    queryKey: userKeys.list(page),
    queryFn: ({ signal }) => fetchUsers({ page, signal }),
  });
}

export function userDetailQuery(id: string) {
  return queryOptions({
    queryKey: userKeys.detail(id),
    queryFn: ({ signal }) => fetchUser(id, signal),
    enabled: id.length > 0,
  });
}
