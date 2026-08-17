"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircleIcon } from "lucide-react";
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
import {
  purchaseRequestKeys,
  setPurchaseRequestStatus,
} from "@/modules/purchase-requests";

/**
 * Closes out a request whose items have all been delivered.
 *
 * This exists because nothing upstream moves the request itself: neither
 * `PATCH /{id}/delivered` nor the partial-delivery handler dispatches
 * `StatusVerificationJob`, so a request with every item `completed` keeps
 * reading "PO Created" forever.
 *
 * Confirmed behind a dialog for the same reason cancelling is: the UI models no
 * way back out of `completed`, and the transition carries every item on the
 * request with it.
 */
export function CompletePurchaseRequestDialog({
  id,
  no,
  itemCount,
}: {
  id: string;
  no: string;
  itemCount: number;
}) {
  const [open, setOpen] = React.useState(false);
  const queryClient = useQueryClient();

  const { mutate: complete, isPending: completing } = useMutation({
    mutationFn: () => setPurchaseRequestStatus(id, "completed"),
    onSuccess: () => {
      toast.add({
        title: "Request completed",
        description: `${no} is closed out — every item has been delivered.`,
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
        title: "Couldn't complete this request",
        description:
          cause instanceof Error ? cause.message : "Something went wrong.",
        type: "error",
      });
    },
  });

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger render={<Button size="sm" />}>
        <CheckCircleIcon data-icon="inline-start" />
        Mark as Completed
      </AlertDialogTrigger>
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogTitle>Mark this request completed?</AlertDialogTitle>
          <AlertDialogDescription>
            All {itemCount} item{itemCount === 1 ? "" : "s"} on {no} have been
            delivered. Completing closes the request out — this can&apos;t be
            undone from here.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={completing}>Keep Open</AlertDialogCancel>
          <AlertDialogAction onClick={() => complete()} disabled={completing}>
            {completing ? <Spinner data-icon="inline-start" /> : null}
            Mark as Completed
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
