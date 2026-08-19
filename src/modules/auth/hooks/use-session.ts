"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { logout } from "@/modules/auth/api/client";
import { LOGIN_PATH } from "@/modules/auth/constants";
import { sessionQuery } from "@/modules/auth/queries/auth.queries";

/**
 * The signed-in user as the backend reports it, or `null`. Components that
 * need the user in the browser read it from here rather than from any stored
 * copy — there is no token to decode and no state to keep in sync.
 */
export function useSession() {
  return useQuery(sessionQuery());
}

export function useLogout() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: logout,
    // Only on success, because only FastAPI can end the session: it expires
    // the cookie and the BFF relays that. Clearing the cache and leaving for
    // the login page after a failed call would show a signed-out app to a
    // browser that still holds a live cookie — the login page would verify the
    // session and send them straight back.
    onSuccess: () => {
      // Everything cached was fetched as the signed-out user's predecessor.
      queryClient.clear();
      router.replace(LOGIN_PATH);
      router.refresh();
    },
  });
}
