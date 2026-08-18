/**
 * Request contracts for the user writes, mirroring FastAPI exactly.
 *
 * There is no response DTO: every write answers with the user document itself
 * (or, for roles, a confirmation message) — see `models/user`.
 */

/**
 * `POST /auth/register`, the only way FastAPI creates a user, mirroring
 * `CreateAccountRequest`.
 *
 * The BFF exposes it as `POST /api/users` rather than `/api/auth/register`:
 * routes under `/api/auth/*` are exempt from `requireUser()` by design, and
 * creating an account is an administrative write that must not be.
 */
export interface CreateUserDto {
  firstname: string;
  lastname: string;
  email: string;
  password: string;
  /** Upstream compares it against `password` itself and 422s on a mismatch. */
  confirm_password: string;
}

/**
 * `PUT /users/{id}`, mirroring FastAPI's `UserUpdate`.
 *
 * Upstream marks every field optional and drops unset and null entries before
 * the `$set`, so a partial body is legal — the edit form always sends all
 * three. `password` is deliberately not carried: the only password write the
 * backend exposes is `PATCH /auth/me/change-password`, which acts on the
 * caller's own account and nobody else's.
 */
export interface UpdateUserDto {
  firstname: string;
  lastname: string;
  email: string;
}

/**
 * `PATCH /users/{id}/roles`.
 *
 * The endpoint answers with a confirmation message rather than the updated
 * user — see `UpdateUserRolesResult` in `models/user`.
 */
export interface UpdateUserRolesDto {
  role_ids: string[];
}
