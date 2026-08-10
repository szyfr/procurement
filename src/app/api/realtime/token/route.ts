import { ApiError, toErrorResponse } from "@/lib/api/errors";
import { getOptionalUser } from "@/modules/auth/dal/auth.dal";
import { issueAblyToken } from "@/modules/realtime/services/ably-token.service";

/**
 * `authUrl` target for the Ably client — returns a signed JWT as the bare
 * response body, the shape Ably's SDKs expect from a JWT `authUrl`. Gated on
 * the same session cookie as the rest of the app, since the token is scoped
 * to the caller's own id.
 *
 * `application/jwt` rather than `text/plain`: the SDK accepts either, but
 * only the former tells it the body is a JWT rather than an opaque token
 * string, and it's what the SDK names in its own error remediation text.
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
        "Content-Type": "application/jwt",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}
