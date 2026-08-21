import type { Priority } from "@/lib/types";
import type { Department } from "@/modules/departments";
import type { Material } from "@/modules/purchase-requests/models/material";
import type { PurchaseRequestProof } from "@/modules/purchase-requests/models/purchase-request-proof";
import type { Vendor } from "@/modules/vendors";

/**
 * The `/purchase-requests` responses, verbatim — snake_case, `_id` keys, and
 * the backend's own enum values. Nothing reshapes them on the way to a
 * component: what the detail page renders is what FastAPI sent, and a field
 * that isn't declared here is a field the backend does not have.
 *
 * Notably absent, because there is no source for them: a stored amount, a
 * status label richer than the enum, submitted/completed/rejected dates,
 * rejection reasons, comments and activity history. The panels that would show
 * those stay hidden. Proof-of-order documents (`proofs` below) are joined onto
 * the detail response, but their filenames aren't — see
 * `models/purchase-request-proof.ts`.
 */

/** Shared with `PriorityBadge`, which is why the type itself lives in `lib/types`. */
export type { Priority };

/** `app/schemas/purchase_request_schema.py:Status`. */
export type PurchaseRequestStatus =
  | "draft"
  | "pending"
  | "canvassing"
  | "po-created"
  | "partially-completed"
  | "completed"
  | "rejected"
  | "canceled";

/**
 * `app/schemas/purchase_request_item_schema.py:Status` — a wider set than the
 * request's, because a single item can be rejected or completed while the rest
 * of the request moves on.
 *
 * `pending-assessment` is the item enum's alone: the request's own enum has no
 * such member, so it can only ever describe a line, never the request above it.
 *
 * It marks a line the backend's `StatusService` has yet to look at, and it is
 * what the create form stamps on every item of a submitted request. What the
 * assessment decides is advisory now rather than binding: a conflicting
 * material or an over-consuming quantity used to be auto-rejected and is left
 * `pending` for someone to approve or reject by hand.
 */
export type PurchaseRequestItemStatus =
  | "pending-assessment"
  | "pending"
  | "draft"
  | "canvassing"
  | "quotation-awarded"
  | "po-created"
  | "partially-completed"
  | "completed"
  | "rejected"
  | "canceled";

export interface PurchaseRequestItem {
  _id: string;
  quantity: number;
  status: PurchaseRequestItemStatus;
  /**
   * How the item is sourced: canvassing when set, direct otherwise. Copied
   * from the material, not chosen by the requester.
   */
  is_needs_canvass: boolean | null;
  purchase_request_id: string;
  material_id: string;
  vendor_id: string | null;
  /** Set by `PATCH /canvassing/award/{quotation_id}` once a vendor is awarded. */
  quotation_id?: string | null;
  /**
   * `StatusService`'s reasoning for the item's assessment ("A purchase
   * request already exists for this material" and friends). Set alongside
   * `pending-assessment`; absent once nothing needed flagging.
   */
  suggestion?: string | null;
  /**
   * How much has arrived so far — a running total, not an increment. Both
   * writers `$set` it: `PATCH .../items/{id}/partial-delivery` stores whatever
   * amount it is sent (recording 2 then 3 leaves 3, not 5) and the Business
   * Central receipt sync stores `qtyReceived`.
   *
   * Upstream never compares it to `quantity` — it validates `amount > 0` and
   * nothing else, so it can meet or exceed the order, and reaching the ordered
   * quantity does not move the item to `completed`. Only
   * `PATCH /purchase-requests/{id}/delivered` does that. The ceiling is
   * enforced in `PartialDeliveryDialog`, which is the only place it exists.
   */
  partial_delivered?: number | null;
  /**
   * Stamped by `PATCH /purchase-requests/{id}/delivered`, and by the Business
   * Central receipt sync. Absent until an item is actually delivered — the
   * create schema has no such field.
   */
  delivered_at?: string | null;
  created_at: string;
  updated_at: string;
  /**
   * Joined by the detail pipeline only — the create response carries no
   * material, so callers fall back to `material_id` for a row's name.
   */
  material?: Material | null;
  /** Joined by the detail pipeline only, alongside `material`. */
  vendor?: Vendor | null;
}

export interface PurchaseRequest {
  _id: string;
  /** Human-readable request number, e.g. "PR-2026-0803133440". */
  no: string;
  title: string;
  date_needed: string;
  priority: Priority;
  justification: string;
  status: PurchaseRequestStatus;
  requester_id: string;
  department_id: string;
  created_at: string;
  updated_at: string;
  /**
   * Joined by the list pipeline only, and left null when the lookup misses —
   * both stages unwind with `preserveNullAndEmptyArrays`. The create, update
   * and detail responses carry neither.
   */
  department_name?: string | null;
  requester_name?: string | null;
}

/**
 * What `POST /purchase-requests` and `PUT /purchase-requests/{id}` hand back:
 * the stored request with the items as they were written, and none of the
 * joins. No `department`, no per-item `material` or `vendor`, and no `proofs` —
 * all of those come from the detail pipeline's aggregation, which a write never
 * runs. A caller that needs them reads the request back by id; seeding the
 * detail cache with a write response instead leaves the page rendering a
 * request whose `proofs` is missing outright.
 */
export interface PurchaseRequestWriteResult extends PurchaseRequest {
  items: PurchaseRequestItem[];
}

/** `GET /purchase-requests/{id}` — the list endpoint returns no items. */
export interface PurchaseRequestDetail extends PurchaseRequestWriteResult {
  /**
   * The detail pipeline joins the whole department document rather than
   * flattening a name onto the request the way the list does. It joins no
   * requester at all, so the detail page has no name to show for one.
   */
  department?: Department | null;
  /**
   * Every proof touching one of this request's items, joined by
   * `purchase_request_item_ids` rather than nested under each item.
   */
  proofs: PurchaseRequestProof[];
}

/**
 * The transitions the UI drives. The backend's enum is wider, but every other
 * status is reached through canvassing or PO processing rather than by someone
 * pressing a button on a request.
 *
 * `completed` is here because nothing upstream ever sets it: neither the
 * delivery nor the partial-delivery handler dispatches `StatusVerificationJob`,
 * so a request whose items are all delivered keeps reading "PO Created" until
 * someone closes it out by hand.
 */
export type SettablePurchaseRequestStatus =
  | "pending"
  | "canceled"
  | "completed";
