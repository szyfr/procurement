/**
 * Types for the screens that are still mock-driven — dashboard, reports and
 * notifications — plus the one presentation vocabulary every screen shares.
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

/**
 * Canvassing's wireframe types are gone — batches, quote minimums and
 * exemption flags described a model the backend never grew; those screens now
 * read `modules/canvassing` instead.
 */

export type NotificationGroup = "today" | "earlier";

export interface Notification {
  id: string;
  message: string;
  timestamp: string;
  group: NotificationGroup;
  read: boolean;
  href: string;
}
