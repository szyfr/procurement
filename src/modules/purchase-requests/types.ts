/**
 * Types that belong to the UI rather than to the API contract.
 */

/** A line being edited in the create form, before it becomes a request DTO. */
export interface DraftLineItem {
  key: string;
  materialId: string | null;
  materialName: string | null;
  unit: string | null;
  quantity: number;
  /**
   * Requester's cost estimate. Prefilled from the material's last cost where
   * one exists, otherwise typed in. The backend has no field for it, so it is
   * used for on-screen totals only and is not saved with the request.
   */
  unitCost: number | null;
  /** Derived from the material's `is_needs_canvass` flag, not chosen by hand. */
  sourcing: "direct" | "canvassing";
  vendorId: string | null;
  vendorName: string | null;
}
