"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import type {
  ProcessItemDecision,
  PurchaseRequestItem,
} from "@/modules/purchase-requests";

/**
 * Confirms an approve or reject before anything is sent, listing exactly what
 * the decision will land on.
 *
 * Worth confirming because neither decision can be walked back from here.
 * Approving is what raises the purchase order with the vendor — the backend
 * dispatches that job from the same call — and there is no endpoint to undo
 * either outcome, so the selection is shown in full first.
 *
 * One dialog covers both decisions and both scopes: the row menu opens it on a
 * single item and the bulk bar on the whole selection, which differ only in
 * how the caller resolved `items`.
 */
export function ProcessItemsDialog({
  open,
  onOpenChange,
  decision,
  items,
  saving,
  saveError,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Null only while the dialog is closed and no decision is pending. */
  decision: ProcessItemDecision | null;
  items: PurchaseRequestItem[];
  saving: boolean;
  saveError: string | null;
  onConfirm: () => void;
}) {
  const approving = decision === "approved";
  const count = `${items.length} item${items.length === 1 ? "" : "s"}`;

  return (
    <Dialog open={open} onOpenChange={(next) => !saving && onOpenChange(next)}>
      {/* `DialogContent` is a grid, so its children default to
          `min-width: auto` and a long material or vendor name widens the whole
          dialog past its `max-w` instead of truncating. `min-w-0` on every
          child is what lets the `truncate` below actually engage. */}
      <DialogContent
        className="max-h-[85vh] overflow-y-auto sm:max-w-lg [&>*]:min-w-0"
        showCloseButton={!saving}
      >
        <DialogHeader>
          <DialogTitle>
            {approving ? "Approve" : "Reject"} {count}?
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {approving
              ? "A purchase order is raised with the vendor as soon as this is confirmed."
              : "Rejected items stay on the request but are no longer being sourced."}
          </p>
        </DialogHeader>

        {saveError ? (
          <Alert variant="destructive">
            <AlertTitle>
              Couldn&apos;t {approving ? "approve" : "reject"} these items
            </AlertTitle>
            <AlertDescription>{saveError}</AlertDescription>
          </Alert>
        ) : null}

        <div className="rounded-lg border">
          <div className="border-b bg-muted px-3 py-2 text-xs text-muted-foreground">
            Applies to
          </div>
          <div className="flex flex-col gap-1.5 px-3 py-2.5 text-sm">
            {items.map((item) => (
              <div key={item._id} className="flex gap-2">
                {/* The detail pipeline joins the material and vendor; the raw
                    ids stand in if either lookup missed. Both names run long,
                    so both need `min-w-0` — without it a flex child's minimum
                    width is its full text and `truncate` never engages, which
                    widens the dialog instead of clipping the row. */}
                <span className="min-w-0 flex-[2] truncate">
                  {item.material?.description || item.material_id}
                </span>
                <span className="min-w-0 flex-1 truncate text-muted-foreground">
                  {item.vendor?.name || item.vendor_id || "Vendor not set"}
                </span>
                <span className="shrink-0 text-muted-foreground">
                  Qty {item.quantity}
                </span>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter className="items-center sm:justify-between">
          <span className="text-xs text-muted-foreground">
            This cannot be undone from here.
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={saving}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              variant={approving ? "default" : "destructive"}
              size="sm"
              disabled={saving}
              onClick={onConfirm}
            >
              {saving ? <Spinner data-icon="inline-start" /> : null}
              {approving ? "Approve" : "Reject"} {count}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
