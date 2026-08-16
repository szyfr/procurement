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
import { cn } from "@/lib/utils";
import type { PurchaseRequestItem } from "@/modules/purchase-requests";

/**
 * Records how much of one item arrived. One line, one amount — the endpoint
 * takes a single item, so unlike the delivery flow there is nothing to batch.
 *
 * The ordered quantity is the ceiling. Upstream only enforces `> 0`, so the
 * upper bound is checked here, where the quantity is already on screen and the
 * message can name it.
 */
export function PartialDeliveryDialog({
  open,
  onOpenChange,
  item,
  saving,
  saveError,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Null while no row is targeted — the dialog stays closed. */
  item: PurchaseRequestItem | null;
  saving: boolean;
  saveError: string | null;
  onSave: (amount: number) => void;
}) {
  const amountInputId = React.useId();
  const [amount, setAmount] = React.useState("");

  // Cleared on every open rather than seeded once, so a reopen after a failed
  // save doesn't silently re-offer the amount that failed.
  React.useEffect(() => {
    if (open) setAmount("");
  }, [open]);

  if (!item) return null;

  const label = item.material?.description || item.material_id;
  const parsed = Number(amount);
  const hasAmount = amount.trim() !== "" && Number.isFinite(parsed);
  const overOrdered = hasAmount && parsed > item.quantity;
  const canSave = hasAmount && parsed > 0 && !overOrdered && !saving;

  const hint = !hasAmount
    ? "Enter the quantity received"
    : parsed <= 0
      ? "Amount must be greater than zero"
      : overOrdered
        ? `Only ${item.quantity} ordered`
        : `${item.quantity - parsed} of ${item.quantity} still outstanding`;

  return (
    <Dialog open={open} onOpenChange={(next) => !saving && onOpenChange(next)}>
      {/* `DialogContent` is a grid, so its children default to
          `min-width: auto` and a long material name widens the dialog past its
          `max-w` instead of truncating. */}
      <DialogContent
        className="sm:max-w-md [&>*]:min-w-0"
        showCloseButton={!saving}
      >
        <DialogHeader>
          <DialogTitle>Record Partial Delivery</DialogTitle>
          <p className="truncate text-sm text-muted-foreground">{label}</p>
        </DialogHeader>

        {saveError ? (
          <Alert variant="destructive">
            <AlertTitle>Couldn&apos;t record this delivery</AlertTitle>
            <AlertDescription>{saveError}</AlertDescription>
          </Alert>
        ) : null}

        <Field>
          <FieldLabel htmlFor={amountInputId}>Amount received</FieldLabel>
          <Input
            id={amountInputId}
            type="number"
            inputMode="decimal"
            min={0}
            max={item.quantity}
            step="any"
            placeholder="0"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Ordered quantity: {item.quantity}
          </p>
        </Field>

        <DialogFooter className="items-center sm:justify-between">
          <span
            className={cn(
              "text-xs",
              canSave ? "text-muted-foreground" : "text-destructive",
            )}
          >
            {hint}
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
              onClick={() => canSave && onSave(parsed)}
            >
              {saving ? <Spinner data-icon="inline-start" /> : null}
              Record Delivery
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
