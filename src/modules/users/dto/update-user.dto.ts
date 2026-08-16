/**
 * Request contract for `PUT /users/{id}`, mirroring FastAPI's `UserUpdate`.
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
