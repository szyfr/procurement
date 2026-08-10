import { SignJWT } from "jose";

import { ApiError } from "@/lib/api/errors";
import type { AuthenticatedUser } from "@/modules/auth/models/session";
import { userId } from "@/modules/auth/models/session";
import { PURCHASE_REQUESTS_CHANNEL } from "@/modules/purchase-requests/constants";

/**
 * Mints the JWT an Ably client trades for a realtime connection.
 *
 * Signed here rather than requested from Ably (the token-request flow) so
 * there is no round trip to Ably's servers and capabilities can be scoped
 * per caller. `ABLY_API_KEY` never leaves this module — the browser only
 * ever sees the signed JWT via the Route Handler.
 */

const JWT_TTL_SECONDS = 60 * 60;

function readApiKey(): { keyName: string; keySecret: string } {
  const apiKey = process.env.ABLY_API_KEY;

  if (!apiKey) {
    throw new Error("ABLY_API_KEY is not set");
  }

  const separator = apiKey.indexOf(":");
  if (separator === -1) {
    throw new Error("ABLY_API_KEY is malformed — expected 'keyId:keySecret'");
  }

  return {
    keyName: apiKey.slice(0, separator),
    keySecret: apiKey.slice(separator + 1),
  };
}

/**
 * Every signed-in caller can subscribe to `purchase-requests` — FastAPI's
 * StatusService broadcasts every status transition there, and any viewer of
 * a list or detail page needs to hear it, not just the request's own
 * requester. `user:{clientId}:*` stays as a private namespace for a future
 * per-user feature. Publish is deliberately withheld either way; FastAPI's
 * ably-python service owns publishing.
 */
function capabilityFor(clientId: string) {
  return {
    [`user:${clientId}:*`]: ["subscribe"],
    [PURCHASE_REQUESTS_CHANNEL]: ["subscribe"],
  };
}

/** Signs a short-lived, capability-scoped JWT for the given caller. */
export async function issueAblyToken(user: AuthenticatedUser): Promise<string> {
  const id = userId(user);
  if (!id) {
    throw new ApiError(500, "internal_error", "Signed-in user has no id.");
  }

  const { keyName, keySecret } = readApiKey();
  const secret = new TextEncoder().encode(keySecret);

  return new SignJWT({
    "x-ably-capability": JSON.stringify(capabilityFor(id)),
    "x-ably-clientId": id,
  })
    .setProtectedHeader({ alg: "HS256", kid: keyName })
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + JWT_TTL_SECONDS)
    .sign(secret);
}
