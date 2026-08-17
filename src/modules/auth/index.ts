/**
 * Auth module — public surface.
 *
 * The DAL and the cookie helpers are deliberately left out: they reach FastAPI
 * and write `Set-Cookie`, and must be imported directly by Route Handlers and
 * server shells (`@/modules/auth/dal/...`) so neither can be pulled into a
 * client bundle through this barrel.
 */

export {
  changePassword,
  fetchSession,
  login,
  logout,
  requestCsrfCookie,
} from "@/modules/auth/api/client";
export { authEndpoints } from "@/modules/auth/api/endpoints";
export {
  DEFAULT_SIGNED_IN_PATH,
  LOGIN_PATH,
  MIN_PASSWORD_LENGTH,
  REDIRECT_PARAM,
} from "@/modules/auth/constants";
export type { ChangePasswordDto } from "@/modules/auth/dto/auth.dto";
export { useChangePassword } from "@/modules/auth/hooks/use-change-password";
export { useLogin } from "@/modules/auth/hooks/use-login";
export { useLogout, useSession } from "@/modules/auth/hooks/use-session";
export type {
  AuthenticatedUser,
  Credentials,
  SignedInUser,
} from "@/modules/auth/models/session";
export { userId, userName } from "@/modules/auth/models/session";
export { authKeys, sessionQuery } from "@/modules/auth/queries/auth.queries";
export { safeRedirectPath } from "@/modules/auth/validation/redirect.validation";
