/**
 * `PATCH .../items/assign-vendor` — gives a direct-sourced item the vendor it
 * has none of on create. The line items editor dropped the vendor picker (see
 * its own comment), so this is now the only path a directly-sourced item
 * reaches a `vendor_id` by; a canvassed item still gets one through an award.
 *
 * Upstream declares `vendor_id`/`item_id` as `PyObjectId`, so both go up as
 * plain strings.
 */
export interface AssignVendorEntry {
  item_id: string;
  vendor_id: string;
}

export interface AssignVendorDto {
  items: AssignVendorEntry[];
}
