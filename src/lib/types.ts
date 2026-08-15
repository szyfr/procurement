/**
 * The presentation vocabulary every screen shares, plus the one shape the
 * dashboard still has no backend source for.
 *
 * Purchase requests, canvassing, roles, users and the rest of the
 * backend-wired features do not appear here: their shapes are the FastAPI
 * responses themselves and live in each module's `models/`.
 */

/** Visual tone shared by every status pill in the app. */
export type StatusTone =
  | "neutral"
  | "info"
  | "ordered"
  | "partial"
  | "success"
  | "warning"
  | "danger";

/**
 * The backend's own priority values, kept here rather than in the purchase
 * requests module because `PriorityBadge` is shared and a shared component may
 * not reach into a feature module for its types. Modules re-export it.
 */
export type Priority = "low" | "normal" | "high";

/** An entry in the dashboard's Recent Activity feed. No backend source yet. */
export interface ActivityEntry {
  id: string;
  description: string;
  timestamp: string;
}
