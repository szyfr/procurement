import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";
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
 * The checkbox column feeds two bulk actions with different eligibility, so
 * all three rules are exported: the section above owns the selection and has
 * to apply the same ones — a refetch that moves an item on has to drop it from
 * the checkbox column and from whatever action was about to submit it.
 */

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

/** A row gets a checkbox when either bulk action can act on it. */
export function isItemSelectable(item: PurchaseRequestItem) {
  return isProofSelectable(item) || isDeliverySelectable(item);
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
  selectedIds,
  onToggleItem,
  onToggleAll,
  onHighlightProofs,
}: {
  request: PurchaseRequestDetail;
  selectedIds: Set<string>;
  onToggleItem: (id: string, checked: boolean) => void;
  onToggleAll: (checked: boolean) => void;
  onHighlightProofs: (itemId: string) => void;
}) {
  const selectableItems = request.items.filter(isItemSelectable);
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
        </TableRow>
      </TableHeader>
      <TableBody>
        {request.items.map((item) => {
          const selectable = isItemSelectable(item);
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
                  if the lookup missed. */}
              <TableCell>
                {item.material?.description || item.material_id}
              </TableCell>
              <TableCell className={numericCellClass}>
                {item.quantity}
              </TableCell>
              <TableCell>
                {/* The detail pipeline joins the vendor; the raw id stands in
                    if the lookup missed. */}
                {item.vendor?.name || item.vendor_id || (
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
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
