/**
 * What the UI knows about the signed-in user.
 *
 * This is `/auth/me`'s response shape with one field withheld: the endpoint's
 * model extends the stored user document, so the payload also carries
 * `password` — the bcrypt hash. That one is picked off in the DAL rather than
 * passed through, which is the single deliberate exception to "hand back what
 * the backend sent". See `getCurrentUser`.
 *
 * There is no token here either, by design. The JWT lives in the HttpOnly
 * cookie FastAPI set, which the browser cannot read, so "am I signed in?" is
 * answered by asking the backend (`GET /api/auth/session`), never by
 * inspecting anything held client-side.
 */
export interface AuthenticatedUser {
  /**
   * FastAPI serializes the response model by alias, so the id arrives as
   * `_id`; the handler also sets a plain `id`. Both spellings are accepted —
   * read it with `userId`.
   */
  _id?: string;
  id?: string;
  email: string;
  firstname: string;
  lastname: string;
  /** Permission slugs; empty until roles are granted upstream. */
  permissions?: string[];
}

/**
 * What the login response alone can tell us — `LoginResponse.user`, verbatim.
 * `POST /auth/login` returns no permissions, so the sign-in result is
 * deliberately narrower than a session; the full user is read back from
 * `/auth/me` once the cookie is set.
 */
export interface SignedInUser {
  _id: string;
  email: string;
  /** Already joined upstream from `firstname` and `lastname`. */
  name: string;
}

/** What the login form submits. */
export interface Credentials {
  email: string;
  password: string;
}

/** Whichever spelling of the id the backend used on this response. */
export function userId(user: AuthenticatedUser) {
  return user._id ?? user.id ?? "";
}

/** Display name. `/auth/me` stores the two halves separately. */
export function userName(user: AuthenticatedUser) {
  return [user.firstname, user.lastname].filter(Boolean).join(" ").trim();
}
