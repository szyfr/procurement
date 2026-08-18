"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as React from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/toast";
import { errorMessage } from "@/lib/utils";
import {
  purchaseRequestKeys,
  setPurchaseRequestStatus,
} from "@/modules/purchase-requests";

/**
 * Cancels a request from its detail page. Confirmed behind a dialog because the
 * UI models no way back: `canceled` is terminal, and the transition also carries
 * every item on the request with it.
 */
export function CancelPurchaseRequestDialog({
  id,
  no,
}: {
  id: string;
  no: string;
}) {
  const [open, setOpen] = React.useState(false);
  const queryClient = useQueryClient();

  const { mutate: cancel, isPending: canceling } = useMutation({
    mutationFn: () => setPurchaseRequestStatus(id, "canceled"),
    onSuccess: () => {
      toast.add({
        title: "Request canceled",
        description: `${no} and its items are no longer being processed.`,
        type: "success",
      });
      setOpen(false);
      // The transition returns nothing, so the new status comes from a refetch.
      queryClient.invalidateQueries({
        queryKey: purchaseRequestKeys.detail(id),
      });
      queryClient.invalidateQueries({ queryKey: purchaseRequestKeys.lists() });
    },
    onError: (cause) => {
      toast.add({
        title: "Couldn't cancel this request",
        description: errorMessage(cause),
        type: "error",
      });
    },
  });

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger render={<Button variant="outline" size="sm" />}>
        Cancel Request
      </AlertDialogTrigger>
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogTitle>Cancel this request?</AlertDialogTitle>
          <AlertDialogDescription>
            {no} and every item on it will be marked canceled. This can&apos;t
            be undone from here.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={canceling}>
            Keep Request
          </AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={() => cancel()}
            disabled={canceling}
          >
            {canceling ? <Spinner data-icon="inline-start" /> : null}
            Cancel Request
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
