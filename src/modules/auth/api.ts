import { bffRequest } from "@/lib/api/bff-client";
import type { ChangePasswordDto } from "@/modules/auth/dto";
import type { Credentials, SignedInUser } from "@/modules/auth/models/session";

const BASE = "/api/auth";

/**
 * Auth calls against the BFF. Runs in the browser and handles no cookies of
 * its own: the session and CSRF cookies are HttpOnly and same-origin, so the
 * browser attaches them and nothing here reads, writes or parses them.
 */

/** Primes the CSRF cookie. Must precede `login`. */
export function requestCsrfCookie(signal?: AbortSignal) {
  return bffRequest<null>(`${BASE}/csrf-cookie`, { signal });
}

export function login(credentials: Credentials) {
  return bffRequest<SignedInUser>(`${BASE}/login`, {
    method: "POST",
    body: credentials,
  });
}

export function logout() {
  return bffRequest<null>(`${BASE}/logout`, { method: "POST" });
}

/**
 * Changes the caller's own password. Answers 204 — there is nothing to hand
 * back, and the session cookie is untouched, so the user stays signed in.
 */
export function changePassword(payload: ChangePasswordDto) {
  return bffRequest<void>(`${BASE}/change-password`, {
    method: "PATCH",
    body: payload,
  });
}
