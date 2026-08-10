"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as React from "react";

import {
  isProofSelectable,
  PurchaseRequestItemsTable,
} from "@/components/purchase-requests/pr-items-table";
import { ProofOfOrderBulkBar } from "@/components/purchase-requests/proof-of-order-bulk-bar";
import {
  ProofOfOrderDialog,
  type ProofOfOrderSaveGroup,
} from "@/components/purchase-requests/proof-of-order-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/toast";
import {
  createPurchaseRequestProof,
  type PurchaseRequestDetail,
  purchaseRequestKeys,
} from "@/modules/purchase-requests";

/**
 * Items table plus the bulk proof-of-order workflow: select rows, open one
 * dialog, save. Each vendor group in the dialog becomes its own
 * `POST /purchase-request-proofs` call — the backend takes one delivery date
 * and one vendor reference per proof, so a mixed-vendor selection saves as
 * several requests, not one.
 *
 * There's no local overlay of the result: the response carries no filename to
 * show (see `pr-items-table.tsx`), so a successful save just invalidates the
 * detail query and the table picks up the real, persisted `proofs` join.
 */
export function PurchaseRequestItemsSection({
  request,
  onHighlightProofs,
}: {
  request: PurchaseRequestDetail;
  /** Passed through to the table's proof indicator; owned by the detail view. */
  onHighlightProofs: (itemId: string) => void;
}) {
  const queryClient = useQueryClient();
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [saveError, setSaveError] = React.useState<string | null>(null);

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

  const selectableIds = request.items
    .filter(isProofSelectable)
    .map((item) => item._id);
  // Eligibility is re-checked here, not just held in `selectedIds`: a refetch
  // can move an item past `po-created` (someone else recorded its proof) while
  // its id is still in the set, and a stale id would otherwise be submitted.
  const selectedItems = request.items.filter(
    (item) => selectedIds.has(item._id) && isProofSelectable(item),
  );
  const deliveredCount = request.items.filter(
    (item) => item.status === "completed",
  ).length;

  // `open` below is derived from `selectedItems.length`, so the selection
  // clearing (via the bulk bar's "Clear" or a saved/refetched item dropping
  // out) can close the dialog without `onOpenChange` firing. Left unsynced,
  // `dialogOpen` would stay true and the next selection would reopen it
  // unprompted.
  React.useEffect(() => {
    if (selectedItems.length === 0) setDialogOpen(false);
  }, [selectedItems.length]);

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
            <ProofOfOrderBulkBar
              selectedItems={selectedItems}
              onClear={() => setSelectedIds(new Set())}
              onOpen={() => setDialogOpen(true)}
            />
            <PurchaseRequestItemsTable
              request={request}
              selectedIds={selectedIds}
              onToggleItem={toggleItem}
              onToggleAll={toggleAll}
              onHighlightProofs={onHighlightProofs}
            />
          </>
        )}
      </CardContent>

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
    </Card>
  );
}
