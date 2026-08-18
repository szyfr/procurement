/**
 * Departments module — public surface.
 *
 * Only the browser-safe pieces are re-exported here. The DAL is deliberately
 * left out: it reaches FastAPI and must be imported directly by Route
 * Handlers (`@/modules/departments/dal/...`) so it can never be pulled into a
 * client bundle through this barrel.
 */

export {
  createDepartment,
  deleteDepartment,
  fetchDepartments,
  updateDepartment,
} from "@/modules/departments/api";
export type {
  CreateDepartmentDto,
  UpdateDepartmentDto,
} from "@/modules/departments/dto";
export type { Department } from "@/modules/departments/models/department";
export {
  departmentKeys,
  departmentListQuery,
} from "@/modules/departments/queries";
