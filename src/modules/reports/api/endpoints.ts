/**
 * Every BFF path the Reports UI is allowed to call. All relative — the browser
 * only ever talks to this app's own origin.
 */

const BASE = "/api/reports";

export const reportEndpoints = {
  vendorPerformance: `${BASE}/vendor`,
} as const;
