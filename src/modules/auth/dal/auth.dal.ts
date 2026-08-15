import { cache } from "react";

import { readSetCookieValue } from "@/lib/api/cookies";
import { ApiError } from "@/lib/api/errors";
import { serverFetch, serverFetchWithCookies } from "@/lib/api/fetcher";
import { CSRF_COOKIE, CSRF_HEADER } from "@/modules/auth/constants";
import type {
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
 */

/** The pieces a Route Handler needs to turn a sign-in into cookies on our origin. */
export interface SignInResult {
  user: SignedInUser;
  /** The raw JWT. Goes straight into an HttpOnly cookie and no further. */
  accessToken: string;
  /** Seconds; sizes the session cookie to the token's real lifetime. */
  expiresIn: number;
  /**
   * The CSRF token the sign-in was made with — the caller's own, or the one
   * minted for it. Worth persisting in the latter case so the cookie matches
   * what the next request will echo.
   */
  csrfToken: string;
}

/**
 * Mints a CSRF token upstream.
 *
 * `GET /auth/csrf-cookie` answers with an empty body and reports the token
 * through a `Set-Cookie` header alone, which is the one place the BFF has to
 * read an upstream cookie rather than a response payload.
 */
export async function requestCsrfToken(): Promise<string> {
  const { setCookies } =
    await serverFetchWithCookies<null>("/auth/csrf-cookie");

  const token = readSetCookieValue(setCookies, CSRF_COOKIE);

  if (!token) {
    throw new ApiError(
      502,
      "upstream_unavailable",
      "The sign-in service did not issue a CSRF token.",
    );
  }

  return token;
}

/**
 * Exchanges credentials for a session.
 *
 * `validate_xsrf` upstream is a plain double submit — it compares the cookie
 * against the header and keeps no state of its own — so both halves are sent
 * from here. That is what lets the CSRF cookie stay HttpOnly on our origin:
 * the browser never has to read it back to complete the pair.
 *
 * A caller with no token in hand gets a freshly minted one rather than a 403,
 * which matters because the upstream cookie is issued with a very short
 * `Max-Age` and is routinely gone before a login form is submitted.
 */
export async function signIn(
  credentials: Credentials,
  csrfToken: string | null,
): Promise<SignInResult> {
  const token = csrfToken ?? (await requestCsrfToken());

  const response = await serverFetch<LoginResponseDto>("/auth/login", {
    method: "POST",
    body: {
      email: credentials.email,
      password: credentials.password,
    } satisfies LoginRequestDto,
    headers: {
      [CSRF_HEADER]: token,
      // Replaces the forwarded cookies outright. Login needs exactly one
      // cookie upstream, and pinning it here keeps the pair provably matched.
      Cookie: `${CSRF_COOKIE}=${token}`,
    },
  });

  return {
    // Only `user` crosses back to the Route Handler; the token is split off
    // here so it can go into a cookie and nowhere else.
    user: response.user,
    accessToken: response.token.access_token,
    expiresIn: response.token.expires_in,
    csrfToken: token,
  };
}

/**
 * The signed-in user, or a 401 when the session cookie is missing, expired or
 * forged. This is the authoritative answer to "is this request authenticated?"
 * — the cookie's presence is not.
 *
 * Memoized per request with React `cache`, so the several callers a single
 * request can have — `requireUser()` at the top of a Route Handler, then a DAL
 * that needs the caller's id for `user_id` — cost one upstream `/auth/me`
 * between them rather than one each.
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
 * `proxy.ts` deliberately skips `/api/*` on the assumption that those routes
 * answer 401 on their own — this is what makes that true. It matters more than
 * defense in depth: FastAPI authenticates `/auth/*` and nothing else today, so
 * without this an unauthenticated caller reaches every read and write in the
 * system.
 *
 * Authorization is a separate question and still unenforced here; see the note
 * in CLAUDE.md.
 */
export async function requireUser(): Promise<AuthenticatedUser> {
  return getCurrentUser();
}

/**
 * Ends the session upstream. Our own cookies are cleared by the Route Handler
 * regardless of what this does — signing out has to work even when FastAPI is
 * unreachable.
 */
export async function signOut(): Promise<void> {
  await serverFetch<unknown>("/auth/logout", { method: "PATCH" });
}
