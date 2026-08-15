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
import { formatCurrency } from "@/lib/utils";
import { awardQuotation, canvassingKeys } from "@/modules/canvassing";

/**
 * Awards one item to the quote selected in the comparison table.
 *
 * Confirmed behind a dialog because the backend models no way back: the award
 * is an insert, nothing replaces or deletes it, and awarding again simply
 * records a second one.
 */
export function AwardVendorDialog({
  quotationId,
  itemId,
  itemName,
  vendorName,
  unitPrice,
  quantity,
  disabled,
}: {
  /** Null until a row is picked; the trigger stays disabled meanwhile. */
  quotationId: string | null;
  itemId: string;
  itemName: string;
  /** Null until a row is picked, or if the quote's vendor join missed. */
  vendorName: string | null;
  unitPrice: number | null;
  /** Already display copy, e.g. "10 pcs". */
  quantity: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const queryClient = useQueryClient();

  const { mutate: award, isPending: awarding } = useMutation({
    mutationFn: () =>
      // Only reachable from the dialog, which the trigger keeps shut until a
      // quotation is selected.
      awardQuotation({ quotationId: quotationId as string, itemIds: [itemId] }),
    onSuccess: (result) => {
      // A duplicate award isn't inserted — it comes back as an issue rather
      // than a thrown error, so it has to be checked explicitly.
      const [issue] = result.issues;

      setOpen(false);
      // Refetches the canvassing list (status derives from awards) and the
      // quote comparison (item's `quotation_id` now names the winner) — worth
      // doing even on an issue, since that means an award already existed.
      queryClient.invalidateQueries({ queryKey: canvassingKeys.all });

      if (issue) {
        toast.add({
          title: "Couldn't confirm this vendor",
          description: issue.message,
          type: "error",
        });
        return;
      }

      toast.add({
        title: "Vendor selection confirmed",
        description: `${itemName} was awarded to the selected quote.`,
        type: "success",
      });
    },
    onError: (cause) => {
      toast.add({
        title: "Couldn't confirm this vendor",
        description:
          cause instanceof Error ? cause.message : "Something went wrong.",
        type: "error",
      });
    },
  });

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        disabled={disabled || quotationId === null}
        render={<Button size="sm" />}
      >
        Confirm Vendor Selection
      </AlertDialogTrigger>
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogTitle>Award this quote?</AlertDialogTitle>
          <AlertDialogDescription>
            {itemName} ({quantity}) will be awarded to{" "}
            {vendorName ?? "the selected vendor"}
            {unitPrice === null
              ? ""
              : ` at ${formatCurrency(unitPrice, true)} per unit`}
            . The award is recorded straight away and can&apos;t be undone from
            here.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={awarding}>
            Keep Comparing
          </AlertDialogCancel>
          <AlertDialogAction onClick={() => award()} disabled={awarding}>
            {awarding ? <Spinner data-icon="inline-start" /> : null}
            Confirm Vendor
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
