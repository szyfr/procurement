"use client";

import { useMutation } from "@tanstack/react-query";

import { changePassword } from "@/modules/auth/api/client";

/**
 * Changes the signed-in user's password.
 *
 * Nothing is invalidated afterwards. A password is not part of any cached
 * query — `/auth/me` never carried it to the browser — and the JWT survives the
 * change, so neither the session query nor anything else goes stale.
 */
export function useChangePassword() {
  return useMutation({ mutationFn: changePassword });
}
