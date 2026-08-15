"use client";

import { PaperclipIcon, XIcon } from "lucide-react";
import * as React from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
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

const ACCEPTED_PROOF_FILES = ".pdf,.jpg,.jpeg,.png";
const UNSET_VENDOR_KEY = "__unset__";

interface GroupState {
  files: File[];
  deliveryDate: string;
  vendorReference: string;
  itemOverrides: Record<string, string>;
}

/**
 * One `POST /purchase-request-proofs` call: `delivery_date` and
 * `vendor_reference_no` are single values, not per-item, so a "different date
 * for one item" override splits that item into its own call rather than
 * riding along in the group's.
 */
export interface ProofOfOrderSaveGroup {
  itemIds: string[];
  files: File[];
  deliveryDate: string;
  vendorReference: string;
}

function emptyGroupState(): GroupState {
  return {
    files: [],
    deliveryDate: "",
    vendorReference: "",
    itemOverrides: {},
  };
}

function groupKey(item: PurchaseRequestItem) {
  return item.vendor_id ?? UNSET_VENDOR_KEY;
}

/** The detail pipeline joins the vendor; the raw id stands in if the lookup missed. */
function vendorLabel(key: string, items: PurchaseRequestItem[]) {
  if (key === UNSET_VENDOR_KEY) return "Vendor not set";
  return items[0]?.vendor?.name || key;
}

const ACCEPTED_PROOF_EXTENSIONS = ACCEPTED_PROOF_FILES.split(",");

/** Identity of a picked file: also the list key, so both agree on duplicates. */
function fileKey(file: File) {
  return `${file.name}-${file.lastModified}`;
}

function hasAcceptedExtension(file: File) {
  const name = file.name.toLowerCase();
  return ACCEPTED_PROOF_EXTENSIONS.some((extension) =>
    name.endsWith(extension),
  );
}

/** Upload well plus the running list of files picked for a group — the backend takes one or more `attachments`. */
function ProofDropzone({
  inputId,
  files,
  onChange,
  compact,
}: {
  inputId: string;
  files: File[];
  onChange: (files: File[]) => void;
  compact?: boolean;
}) {
  const [isDraggingOver, setIsDraggingOver] = React.useState(false);
  const [rejection, setRejection] = React.useState<string | null>(null);

  function addFiles(picked: FileList | null) {
    if (!picked?.length) return;

    // Drag-and-drop bypasses the input's `accept` filter, so it's enforced
    // here too rather than only on the browse path — and silently dropping a
    // file reads as the upload having worked.
    const rejected: string[] = [];
    const accepted: File[] = [];
    // Same identity as the list key below, so a re-pick can't produce two rows
    // React can't tell apart.
    const seen = new Set(files.map((file) => fileKey(file)));

    for (const file of Array.from(picked)) {
      if (!hasAcceptedExtension(file)) {
        rejected.push(file.name);
        continue;
      }
      if (seen.has(fileKey(file))) continue;
      seen.add(fileKey(file));
      accepted.push(file);
    }

    setRejection(
      rejected.length
        ? `Not a supported file type: ${rejected.join(", ")}`
        : null,
    );
    if (accepted.length) onChange([...files, ...accepted]);
  }

  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor={inputId}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDraggingOver(true);
        }}
        onDragLeave={() => setIsDraggingOver(false)}
        onDrop={(event) => {
          event.preventDefault();
          setIsDraggingOver(false);
          addFiles(event.dataTransfer.files);
        }}
        className={cn(
          "flex cursor-pointer items-center justify-center rounded-lg border border-dashed text-center text-muted-foreground hover:bg-accent",
          compact ? "px-3 py-2 text-xs" : "px-4 py-6 text-sm",
          isDraggingOver && "border-primary bg-accent",
        )}
      >
        Drop files or <span className="ml-1 underline">browse</span>
        <input
          id={inputId}
          type="file"
          multiple
          accept={ACCEPTED_PROOF_FILES}
          className="sr-only"
          onChange={(event) => {
            addFiles(event.target.files);
            event.target.value = "";
          }}
        />
      </label>

      {rejection ? (
        <p role="alert" className="text-xs text-destructive">
          {rejection}
        </p>
      ) : null}

      {files.length > 0 ? (
        <ul className="flex flex-col gap-1">
          {files.map((file, index) => (
            <li
              key={fileKey(file)}
              className="flex items-center gap-2 rounded-md border px-2 py-1.5 text-xs"
            >
              <PaperclipIcon
                className="size-3.5 shrink-0 text-muted-foreground"
                aria-hidden
              />
              <span className="min-w-0 flex-1 truncate">{file.name}</span>
              <button
                type="button"
                className="shrink-0 text-muted-foreground hover:text-foreground"
                aria-label={`Remove ${file.name}`}
                onClick={() =>
                  onChange(files.filter((_, fileIndex) => fileIndex !== index))
                }
              >
                <XIcon className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

/** Scenario A — every selected item shares a vendor, so one form covers all of them. */
function SingleVendorForm({
  items,
  state,
  onChange,
}: {
  items: PurchaseRequestItem[];
  state: GroupState;
  onChange: (patch: Partial<GroupState>) => void;
}) {
  const fileInputId = React.useId();

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg border">
        <div className="border-b bg-muted px-3 py-2 text-xs text-muted-foreground">
          Applies to
        </div>
        <div className="flex flex-col gap-1.5 px-3 py-2.5 text-sm">
          {items.map((item) => (
            <div key={item._id} className="flex gap-2">
              <span className="min-w-0 flex-1 truncate">
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
        <FieldLabel htmlFor={fileInputId}>Proof of order</FieldLabel>
        <ProofDropzone
          inputId={fileInputId}
          files={state.files}
          onChange={(files) => onChange({ files })}
        />
        <p className="text-xs text-muted-foreground">
          Vendor confirmation, signed PO, or invoice
        </p>
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field>
          <FieldLabel htmlFor="single-delivery-date">
            Confirmed delivery date
          </FieldLabel>
          <Input
            id="single-delivery-date"
            type="date"
            value={state.deliveryDate}
            onChange={(event) => onChange({ deliveryDate: event.target.value })}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="single-vendor-ref">
            Vendor reference no.
          </FieldLabel>
          <Input
            id="single-vendor-ref"
            value={state.vendorReference}
            onChange={(event) =>
              onChange({ vendorReference: event.target.value })
            }
          />
        </Field>
      </div>
    </div>
  );
}

/** Scenario B — one card per vendor, each with its own documents and date. */
function VendorGroupForm({
  vendorKey,
  items,
  state,
  onChange,
  overrideOpen,
  onToggleOverride,
}: {
  vendorKey: string;
  items: PurchaseRequestItem[];
  state: GroupState;
  onChange: (patch: Partial<GroupState>) => void;
  overrideOpen: boolean;
  onToggleOverride: () => void;
}) {
  const fileInputId = React.useId();

  return (
    <div className="rounded-lg border">
      <div className="flex items-center gap-2 border-b bg-muted px-3 py-2">
        <span className="min-w-0 truncate text-sm font-medium">
          {vendorLabel(vendorKey, items)}
        </span>
        <Badge variant="outline" className="shrink-0">
          {items.length} item{items.length === 1 ? "" : "s"}
        </Badge>
      </div>
      <div className="flex flex-col gap-3 p-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
          <Field className="sm:flex-[2]">
            <FieldLabel htmlFor={fileInputId}>Documents</FieldLabel>
            <ProofDropzone
              inputId={fileInputId}
              files={state.files}
              onChange={(files) => onChange({ files })}
              compact
            />
          </Field>
          <Field className="sm:flex-1">
            <FieldLabel htmlFor={`${fileInputId}-date`}>
              Delivery date
            </FieldLabel>
            <Input
              id={`${fileInputId}-date`}
              type="date"
              value={state.deliveryDate}
              onChange={(event) =>
                onChange({ deliveryDate: event.target.value })
              }
            />
          </Field>
          <Field className="sm:flex-1">
            <FieldLabel htmlFor={`${fileInputId}-ref`}>Vendor ref.</FieldLabel>
            <Input
              id={`${fileInputId}-ref`}
              value={state.vendorReference}
              onChange={(event) =>
                onChange({ vendorReference: event.target.value })
              }
            />
          </Field>
        </div>

        {items.length > 1 ? (
          <button
            type="button"
            className="self-start text-xs text-muted-foreground underline"
            onClick={onToggleOverride}
          >
            {overrideOpen
              ? "Use one date for all items"
              : "Set a different date for one item"}
          </button>
        ) : null}

        {overrideOpen ? (
          <div className="flex flex-col gap-2 border-t pt-3">
            {items.map((item) => (
              <div key={item._id} className="flex items-center gap-2">
                <span className="min-w-0 flex-1 truncate text-xs">
                  {item.material?.description || item.material_id}
                </span>
                <Input
                  type="date"
                  className="w-40 shrink-0"
                  value={state.itemOverrides[item._id] ?? state.deliveryDate}
                  onChange={(event) =>
                    onChange({
                      itemOverrides: {
                        ...state.itemOverrides,
                        [item._id]: event.target.value,
                      },
                    })
                  }
                />
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

/**
 * Scenario A when every selected item shares a vendor, Scenario B — grouped by
 * vendor — otherwise. There's no PO number on the backend (see
 * `constants/index.ts`), so grouping keys on `vendor_id` alone rather than
 * vendor + PO.
 */
export function ProofOfOrderDialog({
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
  onSave: (groups: ProofOfOrderSaveGroup[]) => void;
}) {
  const groups = React.useMemo(() => {
    const map = new Map<string, PurchaseRequestItem[]>();
    for (const item of items) {
      const key = groupKey(item);
      const list = map.get(key) ?? [];
      list.push(item);
      map.set(key, list);
    }
    return [...map.entries()];
  }, [items]);

  const [groupState, setGroupState] = React.useState<
    Record<string, GroupState>
  >({});
  const [overrideOpenFor, setOverrideOpenFor] = React.useState<Set<string>>(
    new Set(),
  );

  // `groups` is rebuilt whenever the parent re-renders (its `items` prop is a
  // fresh filter of the request), so the reset keys off the group identities
  // instead — depending on the array itself would wipe the open override
  // panels on every unrelated parent render.
  const groupKeys = groups.map(([key]) => key).join(" ");

  // biome-ignore lint/correctness/useExhaustiveDependencies: `groupKeys` is the stable stand-in for `groups`.
  React.useEffect(() => {
    if (!open) return;
    setGroupState((prev) => {
      const next: Record<string, GroupState> = {};
      for (const [key] of groups) {
        next[key] = prev[key] ?? emptyGroupState();
      }
      return next;
    });
    setOverrideOpenFor(new Set());
  }, [open, groupKeys]);

  function updateGroup(key: string, patch: Partial<GroupState>) {
    setGroupState((prev) => ({
      ...prev,
      [key]: { ...(prev[key] ?? emptyGroupState()), ...patch },
    }));
  }

  const isSingleVendor = groups.length === 1;
  const [firstGroup] = groups;
  const missingGroups = groups.filter(([key]) => {
    const state = groupState[key];
    return (
      !state?.files.length || !state.deliveryDate || !state.vendorReference
    );
  });
  const canSave = groups.length > 0 && missingGroups.length === 0 && !saving;

  function handleSave() {
    if (!canSave) return;

    // `delivery_date` is one value per proof, so an item with an override
    // date becomes its own group rather than riding along with the rest.
    const saveGroups: ProofOfOrderSaveGroup[] = [];

    for (const [key, groupItems] of groups) {
      const state = groupState[key];
      if (!state?.files.length || !state.deliveryDate || !state.vendorReference)
        continue;

      const byDate = new Map<string, string[]>();
      for (const item of groupItems) {
        const effectiveDate =
          state.itemOverrides[item._id] || state.deliveryDate;
        const ids = byDate.get(effectiveDate) ?? [];
        ids.push(item._id);
        byDate.set(effectiveDate, ids);
      }

      for (const [deliveryDate, itemIds] of byDate) {
        saveGroups.push({
          itemIds,
          files: state.files,
          deliveryDate,
          vendorReference: state.vendorReference,
        });
      }
    }

    onSave(saveGroups);
  }

  const subtitleVendor =
    isSingleVendor && firstGroup
      ? vendorLabel(firstGroup[0], firstGroup[1])
      : `${groups.length} vendor${groups.length === 1 ? "" : "s"}`;

  return (
    <Dialog open={open} onOpenChange={(next) => !saving && onOpenChange(next)}>
      {/* `DialogContent` is a grid, so its children default to
          `min-width: auto` and a long material or vendor name widens the whole
          dialog past its `max-w` instead of truncating. `min-w-0` on every
          child is what lets the `truncate`s below actually engage. */}
      <DialogContent
        className="max-h-[85vh] overflow-y-auto sm:max-w-xl [&>*]:min-w-0"
        showCloseButton={!saving}
      >
        <DialogHeader>
          <DialogTitle>Add Proof of Order</DialogTitle>
          <p className="text-sm text-muted-foreground">
            {items.length} item{items.length === 1 ? "" : "s"} ·{" "}
            {subtitleVendor}
          </p>
        </DialogHeader>

        {!isSingleVendor ? (
          <Alert>
            <AlertTitle>Selection spans {groups.length} vendors</AlertTitle>
            <AlertDescription>
              Upload one or more documents per vendor. Each vendor can have its
              own delivery date.
            </AlertDescription>
          </Alert>
        ) : null}

        {saveError ? (
          <Alert variant="destructive">
            <AlertTitle>Couldn&apos;t save this proof</AlertTitle>
            <AlertDescription>{saveError}</AlertDescription>
          </Alert>
        ) : null}

        <div className="flex flex-col gap-4">
          {isSingleVendor && firstGroup ? (
            <SingleVendorForm
              items={items}
              state={groupState[firstGroup[0]] ?? emptyGroupState()}
              onChange={(patch) => updateGroup(firstGroup[0], patch)}
            />
          ) : (
            groups.map(([key, groupItems]) => (
              <VendorGroupForm
                key={key}
                vendorKey={key}
                items={groupItems}
                state={groupState[key] ?? emptyGroupState()}
                onChange={(patch) => updateGroup(key, patch)}
                overrideOpen={overrideOpenFor.has(key)}
                onToggleOverride={() => {
                  // Collapsing the panel discards the per-item dates with it —
                  // left in state they'd still split the group into extra
                  // proofs on save, with no visible sign of why.
                  if (overrideOpenFor.has(key))
                    updateGroup(key, {
                      itemOverrides: {},
                    });
                  setOverrideOpenFor((prev) => {
                    const next = new Set(prev);
                    if (next.has(key)) next.delete(key);
                    else next.add(key);
                    return next;
                  });
                }}
              />
            ))
          )}
        </div>

        <DialogFooter className="items-center sm:justify-between">
          <span
            className={cn(
              "text-xs",
              missingGroups.length > 0
                ? "text-destructive"
                : "text-muted-foreground",
            )}
          >
            {missingGroups.length > 0
              ? `${missingGroups.length} vendor${missingGroups.length === 1 ? "" : "s"} still need${missingGroups.length === 1 ? "s" : ""} a document, date or reference`
              : isSingleVendor
                ? "Applied to all selected items"
                : "Applied per vendor"}
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
            <Button size="sm" disabled={!canSave} onClick={handleSave}>
              {saving ? <Spinner data-icon="inline-start" /> : null}
              Save Proof
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
