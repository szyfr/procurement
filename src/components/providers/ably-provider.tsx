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
 * whoever the session cookie belongs to.
 *
 * Built once via `useState`'s lazy initializer so children (the sidebar, the
 * page) render immediately — including during SSR, where "use client" still
 * executes on the server — rather than waiting on an effect. `autoConnect`
 * is `false` for exactly that reason: construction must stay side-effect
 * free, both because it runs on the server (where Ably's Node transport
 * would otherwise immediately try to auth against the relative `authUrl`
 * and fail) and because React Strict Mode invokes `useState` initializers
 * twice in dev — with `autoConnect` on, the discarded instance from that
 * second call would still open a real connection.
 *
 * Connecting is left to the effect below, which also means it's the only
 * thing Strict Mode's dev-only mount→cleanup→mount replay touches: it closes
 * the connection and reconnects the same client, rather than leaving it
 * closed with nothing to reopen it.
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
        autoConnect: false,
      }),
  );

  useEffect(() => {
    client.connect();
    return () => client.close();
  }, [client]);

  return <BaseAblyProvider client={client}>{children}</BaseAblyProvider>;
}
