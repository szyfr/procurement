"use client";

import {
  isServer,
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import type * as React from "react";

import { BffError } from "@/lib/api/bff-client";
import { LOGIN_PATH } from "@/modules/auth/constants";

/**
 * TanStack Query wiring for the whole app.
 *
 * The client is deliberately not a module-level singleton: on the server that
 * would share one cache across every request (and every user), so a fresh one
 * is built per render there and reused only in the browser.
 */

/**
 * A session that expired mid-use used to leave the user on a fully rendered
 * dashboard where every query failed with its own toast: nothing cleared the
 * cache, nothing cleared the dead cookie, and `proxy.ts` kept waving them
 * through on cookie presence until `Max-Age` elapsed.
 *
 * A hard navigation rather than `router.push`, because this runs outside the
 * component tree and the point is to discard all client state and let the
 * server decide what happens next. Every 401 that gets here is a real expiry:
 * nothing in the browser probes the session, so there is no "am I signed in?"
 * call whose 401 would be a legitimate answer.
 */
let redirecting = false;

function handleQueryError(error: unknown) {
  if (isServer) return;
  if (!(error instanceof BffError) || error.status !== 401) return;
  if (redirecting || window.location.pathname === LOGIN_PATH) return;

  redirecting = true;
  window.location.href = LOGIN_PATH;
}

function makeQueryClient() {
  return new QueryClient({
    queryCache: new QueryCache({ onError: handleQueryError }),
    mutationCache: new MutationCache({ onError: handleQueryError }),
    defaultOptions: {
      queries: {
        // Purchasing data is operational, so nothing is cached for long — but
        // a short window keeps paging back and forth from refetching on every
        // click.
        staleTime: 30_000,
        // The BFF already normalizes upstream failures into user-safe
        // messages; one retry covers a blip without leaving the error state
        // hidden behind seconds of backoff. An expired session is not a blip,
        // so it is not retried — it goes straight to the redirect above. Nor
        // is a missing permission: the second attempt is denied exactly like
        // the first, and unlike a 401 there is nowhere to send the user.
        retry: (failureCount, error) => {
          if (
            error instanceof BffError &&
            (error.status === 401 || error.status === 403)
          ) {
            return false;
          }
          return failureCount < 1;
        },
        refetchOnWindowFocus: false,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

function getQueryClient() {
  if (isServer) return makeQueryClient();

  browserQueryClient ??= makeQueryClient();

  return browserQueryClient;
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  // Not useState(makeQueryClient) — Suspense could throw away the first client
  // before it is ever used; getQueryClient owns the browser singleton instead.
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
