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
 * Both bulk actions run off the one selection, and their eligibility differs —
 * a proof of order is only meaningful while an item is still `po-created`,
 * while delivery also closes out a `partially-completed` one. Each button is
 * disabled rather than hidden when its own rule fails, so the action doesn't
 * vanish as the selection grows.
 */
export function PurchaseRequestItemsBulkBar({
  selectedItems,
  showAddProof,
  showMarkDelivered,
  canAddProof,
  canMarkDelivered,
  onClear,
  onAddProof,
  onMarkDelivered,
}: {
  selectedItems: PurchaseRequestItem[];
  /**
   * Whether the user holds the grant at all. Distinct from `canAddProof` and
   * `canMarkDelivered` below, which are about *this selection*: an action the
   * user could take on a different selection is disabled, one they can never
   * take is absent.
   */
  showAddProof: boolean;
  showMarkDelivered: boolean;
  canAddProof: boolean;
  canMarkDelivered: boolean;
  onClear: () => void;
  onAddProof: () => void;
  onMarkDelivered: () => void;
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
