/**
 * Vendors module — public surface.
 *
 * Only the browser-safe pieces are re-exported here. The DAL is deliberately
 * left out: it reaches FastAPI and must be imported directly by Route Handlers
 * (`@/modules/vendors/dal/...`) so it can never be pulled into a client bundle
 * through this barrel.
 */

export type { Vendor } from "@/modules/vendors/models/vendor";
export { vendorListQuery } from "@/modules/vendors/queries";
