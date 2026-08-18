"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { logout } from "@/modules/auth/api";
import { LOGIN_PATH } from "@/modules/auth/constants";

export function useLogout() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: logout,
    // Runs whether or not the upstream call succeeded: the Route Handler
    // clears our cookies either way, so the client must not keep showing a
    // session it no longer has.
    onSettled: () => {
      // Everything cached was fetched as the signed-out user's predecessor.
      queryClient.clear();
      router.replace(LOGIN_PATH);
      router.refresh();
    },
  });
}
