import { BffError, bffRequest } from "@/lib/api/bff-client";
import { authEndpoints } from "@/modules/auth/api/endpoints";
import type { ChangePasswordDto } from "@/modules/auth/dto/auth.dto";
import type {
  AuthenticatedUser,
  Credentials,
  SignedInUser,
} from "@/modules/auth/models/session";

/**
 * Auth calls against the BFF. Runs in the browser and handles no cookies of
 * its own: the session and CSRF cookies are HttpOnly and same-origin, so the
 * browser attaches them and nothing here reads, writes or parses them.
 */

/** Primes the CSRF cookie. Must precede `login`. */
export function requestCsrfCookie(signal?: AbortSignal) {
  return bffRequest<null>(authEndpoints.csrfCookie, { signal });
}

export function login(credentials: Credentials) {
  return bffRequest<SignedInUser>(authEndpoints.login, {
    method: "POST",
    body: credentials,
  });
}

export function logout() {
  return bffRequest<null>(authEndpoints.logout, { method: "POST" });
}

/**
 * Changes the caller's own password. Answers 204 — there is nothing to hand
 * back, and the session cookie is untouched, so the user stays signed in.
 */
export function changePassword(payload: ChangePasswordDto) {
  return bffRequest<void>(authEndpoints.changePassword, {
    method: "PATCH",
    body: payload,
  });
}

/**
 * The signed-in user, or `null` when there is no session.
 *
 * A 401 is the expected answer for a signed-out caller, not a failure, so it
 * resolves rather than throwing — a component can render its signed-out state
 * without treating it as an error. Everything else still throws.
 */
export async function fetchSession(
  signal?: AbortSignal,
): Promise<AuthenticatedUser | null> {
  try {
    return await bffRequest<AuthenticatedUser>(authEndpoints.session, {
      signal,
    });
  } catch (error) {
    if (error instanceof BffError && error.status === 401) return null;

    throw error;
  }
}
