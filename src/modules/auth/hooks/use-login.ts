"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { login, requestCsrfCookie } from "@/modules/auth/api";
import { DEFAULT_SIGNED_IN_PATH } from "@/modules/auth/constants";
import type { Credentials } from "@/modules/auth/models/session";

/**
 * The sign-in flow: prime the CSRF cookie, then post the credentials.
 *
 * Both calls go to this app's origin and both come back as `Set-Cookie`, so
 * nothing is returned that the caller has to store. `isPending` is the guard
 * against a double submit — a mutation already in flight is not restarted.
 */
export function useLogin(redirectTo: string = DEFAULT_SIGNED_IN_PATH) {
  const router = useRouter();

  return useMutation({
    mutationFn: async (credentials: Credentials) => {
      await requestCsrfCookie();

      return login(credentials);
    },
    onSuccess: () => {
      // Nothing cached needs discarding: the browser never asks who it is, so
      // there is no "signed out" answer sitting in the query cache.
      router.replace(redirectTo);
      // The protected layouts resolve the session on the server; without this
      // they would re-render from the cached signed-out shell.
      router.refresh();
    },
  });
}
