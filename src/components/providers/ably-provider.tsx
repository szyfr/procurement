"use client";

import * as Ably from "ably";
import { AblyProvider as BaseAblyProvider } from "ably/react";
import { useEffect, useState } from "react";

import { realtimeEndpoints } from "@/modules/realtime";

/**
 * Wraps the dashboard in a single Ably realtime connection.
 *
 * The client authenticates against our own origin (`authUrl`) rather than
 * holding a key — `/api/realtime/token` signs a capability-scoped JWT for
 * whoever the session cookie belongs to. Built once via `useState`'s lazy
 * initializer, not on every render, so remounts don't leak connections.
 *
 * No channel is subscribed here — this is connection plumbing only. A
 * feature that needs a channel calls `useChannel`/`usePresence` from
 * `ably/react` in its own components, underneath this provider.
 */
export function AblyRealtimeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [client] = useState(
    () =>
      new Ably.Realtime({
        authUrl: realtimeEndpoints.token,
        // The lazy initializer also runs during SSR, where "use client" still
        // executes on the server. There, Ably picks its Node transport (`got`)
        // and would immediately try to auth against the relative `authUrl`,
        // which `got` rejects outright. `autoConnect` skips that: the SSR
        // instance is thrown away unconnected, and the real one made on
        // hydration connects normally through the browser's fetch.
        autoConnect: typeof window !== "undefined",
      }),
  );

  useEffect(() => () => client.close(), [client]);

  return <BaseAblyProvider client={client}>{children}</BaseAblyProvider>;
}
