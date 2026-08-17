import type { NextRequest } from "next/server";

import { toErrorResponse } from "@/lib/api/errors";
import { changePassword } from "@/modules/auth/dal/auth.dal";
import { parseChangePasswordPayload } from "@/modules/auth/validation/change-password.validation";

/**
 * Changes the signed-in user's password.
 *
 * No `requireUser()` here, and deliberately: `auth_controller.py` is the one
 * upstream controller that applies `get_current_active_user`, so this route's
 * target already 401s an anonymous caller. Adding the gate would buy nothing
 * but a second `/auth/me` round trip per submit.
 *
 * Nothing comes back on success — the new password is not echoed, no cookie is
 * rewritten (the JWT stays valid), so the route answers 204.
 */

export async function PATCH(request: NextRequest) {
  try {
    const payload = parseChangePasswordPayload(
      await request.json().catch(() => null),
    );

    await changePassword(payload);

    return new Response(null, { status: 204 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
