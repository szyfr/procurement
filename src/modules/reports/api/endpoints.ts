/**
 * Every BFF path the Reports UI is allowed to call. All relative — the browser
 * only ever talks to this app's own origin.
 */

const BASE = "/api/reports";

export const reportEndpoints = {
  vendorPerformance: `${BASE}/vendor`,
  prCycle: `${BASE}/pr-cycle`,
  departmentSpending: `${BASE}/department-spending`,
  canvassingCompliance: `${BASE}/canvassing-compliance`,
  purchaserAssessment: `${BASE}/purchaser-assessment`,
} as const;
