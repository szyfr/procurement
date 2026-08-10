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
 * writes the item's `quotation_id` directly and then triggers the same
 * StatusService pass the PR list/detail hook listens to, so this reuses that
 * event and invalidates the quotations query wholesale — item ids aren't
 * known outside the awarded PR, same tradeoff the list invalidation already
 * makes.
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
