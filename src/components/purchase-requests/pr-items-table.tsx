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
 * The only status a proof of order can still be added for. Exported because
 * the section above owns the selection and must apply the same rule — a
 * refetch that moves an item past `po-created` has to drop it from both the
 * checkbox column and the selection.
 */
export function isProofSelectable(item: PurchaseRequestItem) {
  return item.status === "po-created";
}

/**
 * Every proof covering this item. The relationship is many-to-many — a proof
 * groups several lines under one vendor confirmation, and a line that arrives
 * in more than one delivery has more than one proof — so this is a list, not a
 * lookup. Neither the join nor `POST /purchase-request-proofs` carries a
 * filename; those live behind `GET /purchase-request-proofs/{id}`, which the
 * Proofs of Order section reads when a proof is opened.
 */
function proofsForItem(
  item: PurchaseRequestItem,
  request: PurchaseRequestDetail,
) {
  return request.proofs.filter((proof) =>
    proof.purchase_request_item_ids.includes(item._id),
  );
}

/** The soonest confirmed delivery among an item's proofs. */
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
  /** Rings this item's proofs in the Proofs of Order section and scrolls to them. */
  onHighlightProofs: (itemId: string) => void;
}) {
  const selectableItems = request.items.filter(isProofSelectable);
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
                aria-label="Select all items awaiting proof"
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
          const selectable = isProofSelectable(item);
          const proofs = proofsForItem(item, request);
          const deliveryDate = earliestDeliveryDate(proofs);

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
                {/* The backend joins no vendor, so the id is the only label. */}
                {item.vendor_id || (
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
                {/* An item still in canvassing has no proof to count yet, and
                    the route to its quotes is the more useful affordance. */}
                {proofs.length === 0 && item.status === "canvassing" ? (
                  <Link
                    href={`/purchase-requests/${request._id}/canvassing`}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:underline"
                  >
                    View Canvassing
                    <ArrowRightIcon className="size-3.5" aria-hidden />
                  </Link>
                ) : proofs.length === 0 ? (
                  // Not a button: there is nothing in the section below to ring
                  // yet, and an affordance that does nothing reads as broken.
                  // Padded like the button so both align down the column.
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
