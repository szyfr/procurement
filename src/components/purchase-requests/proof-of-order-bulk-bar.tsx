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

/** Appears above the items table only while a row is selected; disappears once the selection clears. */
export function ProofOfOrderBulkBar({
  selectedItems,
  onClear,
  onOpen,
}: {
  selectedItems: PurchaseRequestItem[];
  onClear: () => void;
  onOpen: () => void;
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
      <Button size="sm" onClick={onOpen}>
        Add Proof of Order
      </Button>
    </div>
  );
}
