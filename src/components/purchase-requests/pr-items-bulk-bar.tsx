import { Button } from "@/components/ui/button";
import type { PurchaseRequestItem } from "@/modules/purchase-requests";

/** Vendor context shown next to the count — the detail pipeline joins the vendor, so ids only stand in when that join missed. */
function vendorSummary(items: PurchaseRequestItem[]) {
  const vendorIds = [...new Set(items.map((item) => item.vendor_id))];

  if (vendorIds.length === 1) {
    const vendorId = vendorIds[0];
    if (!vendorId) return "Vendor not set";
    return (
      items.find((item) => item.vendor_id === vendorId)?.vendor?.name ??
      vendorId
    );
  }
  return `${vendorIds.length} vendors`;
}

/**
 * Appears above the items table only while a row is selected; disappears once
 * the selection clears.
 *
 * All four bulk actions run off the one selection, and their eligibility
 * differs — a decision is only open while an item is still `pending`, a proof
 * of order is only meaningful once it is `po-created`, delivery also closes
 * out a `partially-completed` one, and a vendor can only be assigned to a
 * direct-sourced item that doesn't have one yet. Each button is disabled
 * rather than hidden when its own rule fails, so the action doesn't vanish as
 * the selection grows.
 */
export function PurchaseRequestItemsBulkBar({
  selectedItems,
  showProcess,
  showAddProof,
  showMarkDelivered,
  showAssignVendor,
  canProcess,
  canAddProof,
  canMarkDelivered,
  canAssignVendor,
  onClear,
  onApprove,
  onReject,
  onAddProof,
  onMarkDelivered,
  onAssignVendor,
}: {
  selectedItems: PurchaseRequestItem[];
  /**
   * Whether the user holds the grant at all. Distinct from `canProcess`,
   * `canAddProof`, `canMarkDelivered` and `canAssignVendor` below, which are
   * about *this selection*: an action the user could take on a different
   * selection is disabled, one they can never take is absent.
   */
  showProcess: boolean;
  showAddProof: boolean;
  showMarkDelivered: boolean;
  showAssignVendor: boolean;
  canProcess: boolean;
  canAddProof: boolean;
  canMarkDelivered: boolean;
  canAssignVendor: boolean;
  onClear: () => void;
  onApprove: () => void;
  onReject: () => void;
  onAddProof: () => void;
  onMarkDelivered: () => void;
  onAssignVendor: () => void;
}) {
  if (selectedItems.length === 0) return null;

  return (
    <div className="sticky top-0 z-10 flex flex-wrap items-center gap-3 border-b bg-muted px-4 py-2.5">
      <span className="text-xs font-medium">
        {selectedItems.length} item{selectedItems.length === 1 ? "" : "s"}{" "}
        selected
      </span>
      <span className="text-xs text-muted-foreground">
        {vendorSummary(selectedItems)}
      </span>
      <div className="flex-1" />
      <Button variant="ghost" size="sm" onClick={onClear}>
        Clear Selection
      </Button>
      {showProcess ? (
        <>
          <Button
            variant="destructive"
            size="sm"
            disabled={!canProcess}
            onClick={onReject}
          >
            Reject
          </Button>
          <Button size="sm" disabled={!canProcess} onClick={onApprove}>
            Approve
          </Button>
        </>
      ) : null}
      {showAssignVendor ? (
        <Button
          variant="outline"
          size="sm"
          disabled={!canAssignVendor}
          onClick={onAssignVendor}
        >
          Assign Vendor
        </Button>
      ) : null}
      {showAddProof ? (
        <Button
          variant="outline"
          size="sm"
          disabled={!canAddProof}
          onClick={onAddProof}
        >
          Add Proof of Order
        </Button>
      ) : null}
      {showMarkDelivered ? (
        <Button
          size="sm"
          disabled={!canMarkDelivered}
          onClick={onMarkDelivered}
        >
          Mark as Delivered
        </Button>
      ) : null}
    </div>
  );
}
