import type { Permission } from "@/modules/permissions";

/**
 * The `/roles` list response, verbatim — snake_case, `_id` keys, exactly what
 * FastAPI sends. List responses arrive inside the shared pagination envelope,
 * see `lib/api/pagination`.
 *
 * There is no status, role type, or assignee data upstream — a role is only
 * `title`, `description` and its granted `permission_ids`.
 */
export interface Role {
  _id: string;
  title: string;
  description: string;
  permission_ids: string[];
  created_at: string;
  updated_at: string;
}

/**
 * The `/roles/{id}` response. Same identity fields as `Role`, but carries the
 * joined permission documents instead of bare ids.
 */
export interface RoleDetail {
  _id: string;
  title: string;
  description: string;
  created_at: string;
  updated_at: string;
  permissions: Permission[];
}

/**
 * The `PUT /roles/{id}` response, verbatim — a confirmation message only,
 * not the updated role document.
 */
export interface UpdateRoleResult {
  message: string;
}
