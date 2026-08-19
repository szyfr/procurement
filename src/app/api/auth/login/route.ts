import type { NextRequest } from "next/server";

import { relayCookieHeaders } from "@/lib/api/cookies";
import { toErrorResponse } from "@/lib/api/errors";
import { signIn } from "@/modules/auth/dal/auth.dal";
import { parseCredentials } from "@/modules/auth/validation/login.validation";

/**
 * Exchanges credentials for FastAPI's session cookie.
 *
 * The cookie is created upstream and relayed here with its attributes intact —
 * this route sets nothing of its own. The JWT also comes back in the upstream
 * body, and that copy stops at the DAL: the browser receives the user's name
 * and email, and the token only in the form it cannot read.
 */

export async function POST(request: NextRequest) {
  try {
    const credentials = parseCredentials(
      await request.json().catch(() => null),
    );

    const { data: user, setCookies } = await signIn(credentials);

    return Response.json(
      { data: user },
      { headers: relayCookieHeaders(setCookies) },
    );
  } catch (error) {
    return toErrorResponse(error);
  }
}
