/**
 * Request contract for creating a role, mirroring FastAPI exactly.
 *
 * There is no response DTO: `POST /roles` answers with the role document
 * itself, and that shape is `Role` — see `models/role`.
 */
export interface CreateRoleDto {
  title: string;
  description: string;
  permission_ids: string[];
}

/**
 * `PUT /roles/{id}` accepts the same fields as create. Its own sample body
 * omits `title`, so the field is optional here — see `parseUpdateRolePayload`.
 */
export interface UpdateRoleDto {
  title?: string;
  description: string;
  permission_ids: string[];
}
