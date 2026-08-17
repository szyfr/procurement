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

/** Quantities are floats upstream, so a subtraction can land on 0.30000000000000004. */
function trim(value: number) {
  return Number(value.toFixed(4));
}

/**
 * Records how much of one item has arrived. One line, one amount — the endpoint
 * takes a single item, so unlike the delivery flow there is nothing to batch.
 *
 * The amount is a **running total, not an increment**: upstream `$set`s
 * `partial_delivered` to whatever it is sent. So the field is seeded with what
 * is already recorded and asks for the new total, and anything at or below the
 * current figure is rejected — entering "what just arrived" on a second
 * delivery would otherwise silently rewrite the first.
 *
 * Both bounds are enforced here because upstream enforces neither: it validates
 * `amount > 0` and nothing else. The ordered quantity is exclusive — reaching it
 * does not move the item to `completed`, so a full delivery belongs in "Mark
 * delivered", which does.
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
  const recorded = item?.partial_delivered ?? 0;

  // Re-seeded on every open rather than once, so reopening after a failed save
  // starts from what is actually on the record and not from the entry that
  // failed. Blank on the first delivery — a prefilled "0" reads as data.
  React.useEffect(() => {
    if (open) setAmount(recorded > 0 ? String(recorded) : "");
  }, [open, recorded]);

  if (!item) return null;

  const label = item.material?.description || item.material_id;
  const parsed = Number(amount);
  const hasAmount = amount.trim() !== "" && Number.isFinite(parsed);
  // Folds in the "greater than zero" rule upstream enforces: with nothing
  // recorded yet, `recorded` is 0 and this is that same check.
  const notAdvancing = hasAmount && parsed <= recorded;
  const closesItem = hasAmount && parsed >= item.quantity;
  const canSave = hasAmount && !notAdvancing && !closesItem && !saving;

  const hint = !hasAmount
    ? "Enter the total received to date"
    : notAdvancing
      ? recorded > 0
        ? `${recorded} already recorded — enter the new total`
        : "Amount must be greater than zero"
      : parsed > item.quantity
        ? `Only ${item.quantity} ordered`
        : closesItem
          ? "That is the full order — use Mark delivered to close this item"
          : `${trim(item.quantity - parsed)} of ${item.quantity} still outstanding`;

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
          <FieldLabel htmlFor={amountInputId}>
            Total received to date
          </FieldLabel>
          <Input
            id={amountInputId}
            type="number"
            inputMode="decimal"
            min={recorded}
            max={item.quantity}
            step="any"
            placeholder="0"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Ordered quantity: {item.quantity}
            {recorded > 0 ? ` — ${recorded} recorded so far` : null}
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
