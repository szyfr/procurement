"use client";

import * as React from "react";

import { LookupPicker } from "@/components/shared/lookup-picker";
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
import { Spinner } from "@/components/ui/spinner";
import type { SelectedOption } from "@/lib/lookup";
import {
  fetchVendorOptions,
  type PurchaseRequestItem,
  purchaseRequestKeys,
} from "@/modules/purchase-requests";

/**
 * Gives a set of direct-sourced items their vendor — one line from the row
 * action, or a whole selection from the bulk bar. Either way it's a single
 * vendor applied to every item in the list: the endpoint takes a list of
 * (item, vendor) pairs, but nothing in this UI offers a different vendor per
 * row in the same save, since the picker only holds one selection at a time.
 */
export function AssignVendorDialog({
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
  onSave: (vendorId: string) => void;
}) {
  const [vendor, setVendor] = React.useState<SelectedOption | null>(null);

  // Cleared on every open rather than carried over, so a vendor picked for one
  // selection can't be submitted for the next one the dialog is opened on.
  React.useEffect(() => {
    if (open) setVendor(null);
  }, [open]);

  if (items.length === 0) return null;

  const canSave = vendor !== null && !saving;

  return (
    <Dialog open={open} onOpenChange={(next) => !saving && onOpenChange(next)}>
      {/* `DialogContent` is a grid, so its children default to
          `min-width: auto` and a long material name widens the dialog past its
          `max-w` instead of truncating. */}
      <DialogContent
        className="max-h-[85vh] overflow-y-auto sm:max-w-lg [&>*]:min-w-0"
        showCloseButton={!saving}
      >
        <DialogHeader>
          <DialogTitle>Assign Vendor</DialogTitle>
          <p className="text-sm text-muted-foreground">
            {items.length} item{items.length === 1 ? "" : "s"} will be given the
            vendor selected below.
          </p>
        </DialogHeader>

        {saveError ? (
          <Alert variant="destructive">
            <AlertTitle>Couldn&apos;t assign this vendor</AlertTitle>
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
                <span className="min-w-0 flex-[2] truncate">
                  {item.material?.description || item.material_id}
                </span>
                <span className="shrink-0 text-muted-foreground">
                  Qty {item.quantity}
                </span>
              </div>
            ))}
          </div>
        </div>

        <Field>
          <FieldLabel>Vendor</FieldLabel>
          <LookupPicker
            value={vendor}
            onSelect={(record) =>
              setVendor({ id: record._id, label: record.name || record.no })
            }
            queryKey={purchaseRequestKeys.vendorOptions()}
            loadPage={fetchVendorOptions}
            toOption={(record) => ({
              id: record._id,
              label: record.name || record.no,
              hint: record.no,
            })}
            placeholder="Select a vendor"
            searchPlaceholder="Search vendors…"
            ariaLabel="Vendor"
          />
        </Field>

        <DialogFooter>
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
            onClick={() => canSave && onSave(vendor.id)}
          >
            {saving ? <Spinner data-icon="inline-start" /> : null}
            Assign Vendor
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
