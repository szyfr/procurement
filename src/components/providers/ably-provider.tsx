"use client";

import * as Ably from "ably";
import {
  AblyProvider as BaseAblyProvider,
  useConnectionStateListener,
} from "ably/react";
import { useCallback, useEffect, useRef, useState } from "react";

import { toast } from "@/components/ui/toast";
import { realtimeEndpoints } from "@/modules/realtime";

/** Hoisted: `useConnectionStateListener` keys its effect on this identity, so
 *  an inline array would resubscribe on every render. */
const OFFLINE_STATES: Ably.ConnectionState[] = ["suspended", "failed"];

/**
 * A stalled feed is indistinguishable from a quiet one, so connection loss
 * has to be said out loud or the pages silently stop being live.
 *
 * Only `suspended` and `failed` are surfaced — the SDK recovers from
 * `disconnected` unaided, and a toast per network blip is noise. `failed` is
 * terminal, and usually means the session cookie behind `authUrl` expired.
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
 * Wraps the dashboard in a single Ably realtime connection, authenticated
 * against our own origin — `/api/realtime/token` signs a capability-scoped
 * JWT for whoever the session cookie belongs to, so no key reaches the
 * browser.
 *
 * Built in a `useState` initializer rather than at module scope as Ably's
 * React guide suggests: this file also runs on the server during SSR, where a
 * module-scope client would be shared across requests and users.
 * `autoConnect: false` keeps construction side-effect free — the relative
 * `authUrl` cannot resolve on the server, and Strict Mode's double-invoked
 * initializer would otherwise leave the discarded instance holding a real
 * connection.
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

  // Closing on cleanup is safe under Strict Mode's dev-only
  // mount→cleanup→mount replay: `connect()` reopens the same client.
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
