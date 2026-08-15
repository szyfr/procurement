"use client";

import * as React from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { toDayString } from "@/lib/date";
import { cn } from "@/lib/utils";
import type { PurchaseRequestItem } from "@/modules/purchase-requests";

/**
 * Confirms a bulk delivery before anything is sent: the full selection is
 * listed so it can be checked, and the date is entered by hand.
 *
 * Simpler than the proof dialog because the endpoint is — one `delivery_date`
 * covers every item id in the call, so there is no vendor grouping and no
 * per-item override to offer. The vendor is still shown per row, since a
 * selection spanning several is worth noticing before it's committed.
 */
export function MarkDeliveredDialog({
  open,
  onOpenChange,
  items,
  saving,
  saveError,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: PurchaseRequestItem[];
  saving: boolean;
  saveError: string | null;
  onSave: (deliveryDate: string) => void;
}) {
  const dateInputId = React.useId();
  const [deliveryDate, setDeliveryDate] = React.useState("");

  // Re-defaulted on every open rather than seeded once: a dialog reopened the
  // next day would otherwise still be offering yesterday, and a reopen after a
  // failed save would carry the date that failed.
  React.useEffect(() => {
    if (open) setDeliveryDate(toDayString(new Date()));
  }, [open]);

  const canSave = Boolean(deliveryDate) && !saving;

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
          <DialogTitle>Mark as Delivered</DialogTitle>
          <p className="text-sm text-muted-foreground">
            {items.length} item{items.length === 1 ? "" : "s"} will be recorded
            as delivered and completed.
          </p>
        </DialogHeader>

        {saveError ? (
          <Alert variant="destructive">
            <AlertTitle>Couldn&apos;t mark these items delivered</AlertTitle>
            <AlertDescription>{saveError}</AlertDescription>
          </Alert>
        ) : null}

        <div className="flex flex-col gap-4">
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

          <Field>
            <FieldLabel htmlFor={dateInputId}>Delivery date</FieldLabel>
            <Input
              id={dateInputId}
              type="date"
              value={deliveryDate}
              onChange={(event) => setDeliveryDate(event.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Applied to every item above.
            </p>
          </Field>
        </div>

        <DialogFooter className="items-center sm:justify-between">
          <span
            className={cn(
              "text-xs",
              deliveryDate ? "text-muted-foreground" : "text-destructive",
            )}
          >
            {deliveryDate
              ? "This cannot be undone from here."
              : "A delivery date is required"}
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
              size="sm"
              disabled={!canSave}
              onClick={() => canSave && onSave(deliveryDate)}
            >
              {saving ? <Spinner data-icon="inline-start" /> : null}
              Mark as Delivered
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
