import { relayCookieHeaders } from "@/lib/api/cookies";
import { toErrorResponse } from "@/lib/api/errors";
import { signOut } from "@/modules/auth/dal/auth.dal";

/**
 * Ends the session.
 *
 * FastAPI expires the cookies it issued and this relays the headers that do
 * it — there is no local copy to clear. A failure upstream therefore surfaces
 * as a failure here rather than a sign-out this app cannot actually perform:
 * the session belongs to the backend, so a user is signed out when it says so
 * and not before.
 */

export async function POST() {
  try {
    const setCookies = await signOut();

    return Response.json(
      { data: null },
      { headers: relayCookieHeaders(setCookies) },
    );
  } catch (error) {
    return toErrorResponse(error);
  }
}
