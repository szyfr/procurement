import { ApiError, toErrorResponse } from "@/lib/api/errors";
import { getOptionalUser } from "@/modules/auth/dal/auth.dal";
import { issueAblyToken } from "@/modules/realtime/services/ably-token.service";

/**
 * `authUrl` target for the Ably client — returns a signed JWT as plain text,
 * the shape Ably's SDKs expect from a JWT `authUrl`. Gated on the same
 * session cookie as the rest of the app, since the token is scoped to the
 * caller's own id.
 */

export async function GET() {
  try {
    const user = await getOptionalUser();

    if (!user) {
      throw new ApiError(401, "unauthorized", "Not signed in.");
    }

    const token = await issueAblyToken(user);

    return new Response(token, {
      headers: {
        "Content-Type": "text/plain",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}
