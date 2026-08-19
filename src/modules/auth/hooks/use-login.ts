"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { login, requestCsrfCookie } from "@/modules/auth/api/client";
import { DEFAULT_SIGNED_IN_PATH } from "@/modules/auth/constants";
import type { Credentials } from "@/modules/auth/models/session";
import { authKeys } from "@/modules/auth/queries/auth.queries";

/**
 * The sign-in flow: prime the CSRF cookie, then post the credentials.
 *
 * Both calls go to this app's origin, and both come back carrying a cookie
 * FastAPI issued and the BFF relayed — the prime has to land first, because
 * the browser's copy of it is what the sign-in is checked against. Nothing is
 * returned that the caller has to store. `isPending` is the guard against a
 * double submit: a mutation already in flight is not restarted.
 */
export function useLogin(redirectTo: string = DEFAULT_SIGNED_IN_PATH) {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (credentials: Credentials) => {
      await requestCsrfCookie();

      return login(credentials);
    },
    onSuccess: async () => {
      // The session cookie only exists as of this response, so the cached
      // "signed out" answer has to go before anything reads it again.
      await queryClient.invalidateQueries({ queryKey: authKeys.all });

      router.replace(redirectTo);
      // The protected layouts resolve the session on the server; without this
      // they would re-render from the cached signed-out shell.
      router.refresh();
    },
  });
}
