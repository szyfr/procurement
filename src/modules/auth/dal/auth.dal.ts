import { cache } from "react";

import { ApiError } from "@/lib/api/errors";
import {
  serverFetch,
  serverFetchWithCookies,
  type UpstreamResponse,
} from "@/lib/api/fetcher";
import type {
  ChangePasswordDto,
  CurrentUserDto,
  LoginRequestDto,
  LoginResponseDto,
} from "@/modules/auth/dto/auth.dto";
import type {
  AuthenticatedUser,
  Credentials,
  SignedInUser,
} from "@/modules/auth/models/session";

/**
 * Authentication against FastAPI. Server-side only, called from Route Handlers
 * and from the server shells that gate protected pages — never from a
 * component that runs in the browser.
 *
 * FastAPI owns the session and the cookie that carries it. The three calls that
 * change that state hand their upstream `Set-Cookie` lines back for the Route
 * Handler to relay; this app issues no cookie of its own.
 */

/**
 * Primes the CSRF cookie.
 *
 * `GET /auth/csrf-cookie` answers with an empty body and reports its token
 * through `Set-Cookie` alone, so the header is the whole payload. Relayed to
 * the browser, it becomes the cookie half of the double submit that
 * `validate_xsrf` checks on sign-in.
 */
export async function issueCsrfCookie(): Promise<string[]> {
  const { setCookies } =
    await serverFetchWithCookies<null>("/auth/csrf-cookie");

  return setCookies;
}

/**
 * Exchanges credentials for a session.
 *
 * The header half of the CSRF pair is added by `serverFetch` from the caller's
 * own cookie, so the browser has to hold one by the time it posts — which is
 * what the CSRF prime is for.
 *
 * Only the user crosses back. The response body also carries the raw JWT, and
 * that is where it stops: the same token is already in FastAPI's `Set-Cookie`,
 * HttpOnly, which is the only form the browser has any business receiving.
 */
export async function signIn(
  credentials: Credentials,
): Promise<UpstreamResponse<SignedInUser>> {
  const { data, setCookies } = await serverFetchWithCookies<LoginResponseDto>(
    "/auth/login",
    {
      method: "POST",
      body: {
        email: credentials.email,
        password: credentials.password,
      } satisfies LoginRequestDto,
    },
  );

  return { data: data.user, setCookies };
}

/**
 * The signed-in user, or a 401 when the session cookie is missing, expired or
 * forged. This is the authoritative answer to "is this request authenticated?"
 * — the cookie's presence is not.
 *
 * Memoized per request with React `cache`, so the several callers a single
 * request can have — `requirePermission(...)` at the top of a Route Handler,
 * then a DAL that needs the caller's id for `user_id` — cost one upstream
 * `/auth/me` between them rather than one each.
 */
export const getCurrentUser = cache(async (): Promise<AuthenticatedUser> => {
  const { password: _password, ...user } =
    await serverFetch<CurrentUserDto>("/auth/me");

  // The one field that is not passed through. `/auth/me` answers with the
  // stored user document, bcrypt hash included, and this is the boundary it
  // stops at — the rest of the response is handed on as it arrived.
  return user;
});

/**
 * `null` for "not signed in", for the page shells that redirect on their own.
 *
 * Only a 401 becomes `null`. Anything else — FastAPI unreachable, a missing
 * `FASTAPI_BASE_URL`, a 500 — is rethrown, because swallowing those made an
 * outage look like a mass logout: every shell would redirect to a login page
 * that could not authenticate anyone either, with nothing surfaced to say why.
 */
export async function getOptionalUser(): Promise<AuthenticatedUser | null> {
  try {
    return await getCurrentUser();
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return null;
    throw error;
  }
}

/**
 * The gate every Route Handler outside `/api/auth/*` runs first.
 *
 * FastAPI authenticates every router of its own (`api.py` hangs
 * `get_current_active_user` off each `include_router`), so this is defense in
 * depth rather than the only line — but it is the line that matters here,
 * because `proxy.ts` deliberately skips `/api/*` and would otherwise let an
 * unauthenticated caller reach a route handler before anything checked.
 *
 * Where a permission slug applies, `requirePermission` in `dal/access.ts`
 * replaces this and checks both at once.
 */
export async function requireUser(): Promise<AuthenticatedUser> {
  return getCurrentUser();
}

/**
 * Changes the caller's own password.
 *
 * The account comes from the session, so this can never target anyone else —
 * it is the only password write FastAPI offers, and an administrator resetting
 * someone else's password is still not possible.
 *
 * The session survives it: the JWT is signed over the email and is not
 * invalidated by a password change, so the user stays signed in here and on
 * every other device.
 *
 * The one upstream shape worth intercepting is a wrong old password. The
 * controller raises a 401 and then catches its own `HTTPException`, re-emitting
 * it as `400 {"error": "401: Incorrect old password"}` — which would otherwise
 * normalize to the generic "couldn't be processed" copy and leave the user with
 * no idea which field was wrong. It is remapped to a validation failure with
 * our own wording, not upstream's.
 */
export async function changePassword(
  payload: ChangePasswordDto,
): Promise<void> {
  try {
    await serverFetch<unknown>("/auth/me/change-password", {
      method: "PATCH",
      body: payload,
    });
  } catch (error) {
    if (
      error instanceof ApiError &&
      error.status === 400 &&
      /incorrect old password/i.test(error.message)
    ) {
      throw new ApiError(
        422,
        "validation_failed",
        "Your current password is incorrect.",
      );
    }

    throw error;
  }
}

/**
 * Ends the session.
 *
 * FastAPI expires both cookies and answers with the `Set-Cookie` lines that do
 * it; relaying those is the whole of signing out. Nothing is cleared here, so
 * a user only ends up signed out when the backend says they are.
 */
export async function signOut(): Promise<string[]> {
  const { setCookies } = await serverFetchWithCookies<unknown>("/auth/logout", {
    method: "PATCH",
  });

  return setCookies;
}
