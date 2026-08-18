export {
  createRole,
  fetchRole,
  fetchRoles,
  updateRole,
} from "@/modules/roles/api";
export type { CreateRoleDto, UpdateRoleDto } from "@/modules/roles/dto";
export type {
  Role,
  RoleDetail,
  UpdateRoleResult,
} from "@/modules/roles/models/role";
export {
  roleDetailQuery,
  roleKeys,
  roleListQuery,
} from "@/modules/roles/queries";
