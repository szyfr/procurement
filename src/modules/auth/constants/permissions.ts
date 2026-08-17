/**
 * The permission slugs the UI checks against, mirrored from the backend.
 *
 * These are not invented here. Every string below is a `require_permission(...)`
 * argument in `purchasing-backend/app/http/controllers/`, copied verbatim, and
 * the same string is a `title` in the seeded `permissions` collection that
 * `GET /permissions` lists and the role editor grants. A slug that doesn't match
 * upstream character-for-character silently denies access to a user who
 * actually has the grant, so treat this file as a transcription rather than a
 * naming exercise — including the upstream spellings that look wrong.
 *
 * `/auth/me` reports the caller's slugs as a flat `permissions` array, merged
 * from the permissions attached to the user directly and those reached through
 * their roles. There is no module/action structure upstream; the grouping here
 * is ours, for lookup only.
 */

export const PERMISSIONS = {
  purchaseRequest: {
    index: "purchase_request.index",
    show: "purchase_request.show",
    store: "purchase_request.store",
    update: "purchase_request.update",
    delete: "purchase_request.delete",
    updateStatus: "purchase_request.update-status",
    /**
     * Spelled "cavassing" upstream — the `n` is missing in the controller and
     * therefore in the seeded catalogue. Fixing it here would deny the grant
     * users are actually given; it can only be corrected on both sides at once.
     */
    routeToCanvassing: "purchase_request.cavassing",
  },

  purchaseRequestItem: {
    index: "purchase_request_item.index",
    delete: "purchase_request_item.delete",
    process: "purchase_request_item.process",
    updateStatus: "purchase_request_item.update-status",
    delivered: "purchase_request_item.delivered",
    partialDelivery: "purchase_request_item.partial-delivery",
  },

  purchaseRequestProof: {
    show: "purchase_request_proof.show",
    store: "purchase_request_proof.store",
  },

  canvassing: {
    index: "canvassing.index",
    /** Gates the quote comparison read (`GET /canvassing/quotations`). */
    quotations: "canvassing.quotations",
    award: "canvassing.award-canvassing",
  },

  quotation: {
    index: "quotation.index",
    show: "quotation.show",
    store: "quotation.store",
    update: "quotation.update",
    delete: "quotation.delete",
  },

  department: {
    index: "department.index",
    show: "department.show",
    store: "department.store",
    update: "department.update",
    delete: "department.delete",
  },

  paymentTerm: {
    index: "payment_term.index",
    show: "payment_term.show",
    /**
     * Create, update *and* delete upstream all require `payment_term.store` —
     * the controller reuses it on all three writes and no `payment_term.update`
     * or `.delete` slug exists. So this one grant is the whole write surface.
     */
    write: "payment_term.store",
  },

  material: {
    index: "material.index",
  },

  vendor: {
    index: "vendor.index",
  },

  role: {
    index: "role.index",
    show: "role.show",
    store: "role.store",
    update: "role.update",
    delete: "role.delete",
  },

  permission: {
    index: "permission.index",
    show: "permission.show",
    store: "permission.store",
    update: "permission.update",
    delete: "permission.delete",
  },

  user: {
    index: "user.index",
    show: "user.show",
    update: "user.update",
  },

  userRole: {
    index: "user-role.index",
    attach: "user-role.attach",
  },

  userPermission: {
    index: "user-permission.index",
    attach: "user-permission.attach",
  },

  report: {
    prCycle: "report.pr-cycle",
    departmentSpending: "report.department-spending",
    canvassingCompliance: "report.canvassing-compliance",
    /**
     * Gates `GET /reports/vendor` only. The vendor *directory* is a separate
     * grant — `vendor.index`, above — so holding one says nothing about the
     * other.
     */
    vendor: "report.vendor",
  },
} as const;

/** Distributive, so the slugs of every group are unioned rather than intersected. */
type Values<T> = T extends unknown ? T[keyof T] : never;

/** Every slug in the catalogue, as a union. */
export type PermissionSlug = Values<Values<typeof PERMISSIONS>>;
