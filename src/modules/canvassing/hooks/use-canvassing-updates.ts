"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useChannel } from "ably/react";

import { canvassingKeys } from "@/modules/canvassing/queries/canvassing.queries";
import {
  PURCHASE_REQUEST_UPDATED_EVENT,
  PURCHASE_REQUESTS_CHANNEL,
} from "@/modules/purchase-requests";

/**
 * Keeps the quote comparison live when an award happens elsewhere. Awarding
 * writes the item's `quotation_id` and then triggers the same StatusService
 * pass the PR hook listens to, so there is no award-specific event to
 * subscribe to — this reuses that one and invalidates the quotations query
 * wholesale, since the message names the PR but not the items that changed.
 */
export function useCanvassingUpdates(purchaseRequestId: string) {
  const queryClient = useQueryClient();

  useChannel(
    PURCHASE_REQUESTS_CHANNEL,
    PURCHASE_REQUEST_UPDATED_EVENT,
    (message) => {
      const request = message.data as { _id?: string };
      if (request?._id !== purchaseRequestId) return;

      queryClient.invalidateQueries({ queryKey: canvassingKeys.all });
    },
  );
}
