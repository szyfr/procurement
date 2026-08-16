/**
 * Request contract for `POST /auth/register`, the only way FastAPI creates a
 * user, mirroring `CreateAccountRequest` exactly.
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
