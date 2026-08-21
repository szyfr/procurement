/**
 * Every BFF path the Purchaser UI is allowed to call. All relative — the
 * browser only ever talks to this app's own origin.
 */

export const purchaserEndpoints = {
  list: "/api/purchaser",
} as const;
