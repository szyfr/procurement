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
  login,
  logout,
  requestCsrfCookie,
} from "@/modules/auth/api";
export {
  DEFAULT_SIGNED_IN_PATH,
  LOGIN_PATH,
  MIN_PASSWORD_LENGTH,
  REDIRECT_PARAM,
} from "@/modules/auth/constants";
export type { ChangePasswordDto } from "@/modules/auth/dto";
export { useLogin } from "@/modules/auth/hooks/use-login";
export { useLogout } from "@/modules/auth/hooks/use-logout";
export type {
  AuthenticatedUser,
  Credentials,
  SignedInUser,
} from "@/modules/auth/models/session";
export { userId, userName } from "@/modules/auth/models/session";
export { safeRedirectPath } from "@/modules/auth/validation/redirect.validation";
