"use client";

import { ChannelProvider } from "ably/react";

import { PURCHASE_REQUESTS_CHANNEL } from "@/modules/purchase-requests/constants";

/**
 * Registers the `purchase-requests` channel for `ably/react`'s `useChannel` to
 * resolve against. A plain `"use client"` wrapper rather than inlining
 * `ChannelProvider` in the (server) dashboard layout — `ably/react` needs to
 * run under client React, and importing it straight into a Server Component
 * pulls in the RSC build of React instead, which breaks its `useContext` call.
 */
export function PurchaseRequestsChannelProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ChannelProvider channelName={PURCHASE_REQUESTS_CHANNEL}>
      {children}
    </ChannelProvider>
  );
}
