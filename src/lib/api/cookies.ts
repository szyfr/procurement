import { cookies } from "next/headers";

import { CSRF_COOKIE } from "@/modules/auth/constants";

/**
 * Cookie plumbing for the BFF boundary.
 *
 * FastAPI owns the auth cookies — it creates them, sets their attributes,
 * validates them and expires them. The browser only ever talks to this origin,
 * so two things follow and both live here: every upstream call carries the
 * caller's cookies forward by hand (there is no cookie jar on the server), and
 * every `Set-Cookie` FastAPI answers with is relayed to the browser unchanged.
 *
 * Server-only; importing from a Client Component fails the build.
 */

/**
 * The caller's cookies, serialized for an upstream `Cookie` header.
 *
 * Deliberately unguarded: `cookies()` is a request-time API, so reaching it
 * during a prerender is how Next.js learns the route must be dynamic —
 * correct, since every upstream call depends on who's asking. Catching the
 * bailout here would just turn it into an opaque fetch failure at build time.
 */
export async function forwardedCookieHeader(): Promise<string | undefined> {
  const header = (await cookies()).toString();

  return header || undefined;
}

/**
 * The CSRF token the caller holds, for the header upstream compares it to.
 *
 * FastAPI's `validate_xsrf` is a plain double submit — cookie against header,
 * no state of its own. The browser sends the cookie; the header half is added
 * here, once, for every upstream call rather than per route.
 */
export async function forwardedCsrfToken(): Promise<string | undefined> {
  return (await cookies()).get(CSRF_COOKIE)?.value;
}

/**
 * FastAPI's `Set-Cookie` lines, ready to go out on a BFF response.
 *
 * Relayed verbatim: `HttpOnly`, `Secure`, `SameSite`, `Path` and `Max-Age` are
 * FastAPI's to decide, and it writes them for the origin the browser is on
 * rather than its own. Rewriting any of them here would make this app a second
 * owner of a cookie that has one.
 *
 * `append` rather than `set` because logout expires two cookies at once, and
 * `Set-Cookie` is the one header that may legitimately repeat.
 */
export function relayCookieHeaders(setCookies: readonly string[]): Headers {
  const headers = new Headers();

  for (const line of setCookies) headers.append("set-cookie", line);

  return headers;
}
