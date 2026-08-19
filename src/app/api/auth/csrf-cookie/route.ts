import { relayCookieHeaders } from "@/lib/api/cookies";
import { toErrorResponse } from "@/lib/api/errors";
import { issueCsrfCookie } from "@/modules/auth/dal/auth.dal";

/**
 * Primes the CSRF cookie ahead of a sign-in.
 *
 * FastAPI mints the token and reports it as a `Set-Cookie` with no body at
 * all, so relaying the header is the entire response. The browser then holds
 * the cookie half of the double submit, and `serverFetch` supplies the header
 * half from it on the sign-in that follows.
 */

export async function GET() {
  try {
    const setCookies = await issueCsrfCookie();

    return Response.json(
      { data: null },
      { headers: relayCookieHeaders(setCookies) },
    );
  } catch (error) {
    return toErrorResponse(error);
  }
}
