/**
 * Names and paths the auth flow is built around.
 *
 * Both cookie names are FastAPI's. It creates them, sets their attributes and
 * expires them; the BFF only relays the headers. These constants exist so the
 * two places that still have to recognize a cookie by name — the proxy's
 * presence check and the CSRF header forwarding — spell it the same way the
 * backend does.
 */

/** Carries the JWT. HttpOnly, so nothing client-side can read it. */
export const SESSION_COOKIE = "access_token";

/** The CSRF token FastAPI mints. Readable by design; see `validate_xsrf`. */
export const CSRF_COOKIE = "XSRF-TOKEN";

/** Header `validate_xsrf` compares the CSRF cookie against. */
export const CSRF_HEADER = "X-XSRF-TOKEN";

/**
 * What `ChangePasswordRequest` upstream declares: `min_length=6` on all three
 * of `old_password`, `password` and `confirm_password`. Checking it here turns
 * a 422 the user would have to decode into inline copy on the field.
 */
export const MIN_PASSWORD_LENGTH = 6;

export const LOGIN_PATH = "/login";

/** Where a signed-in user lands when no other destination was requested. */
export const DEFAULT_SIGNED_IN_PATH = "/dashboard";

/** Search param carrying the page a signed-out user was turned away from. */
export const REDIRECT_PARAM = "next";
