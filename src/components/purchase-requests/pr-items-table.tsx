import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";
import { PurchaseRequestItemRowActions } from "@/components/purchase-requests/pr-item-row-actions";
import { StatusBadge, StatusDot } from "@/components/shared/status-badge";
import {
  dataTableClass,
  numericCellClass,
} from "@/components/shared/table-classes";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatShortDate } from "@/lib/date";
import { cn } from "@/lib/utils";
import {
  type PurchaseRequestDetail,
  type PurchaseRequestItem,
  type PurchaseRequestProof,
  purchaseRequestItemStatusLabels,
  purchaseRequestItemTone,
} from "@/modules/purchase-requests";

/**
 * The checkbox column feeds three bulk actions with different eligibility, so
 * every rule is exported: the section above owns the selection and has to
 * apply the same ones — a refetch that moves an item on has to drop it from
 * the checkbox column and from whatever action was about to submit it.
 */

/**
 * The window in which the approve/reject decision is still open.
 *
 * `canvassing` is deliberately outside it: awarding a quote is that flow's
 * approval, and an item routed there is decided on the canvassing screen
 * instead. `pending-assessment` is inside it because a line can be seen in
 * that state before the backend's assessment pass has read it — the decision
 * is no less open for the check not having run yet.
 */
export function isProcessSelectable(item: PurchaseRequestItem) {
  return item.status === "pending" || item.status === "pending-assessment";
}

/** The only status a proof of order can still be added for. */
export function isProofSelectable(item: PurchaseRequestItem) {
  return item.status === "po-created";
}

/**
 * Delivery closes an item out, so it also covers `partially-completed` — the
 * status the Business Central receipt sync leaves an item in when only part of
 * the quantity arrived. Marking it delivered completes the rest.
 */
export function isDeliverySelectable(item: PurchaseRequestItem) {
  return item.status === "po-created" || item.status === "partially-completed";
}

/** A row gets a checkbox when any bulk action can act on it. */
export function isItemSelectable(item: PurchaseRequestItem) {
  return (
    isProcessSelectable(item) ||
    isProofSelectable(item) ||
    isDeliverySelectable(item)
  );
}

/**
 * A direct-sourced item still waiting on its vendor. `is_needs_canvass`
 * excludes a canvassed item — that one gets its vendor through an award
 * instead, never through this route — and the decision window matches
 * `isProcessSelectable`: once approved or rejected, assigning a vendor no
 * longer does anything useful.
 */
export function canAssignVendor(item: PurchaseRequestItem) {
  return !item.vendor_id && !item.is_needs_canvass && isProcessSelectable(item);
}

/** How much of the order has yet to arrive. */
export function outstandingQuantity(item: PurchaseRequestItem) {
  return item.quantity - (item.partial_delivered ?? 0);
}

/**
 * Partial delivery applies to an item that has been ordered but isn't closed
 * — the same window as a full delivery, since recording part of a shipment is
 * the alternative to recording all of it.
 *
 * A line with a single unit outstanding is excluded: the only entry left is
 * the whole remainder, and recording that here would leave the item reading
 * "Partially Completed" forever, since upstream never promotes it. Marking it
 * delivered is the action that closes it out.
 */
export function canRecordPartialDelivery(item: PurchaseRequestItem) {
  return isDeliverySelectable(item) && outstandingQuantity(item) > 1;
}

function proofsForItem(
  item: PurchaseRequestItem,
  request: PurchaseRequestDetail,
) {
  return request.proofs.filter((proof) =>
    proof.purchase_request_item_ids.includes(item._id),
  );
}

function earliestDeliveryDate(proofs: PurchaseRequestProof[]) {
  return proofs
    .map((proof) => proof.delivery_date)
    .sort()
    .at(0);
}

/** Per-item sourcing status, plus proof-of-order state where one has been recorded. */
export function PurchaseRequestItemsTable({
  request,
  selectable: selectionEnabled,
  canRecordPartialDelivery: partialDeliveryGranted,
  canAssignVendor: assignVendorGranted,
  selectedIds,
  onToggleItem,
  onToggleAll,
  onHighlightProofs,
  onRecordPartialDelivery,
  onAssignVendor,
}: {
  request: PurchaseRequestDetail;
  /**
   * False when the user holds none of the bulk actions' grants. The checkbox
   * column stays as an empty cell rather than being removed, so the header and
   * body keep the same shape as everywhere else the table renders.
   */
  selectable: boolean;
  canRecordPartialDelivery: boolean;
  canAssignVendor: boolean;
  selectedIds: Set<string>;
  onToggleItem: (id: string, checked: boolean) => void;
  onToggleAll: (checked: boolean) => void;
  onHighlightProofs: (itemId: string) => void;
  onRecordPartialDelivery: (item: PurchaseRequestItem) => void;
  onAssignVendor: (item: PurchaseRequestItem) => void;
}) {
  const selectableItems = selectionEnabled
    ? request.items.filter(isItemSelectable)
    : [];
  const allSelected =
    selectableItems.length > 0 &&
    selectableItems.every((item) => selectedIds.has(item._id));
  const someSelected = selectableItems.some((item) =>
    selectedIds.has(item._id),
  );

  return (
    <Table className={dataTableClass}>
      <TableHeader>
        <TableRow>
          <TableHead scope="col" className="w-9">
            {selectableItems.length > 0 ? (
              <Checkbox
                checked={allSelected}
                indeterminate={someSelected && !allSelected}
                onCheckedChange={(checked) => onToggleAll(checked === true)}
                aria-label="Select all items still open"
              />
            ) : null}
          </TableHead>
          <TableHead scope="col">Item</TableHead>
          <TableHead scope="col" className={numericCellClass}>
            Qty
          </TableHead>
          <TableHead scope="col">Vendor</TableHead>
          <TableHead scope="col">Status</TableHead>
          <TableHead scope="col">Proof of order</TableHead>
          <TableHead scope="col">Delivery</TableHead>
          <TableHead scope="col" className="w-9">
            <span className="sr-only">Actions</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {request.items.map((item) => {
          const selectable = selectionEnabled && isItemSelectable(item);
          const proofs = proofsForItem(item, request);
          // A proof's date is the date the vendor promised; `delivered_at` is
          // the date someone recorded the goods as actually arriving, so it
          // wins wherever it exists.
          const deliveryDate =
            item.delivered_at ?? earliestDeliveryDate(proofs);

          return (
            <TableRow
              key={item._id}
              className={cn(
                item.status === "completed" && "bg-status-success-subtle",
                selectedIds.has(item._id) && "bg-accent",
              )}
            >
              <TableCell>
                {selectable ? (
                  <Checkbox
                    checked={selectedIds.has(item._id)}
                    onCheckedChange={(checked) =>
                      onToggleItem(item._id, checked === true)
                    }
                    aria-label={`Select ${item.material?.description || item.material_id}`}
                  />
                ) : null}
              </TableCell>
              {/* The detail pipeline joins the material; the raw id stands in
                  if the lookup missed. Capped and truncated so the eighth
                  column (actions) still fits without the table scrolling —
                  `title` keeps the full name reachable. */}
              <TableCell>
                <span
                  className="block max-w-[15rem] truncate"
                  title={item.material?.description || item.material_id}
                >
                  {item.material?.description || item.material_id}
                </span>
              </TableCell>
              {/* Received-of-ordered once anything has arrived, so a partially
                  completed row shows how much rather than only that it is
                  partial. `partial_delivered` is absent until then. */}
              <TableCell className={numericCellClass}>
                {typeof item.partial_delivered === "number" ? (
                  <span
                    title={`${item.partial_delivered} of ${item.quantity} received`}
                  >
                    {item.partial_delivered}
                    <span className="text-muted-foreground">
                      {" / "}
                      {item.quantity}
                    </span>
                  </span>
                ) : (
                  item.quantity
                )}
              </TableCell>
              <TableCell>
                {/* The detail pipeline joins the vendor; the raw id stands in
                    if the lookup missed. */}
                {item.vendor?.name || item.vendor_id ? (
                  <span
                    className="block max-w-[11rem] truncate"
                    title={item.vendor?.name || item.vendor_id || undefined}
                  >
                    {item.vendor?.name || item.vendor_id}
                  </span>
                ) : assignVendorGranted && canAssignVendor(item) ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="-ml-2 gap-1.5 font-normal text-muted-foreground"
                    onClick={() => onAssignVendor(item)}
                  >
                    Assign Vendor
                  </Button>
                ) : (
                  <span className="text-muted-foreground italic">
                    {item.is_needs_canvass
                      ? "Empty — in canvassing"
                      : "Not set"}
                  </span>
                )}
              </TableCell>
              <TableCell>
                <StatusBadge tone={purchaseRequestItemTone[item.status]}>
                  {purchaseRequestItemStatusLabels[item.status]}
                </StatusBadge>
              </TableCell>
              <TableCell>
                {proofs.length === 0 && item.status === "canvassing" ? (
                  <Link
                    href={`/purchase-requests/${request._id}/canvassing`}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:underline"
                  >
                    View Canvassing
                    <ArrowRightIcon className="size-3.5" aria-hidden />
                  </Link>
                ) : proofs.length === 0 ? (
                  <span className="-ml-2 inline-flex h-7 items-center gap-1.5 px-2.5 text-[0.8rem] text-muted-foreground">
                    <StatusDot tone="warning" />
                    No proof
                  </span>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="-ml-2 gap-1.5 font-normal text-muted-foreground"
                    onClick={() => onHighlightProofs(item._id)}
                  >
                    <StatusDot tone="success" />
                    {proofs.length} proof{proofs.length === 1 ? "" : "s"}
                  </Button>
                )}
              </TableCell>
              <TableCell>
                {deliveryDate ? (
                  formatShortDate(deliveryDate)
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell>
                {/* Nothing to offer on a closed or not-yet-ordered row, so the
                    trigger is absent rather than present-but-empty. The
                    approve/reject decision is deliberately not here — it is
                    the bulk bar's alone, so one line and twenty are decided
                    the same way. */}
                {partialDeliveryGranted && canRecordPartialDelivery(item) ? (
                  <PurchaseRequestItemRowActions
                    itemLabel={item.material?.description || item.material_id}
                    onRecordPartialDelivery={() =>
                      onRecordPartialDelivery(item)
                    }
                  />
                ) : null}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
