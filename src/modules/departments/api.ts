import { bffRequest } from "@/lib/api/bff-client";
import type { Paginated } from "@/lib/api/pagination";
import type {
  CreateDepartmentDto,
  UpdateDepartmentDto,
} from "@/modules/departments/dto";
import type { Department } from "@/modules/departments/models/department";

const BASE = "/api/departments";
const detailPath = (id: string) => `${BASE}/${encodeURIComponent(id)}`;

export interface ListDepartmentsParams {
  page?: number;
  pageSize?: number;
  signal?: AbortSignal;
}

export function fetchDepartments({
  page,
  pageSize,
  signal,
}: ListDepartmentsParams = {}) {
  return bffRequest<Paginated<Department>>(BASE, {
    query: { page, pageSize },
    signal,
  });
}

export function createDepartment(payload: CreateDepartmentDto) {
  return bffRequest<Department>(BASE, {
    method: "POST",
    body: payload,
  });
}

export function updateDepartment(id: string, payload: UpdateDepartmentDto) {
  return bffRequest<Department>(detailPath(id), {
    method: "PUT",
    body: payload,
  });
}

export function deleteDepartment(id: string) {
  return bffRequest<null>(detailPath(id), { method: "DELETE" });
}
