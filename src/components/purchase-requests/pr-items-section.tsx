"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as React from "react";
import { useCan } from "@/components/providers/permissions-provider";
import { MarkDeliveredDialog } from "@/components/purchase-requests/mark-delivered-dialog";
import { PartialDeliveryDialog } from "@/components/purchase-requests/partial-delivery-dialog";
import { PurchaseRequestItemsBulkBar } from "@/components/purchase-requests/pr-items-bulk-bar";
import {
  canRecordPartialDelivery,
  isDeliverySelectable,
  isItemSelectable,
  isProcessSelectable,
  isProofSelectable,
  PurchaseRequestItemsTable,
} from "@/components/purchase-requests/pr-items-table";
import { ProcessItemsDialog } from "@/components/purchase-requests/process-items-dialog";
import {
  ProofOfOrderDialog,
  type ProofOfOrderSaveGroup,
} from "@/components/purchase-requests/proof-of-order-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/toast";
import { PERMISSIONS } from "@/modules/auth/constants/permissions";
import {
  createPurchaseRequestProof,
  markPurchaseRequestDelivered,
  type ProcessItemDecision,
  type PurchaseRequestDetail,
  type PurchaseRequestItem,
  processPurchaseRequestItems,
  purchaseRequestKeys,
  recordPartialDelivery,
} from "@/modules/purchase-requests";

/**
 * Items table plus the three bulk workflows that run off its checkbox column:
 * the approve/reject decision, proof of order and delivery. All read the same
 * selection and each re-filters it through its own eligibility rule, so one
 * set of checkboxes serves all three.
 *
 * Decision: one `PATCH /purchase-requests/{id}/items` covering the selection.
 * FastAPI also exposes a per-item route and the BFF still carries it, but no
 * row action calls it — a decision on one line goes through the same bar as a
 * decision on twenty, so there is one path to audit rather than two.
 * Approving is what raises the purchase order: since `StatusService` stopped
 * creating one on submit, a directly-sourced item reaches `po-created` no
 * other way.
 *
 * Proof of order: each vendor group in the dialog becomes its own
 * `POST /purchase-request-proofs` call — the backend takes one delivery date
 * and one vendor reference per proof, so a mixed-vendor selection saves as
 * several requests, not one.
 *
 * Delivery: a single `PATCH /purchase-requests/{id}/delivered` covering the
 * whole selection.
 *
 * Partial delivery is the exception and hangs off the row action menu instead:
 * its amount is specific to one line, so there is nothing sensible to batch.
 *
 * Neither overlays its result locally. The proof response carries no filename
 * to show (see `pr-items-table.tsx`) and the delivery response carries nothing
 * at all, so a successful save just invalidates the detail query and the table
 * picks up what actually persisted.
 */
export function PurchaseRequestItemsSection({
  request,
  onHighlightProofs,
}: {
  request: PurchaseRequestDetail;
  onHighlightProofs: (itemId: string) => void;
}) {
  const queryClient = useQueryClient();

  // Separate endpoints, separate grants — a warehouse user who can record
  // deliveries need not be able to file proofs of order, and neither implies
  // the authority to approve an item onto a purchase order.
  const canAddProof = useCan(PERMISSIONS.purchaseRequestProof.store);
  const canMarkDelivered = useCan(PERMISSIONS.purchaseRequestItem.delivered);
  const canRecordPartial = useCan(
    PERMISSIONS.purchaseRequestItem.partialDelivery,
  );
  // The bulk decision route carries its own grant upstream, separate from the
  // per-item `.process` one the BFF still exposes.
  const canProcessSelection = useCan(
    PERMISSIONS.purchaseRequestItem.massProcess,
  );
  // Nothing to act on means nothing to select; the checkbox column goes too.
  const canSelectItems = canAddProof || canMarkDelivered || canProcessSelection;

  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [saveError, setSaveError] = React.useState<string | null>(null);
  const [deliveredOpen, setDeliveredOpen] = React.useState(false);
  const [deliveredError, setDeliveredError] = React.useState<string | null>(
    null,
  );
  // The row the action menu was opened from. Held as an id rather than the
  // item itself so a refetch can't leave the dialog rendering a stale row.
  const [partialItemId, setPartialItemId] = React.useState<string | null>(null);
  const [partialError, setPartialError] = React.useState<string | null>(null);
  // The decision awaiting confirmation. It always applies to the selection, so
  // unlike `partialItemId` there is no row to remember alongside it.
  const [decision, setDecision] = React.useState<ProcessItemDecision | null>(
    null,
  );
  const [decisionError, setDecisionError] = React.useState<string | null>(null);

  const { mutateAsync: saveGroups, isPending: saving } = useMutation({
    mutationFn: async (groups: ProofOfOrderSaveGroup[]) => {
      const results = await Promise.allSettled(
        groups.map((group) =>
          createPurchaseRequestProof(
            {
              delivery_date: group.deliveryDate,
              vendor_reference_no: group.vendorReference,
              purchase_request_item_ids: group.itemIds,
            },
            group.files,
          ),
        ),
      );

      // One rejected group must not hide the others that already persisted —
      // report savedItemIds so the caller can drop them from the selection
      // and retry only what actually failed.
      const savedItemIds = groups.flatMap((group, index) =>
        results[index]?.status === "fulfilled" ? group.itemIds : [],
      );
      const rejected = results.filter((result) => result.status === "rejected");
      // `allSettled` swallows the reasons, so the first one is carried out to
      // the message — otherwise a backend validation error reads as a bare
      // "1 of 2 vendor groups failed".
      const firstReason = rejected[0]?.reason;

      return {
        savedItemIds,
        failedCount: rejected.length,
        firstError:
          firstReason instanceof Error ? firstReason.message : undefined,
      };
    },
  });

  const { mutateAsync: markDelivered, isPending: markingDelivered } =
    useMutation({
      mutationFn: (input: { itemIds: string[]; deliveryDate: string }) =>
        markPurchaseRequestDelivered(request._id, {
          item_ids: input.itemIds,
          delivery_date: input.deliveryDate,
        }),
    });

  const { mutateAsync: savePartial, isPending: savingPartial } = useMutation({
    mutationFn: (input: { itemId: string; amount: number }) =>
      recordPartialDelivery(request._id, input.itemId, {
        amount: input.amount,
      }),
  });

  const { mutateAsync: submitDecision, isPending: deciding } = useMutation({
    mutationFn: (input: { outcome: ProcessItemDecision; itemIds: string[] }) =>
      processPurchaseRequestItems(request._id, {
        status: input.outcome,
        items: input.itemIds,
      }),
  });

  // Resolved from the live list, so a refetch that closes the item out drops
  // the dialog rather than leaving it pointed at a row that no longer applies.
  // Re-checked through the table's own rule, not just the delivery window, so
  // the single-unit exclusion holds here too.
  const partialItem =
    request.items.find(
      (item) => item._id === partialItemId && canRecordPartialDelivery(item),
    ) ?? null;

  const selectableIds = request.items
    .filter(isItemSelectable)
    .map((item) => item._id);
  // Eligibility is re-checked here, not just held in `selectedIds`: a refetch
  // can move an item on (someone else recorded its proof, or delivered it)
  // while its id is still in the set, and a stale id would otherwise be
  // submitted. Each action re-filters through its own rule, so a selection the
  // one can't act on doesn't block the other.
  const selectedItems = request.items.filter(
    (item) => selectedIds.has(item._id) && isProofSelectable(item),
  );
  const selectedDeliveryItems = request.items.filter(
    (item) => selectedIds.has(item._id) && isDeliverySelectable(item),
  );
  const selectedProcessItems = request.items.filter(
    (item) => selectedIds.has(item._id) && isProcessSelectable(item),
  );
  // What the confirmation is actually about. Re-filtered from the live list
  // above on every render, so an item the backend has since moved on drops
  // out of the dialog instead of being submitted from it.
  const decisionItems = decision ? selectedProcessItems : [];
  const deliveredCount = request.items.filter(
    (item) => item.status === "completed",
  ).length;

  // Each `open` below is derived from its action's item count, so the selection
  // clearing (via the bulk bar's "Clear" or a saved/refetched item dropping
  // out) can close a dialog without `onOpenChange` firing. Left unsynced, the
  // flag would stay true and the next selection would reopen it unprompted.
  React.useEffect(() => {
    if (selectedItems.length === 0) setDialogOpen(false);
  }, [selectedItems.length]);

  React.useEffect(() => {
    if (selectedDeliveryItems.length === 0) setDeliveredOpen(false);
  }, [selectedDeliveryItems.length]);

  // Same reasoning, one step further: the decision dialog's `open` is derived
  // from `decisionItems`, so an emptied selection closes it without
  // `onOpenChange` firing. Left set, the intent would reopen it the moment the
  // next eligible item was picked.
  React.useEffect(() => {
    if (decisionItems.length === 0) setDecision(null);
  }, [decisionItems.length]);

  function toggleItem(id: string, checked: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function toggleAll(checked: boolean) {
    setSelectedIds(checked ? new Set(selectableIds) : new Set());
  }

  async function handleRecordPartialDelivery(amount: number) {
    if (!partialItem) return;

    setPartialError(null);

    try {
      await savePartial({ itemId: partialItem._id, amount });
    } catch (error) {
      setPartialError(
        error instanceof Error ? error.message : "Something went wrong.",
      );
      return;
    }

    queryClient.invalidateQueries({
      queryKey: purchaseRequestKeys.detail(request._id),
    });
    queryClient.invalidateQueries({ queryKey: purchaseRequestKeys.lists() });

    const label = partialItem.material?.description || partialItem.material_id;
    // The amount is the running total, not what just arrived, so the toast
    // reads as a position rather than as a receipt for this shipment.
    setPartialItemId(null);
    toast.add({
      title: `${label}: ${amount} of ${partialItem.quantity} received`,
      type: "success",
    });
  }

  /**
   * Sends the confirmed decision. Approving an item is what raises its
   * purchase order upstream, so there is nothing to undo it with — the dialog
   * in front of this is the only confirmation there will be.
   *
   * The bulk route applies its statuses one item at a time, so a failure can
   * leave part of the selection already written. Nothing is overlaid locally
   * either way: the refetch below is what says which items actually moved.
   */
  async function handleDecision() {
    if (!decision || decisionItems.length === 0) return;

    const outcome = decision;
    const itemIds = decisionItems.map((item) => item._id);

    setDecisionError(null);

    try {
      await submitDecision({ outcome, itemIds });
    } catch (error) {
      setDecisionError(
        error instanceof Error ? error.message : "Something went wrong.",
      );
      return;
    }

    // The decided ids leave the selection; anything else the user had picked
    // stays put.
    setSelectedIds((prev) => {
      const next = new Set(prev);
      for (const id of itemIds) next.delete(id);
      return next;
    });
    queryClient.invalidateQueries({
      queryKey: purchaseRequestKeys.detail(request._id),
    });
    queryClient.invalidateQueries({ queryKey: purchaseRequestKeys.lists() });

    setDecision(null);
    toast.add({
      title: `${itemIds.length} item${itemIds.length === 1 ? "" : "s"} ${
        outcome === "approved" ? "approved" : "rejected"
      }`,
      type: "success",
    });
  }

  /**
   * One call for the whole selection. Note the request's own status will not
   * move even when this completes every item: the backend never dispatches its
   * status verification job from this endpoint, so a fully delivered request
   * keeps reading "PO Created" until someone closes it out with the detail
   * page's "Mark as Completed" button.
   */
  async function handleMarkDelivered(deliveryDate: string) {
    const itemIds = selectedDeliveryItems.map((item) => item._id);
    if (itemIds.length === 0) return;

    setDeliveredError(null);

    try {
      await markDelivered({ itemIds, deliveryDate });
    } catch (error) {
      setDeliveredError(
        error instanceof Error ? error.message : "Something went wrong.",
      );
      return;
    }

    // The delivered ids leave the selection; anything else the user had picked
    // (a `po-created` item they still want a proof on) stays put.
    setSelectedIds((prev) => {
      const next = new Set(prev);
      for (const id of itemIds) next.delete(id);
      return next;
    });
    queryClient.invalidateQueries({
      queryKey: purchaseRequestKeys.detail(request._id),
    });
    queryClient.invalidateQueries({ queryKey: purchaseRequestKeys.lists() });

    setDeliveredOpen(false);
    toast.add({
      title: `${itemIds.length} item${itemIds.length === 1 ? "" : "s"} marked delivered`,
      type: "success",
    });
  }

  async function handleSave(groups: ProofOfOrderSaveGroup[]) {
    setSaveError(null);

    let result: Awaited<ReturnType<typeof saveGroups>>;
    try {
      result = await saveGroups(groups);
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : "Something went wrong.",
      );
      return;
    }

    const { savedItemIds, failedCount, firstError } = result;

    if (savedItemIds.length > 0) {
      // Only the items that actually persisted come out of the selection, so
      // a retry re-submits the failed vendor groups and nothing else.
      setSelectedIds((prev) => {
        const next = new Set(prev);
        for (const id of savedItemIds) next.delete(id);
        return next;
      });
      queryClient.invalidateQueries({
        queryKey: purchaseRequestKeys.detail(request._id),
      });
    }

    if (failedCount > 0) {
      setSaveError(
        `${failedCount} of ${groups.length} vendor group${groups.length === 1 ? "" : "s"} failed to save.` +
          (firstError ? ` ${firstError}` : "") +
          (savedItemIds.length > 0
            ? ` ${savedItemIds.length} item${savedItemIds.length === 1 ? "" : "s"} saved successfully and ${savedItemIds.length === 1 ? "was" : "were"} removed from the selection — retry the rest.`
            : ""),
      );
      return;
    }

    setDialogOpen(false);
    toast.add({
      title: `Proof saved for ${savedItemIds.length} item${savedItemIds.length === 1 ? "" : "s"}`,
      type: "success",
    });
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 border-b">
        <CardTitle>Items</CardTitle>
        <span className="text-xs text-muted-foreground">
          {deliveredCount} of {request.items.length} completed
        </span>
      </CardHeader>
      <CardContent className="px-0">
        {request.items.length === 0 ? (
          <p className="px-4 py-6 text-center text-xs text-muted-foreground">
            No items on this request.
          </p>
        ) : (
          <>
            {canSelectItems ? (
              <PurchaseRequestItemsBulkBar
                selectedItems={request.items.filter((item) =>
                  selectedIds.has(item._id),
                )}
                showProcess={canProcessSelection}
                showAddProof={canAddProof}
                showMarkDelivered={canMarkDelivered}
                canProcess={selectedProcessItems.length > 0}
                canAddProof={selectedItems.length > 0}
                canMarkDelivered={selectedDeliveryItems.length > 0}
                onClear={() => setSelectedIds(new Set())}
                onApprove={() => setDecision("approved")}
                onReject={() => setDecision("rejected")}
                onAddProof={() => setDialogOpen(true)}
                onMarkDelivered={() => setDeliveredOpen(true)}
              />
            ) : null}
            <PurchaseRequestItemsTable
              request={request}
              selectable={canSelectItems}
              canRecordPartialDelivery={canRecordPartial}
              selectedIds={selectedIds}
              onToggleItem={toggleItem}
              onToggleAll={toggleAll}
              onHighlightProofs={onHighlightProofs}
              onRecordPartialDelivery={(item: PurchaseRequestItem) =>
                setPartialItemId(item._id)
              }
            />
          </>
        )}
      </CardContent>

      <ProcessItemsDialog
        open={decisionItems.length > 0}
        onOpenChange={(next) => {
          if (!next) {
            setDecision(null);
            setDecisionError(null);
          }
        }}
        decision={decision}
        items={decisionItems}
        saving={deciding}
        saveError={decisionError}
        onConfirm={handleDecision}
      />

      <ProofOfOrderDialog
        open={dialogOpen && selectedItems.length > 0}
        onOpenChange={(next) => {
          setDialogOpen(next);
          if (!next) setSaveError(null);
        }}
        items={selectedItems}
        saving={saving}
        saveError={saveError}
        onSave={handleSave}
      />

      <MarkDeliveredDialog
        open={deliveredOpen && selectedDeliveryItems.length > 0}
        onOpenChange={(next) => {
          setDeliveredOpen(next);
          if (!next) setDeliveredError(null);
        }}
        items={selectedDeliveryItems}
        saving={markingDelivered}
        saveError={deliveredError}
        onSave={handleMarkDelivered}
      />

      <PartialDeliveryDialog
        open={partialItem !== null}
        onOpenChange={(next) => {
          if (!next) {
            setPartialItemId(null);
            setPartialError(null);
          }
        }}
        item={partialItem}
        saving={savingPartial}
        saveError={partialError}
        onSave={handleRecordPartialDelivery}
      />
    </Card>
  );
}
