"use client";

import * as Ably from "ably";
import {
  AblyProvider as BaseAblyProvider,
  useConnectionStateListener,
} from "ably/react";
import { useCallback, useEffect, useRef, useState } from "react";

import { toast } from "@/components/ui/toast";
import { realtimeEndpoints } from "@/modules/realtime";

/** Hoisted so the listener effect keys off a stable identity, not a fresh
 *  array literal on every render. */
const OFFLINE_STATES: Ably.ConnectionState[] = ["suspended", "failed"];

/**
 * Tells the user when the connection is down, because nothing else can:
 * a stalled realtime feed looks exactly like a quiet one, so the pages would
 * silently stop being live.
 *
 * Only `suspended` (offline long enough that the SDK backed off) and `failed`
 * (terminal — most often a rejected `authUrl` after the session cookie
 * expired) are surfaced. Transient `disconnected` blips stay silent; the SDK
 * recovers from those unaided and a toast per network hiccup is just noise.
 *
 * The notice has no timeout because the condition it reports doesn't expire
 * on its own — it's dismissed when the connection actually returns.
 */
function RealtimeConnectionMonitor() {
  const noticeId = useRef<string | null>(null);

  useConnectionStateListener(
    OFFLINE_STATES,
    useCallback((stateChange: Ably.ConnectionStateChange) => {
      if (noticeId.current) return;

      noticeId.current = toast.add({
        title: "Live updates are offline",
        description:
          stateChange.current === "failed"
            ? "Reload the page to reconnect — your session may have expired."
            : "Reconnecting. Pages will catch up on their own once it's back.",
        type: "error",
        timeout: 0,
      });
    }, []),
  );

  useConnectionStateListener(
    "connected",
    useCallback(() => {
      if (!noticeId.current) return;

      toast.close(noticeId.current);
      noticeId.current = null;
    }, []),
  );

  return null;
}

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

  return (
    <BaseAblyProvider client={client}>
      <RealtimeConnectionMonitor />
      {children}
    </BaseAblyProvider>
  );
}
