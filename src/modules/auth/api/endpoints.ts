/**
 * Every BFF path the auth UI is allowed to call. All relative — the browser
 * only ever talks to this app's own origin, including for sign-in.
 */

const BASE = "/api/auth";

export const authEndpoints = {
  csrfCookie: `${BASE}/csrf-cookie`,
  login: `${BASE}/login`,
  logout: `${BASE}/logout`,
  /** Who the caller is according to the backend, or 401. */
  session: `${BASE}/session`,
  /** The caller's own password. Upstream this is `PATCH /auth/me/change-password`. */
  changePassword: `${BASE}/change-password`,
} as const;
