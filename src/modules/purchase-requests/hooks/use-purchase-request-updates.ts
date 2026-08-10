"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useChannel } from "ably/react";

import {
  PURCHASE_REQUEST_UPDATED_EVENT,
  PURCHASE_REQUESTS_CHANNEL,
} from "@/modules/purchase-requests/constants";
import type { PurchaseRequestDetail } from "@/modules/purchase-requests/models/purchase-request";
import { purchaseRequestKeys } from "@/modules/purchase-requests/queries/purchase-request.queries";

/**
 * Keeps purchase request views live when a status change happens elsewhere.
 * FastAPI's StatusService publishes the full updated document on every
 * transition, so it refreshes the cache for the request that changed — no
 * refetch — while the list, which sorts/filters on status, is invalidated to
 * pick up the change.
 */
export function usePurchaseRequestUpdates() {
  const queryClient = useQueryClient();

  useChannel(
    PURCHASE_REQUESTS_CHANNEL,
    PURCHASE_REQUEST_UPDATED_EVENT,
    (message) => {
      const request = message.data as PurchaseRequestDetail;
      if (!request?._id) return;

      // The channel fans every transition out to every subscriber, so most of
      // what arrives is for requests this browser never asked for. Seeding
      // those would make a later navigation render a pushed document instead
      // of an authoritative read, so only existing entries are refreshed.
      const detailKey = purchaseRequestKeys.detail(request._id);
      if (queryClient.getQueryData(detailKey) !== undefined) {
        queryClient.setQueryData(detailKey, request);
      }

      queryClient.invalidateQueries({ queryKey: purchaseRequestKeys.lists() });
    },
  );
}
