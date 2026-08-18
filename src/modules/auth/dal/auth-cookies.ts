import { cookies } from "next/headers";

import { CSRF_COOKIE, SESSION_COOKIE } from "@/modules/auth/constants";

/**
 * How this app issues the two auth cookies on its own origin.
 *
 * FastAPI's copies are scoped to FastAPI and never reach the browser, so the
 * attributes here are ours rather than a relay of the upstream ones. That is
 * deliberate: it lets the session cookie be sized to the token's real lifetime
 * (upstream passes a minutes value into a seconds field, so its own cookie
 * expires in about a minute) and it keeps both cookies out of JavaScript's
 * reach, which the upstream CSRF cookie is not.
 *
 * `SameSite=Lax` is what actually defends the BFF against cross-site writes:
 * the browser withholds these cookies on cross-site POSTs, so a forged request
 * arrives unauthenticated. The CSRF token is carried for FastAPI's benefit.
 *
 * Server-only, and imported by Route Handlers by full path — never through the
 * module barrel.
 */

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  // Opt *out* for development rather than in for production: a container or
  // PaaS that starts the server without `NODE_ENV` set would otherwise hand
  // out the session JWT over a cookie with no `Secure` flag, silently.
  secure: process.env.NODE_ENV !== "development",
  path: "/",
} as const;

export async function readCsrfToken(): Promise<string | null> {
  return (await cookies()).get(CSRF_COOKIE)?.value ?? null;
}

/** Session cookie for exactly as long as the JWT is valid. */
export async function writeSessionCookie(token: string, expiresIn: number) {
  (await cookies()).set(SESSION_COOKIE, token, {
    ...cookieOptions,
    maxAge: expiresIn,
  });
}

/**
 * Kept for the browsing session rather than a fixed window. The upstream check
 * is a stateless comparison, so the token only has to outlive the login form,
 * and a short `Max-Age` here would strand a user who paused while typing.
 */
export async function writeCsrfCookie(token: string) {
  (await cookies()).set(CSRF_COOKIE, token, cookieOptions);
}

export async function clearAuthCookies() {
  const store = await cookies();

  store.delete(SESSION_COOKIE);
  store.delete(CSRF_COOKIE);
}
