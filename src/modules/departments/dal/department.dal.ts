import { ApiError } from "@/lib/api/errors";
import { serverFetch } from "@/lib/api/fetcher";
import { assertObjectId } from "@/lib/api/object-id";
import {
  clampPageSize,
  MAX_PAGE_SIZE,
  type Paginated,
} from "@/lib/api/pagination";
import { DEFAULT_PAGE_SIZE } from "@/modules/departments/constants";
import type {
  CreateDepartmentDto,
  UpdateDepartmentDto,
} from "@/modules/departments/dto";
import type { Department } from "@/modules/departments/models/department";

/**
 * Department reads and writes against FastAPI. Server-side only, called from
 * Route Handlers — never from a component.
 *
 * Every read hands back the upstream response as it arrived; there is no
 * transformation step between here and the browser.
 */

const NOT_FOUND = "Department not found";

export interface ListDepartmentsQuery {
  page?: number;
  pageSize?: number;
  /** Matches against department title and description. */
  search?: string | null;
}

export function listDepartments(
  query: ListDepartmentsQuery = {},
): Promise<Paginated<Department>> {
  return serverFetch<Paginated<Department>>("/departments", {
    query: {
      page: query.page ?? 1,
      page_size: clampPageSize(query.pageSize, DEFAULT_PAGE_SIZE),
      search: query.search || undefined,
    },
  });
}

/**
 * FastAPI offers no by-id read for departments, only a paginated list. The
 * collection is small, so a single record is resolved by walking every page and
 * matching the id.
 */
export async function getDepartment(id: string): Promise<Department> {
  assertObjectId(id, NOT_FOUND);

  const first = await serverFetch<Paginated<Department>>("/departments", {
    query: { page: 1, page_size: MAX_PAGE_SIZE },
  });

  const pages = await Promise.all(
    Array.from({ length: first.pagination.total_pages - 1 }, (_, index) =>
      serverFetch<Paginated<Department>>("/departments", {
        query: { page: index + 2, page_size: MAX_PAGE_SIZE },
      }),
    ),
  );

  const department = [first, ...pages]
    .flatMap((page) => page.data)
    .find((entry) => entry._id === id);

  if (!department) {
    throw new ApiError(404, "not_found", NOT_FOUND);
  }

  return department;
}

export function createDepartment(
  input: CreateDepartmentDto,
): Promise<Department> {
  return serverFetch<Department>("/departments", {
    method: "POST",
    body: input,
  });
}

export function updateDepartment(
  id: string,
  input: UpdateDepartmentDto,
): Promise<Department> {
  assertObjectId(id, NOT_FOUND);

  return serverFetch<Department>(`/departments/${id}`, {
    method: "PUT",
    body: input,
  });
}

export async function deleteDepartment(id: string): Promise<void> {
  assertObjectId(id, NOT_FOUND);

  await serverFetch<null>(`/departments/${id}`, { method: "DELETE" });
}
