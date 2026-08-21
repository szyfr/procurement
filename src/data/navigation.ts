import {
  Building2Icon,
  ChartColumnIcon,
  ClipboardCheckIcon,
  ClipboardListIcon,
  HandCoinsIcon,
  LayoutDashboardIcon,
  ShieldIcon,
  TruckIcon,
  UserCogIcon,
  UsersIcon,
} from "lucide-react";

import { reportPermissions } from "@/data/reports";
import { PERMISSIONS } from "@/modules/auth/constants/permissions";

export const appIdentity = {
  name: "Procurement",
  organization: "MK Themed Attractions Phils.",
};

/**
 * `requires` is what the sidebar filters on: holding *any* one of the listed
 * grants shows the entry, because each of these pages is worth opening as soon
 * as one thing on it works. It is the same permission the page itself gates on,
 * so a visible link never leads to a no-access screen.
 *
 * Dashboard carries none. It is where sign-in lands, and it degrades panel by
 * panel rather than as a whole, so hiding it would strand a user on a route
 * with no nav entry to leave by.
 */
export const mainNav = [
  {
    title: "PROCUREMENT",
    items: [
      { title: "Dashboard", url: "/dashboard", icon: LayoutDashboardIcon },
      {
        title: "Purchase Requests",
        url: "/purchase-requests",
        icon: ClipboardListIcon,
        requires: [PERMISSIONS.purchaseRequest.index],
      },
      {
        title: "Pending Purchase Requests",
        url: "/pending-purchase-requests",
        icon: ClipboardCheckIcon,
        requires: [PERMISSIONS.purchaser.index],
      },
      {
        title: "Canvassing",
        url: "/canvassing",
        icon: UsersIcon,
        requires: [PERMISSIONS.canvassing.index],
      },
      {
        title: "Reports",
        url: "/reports",
        icon: ChartColumnIcon,
        // Each report is its own endpoint with its own grant; the page shows
        // whichever of them the user can run.
        requires: reportPermissions,
      },
    ],
  },
  {
    title: "ADMINISTRATION",
    items: [
      {
        title: "Departments",
        url: "/departments",
        icon: Building2Icon,
        requires: [PERMISSIONS.department.index],
      },
      {
        title: "Vendors",
        url: "/vendors",
        icon: TruckIcon,
        requires: [PERMISSIONS.vendor.index],
      },
      {
        title: "Payment Terms",
        url: "/payment-terms",
        icon: HandCoinsIcon,
        requires: [PERMISSIONS.paymentTerm.index],
      },
      {
        title: "Roles & Permissions",
        url: "/roles",
        icon: ShieldIcon,
        requires: [PERMISSIONS.role.index],
      },
      {
        title: "Users",
        url: "/users",
        icon: UserCogIcon,
        requires: [PERMISSIONS.user.index],
      },
    ],
  },
];

/**
 * Breadcrumb labels for static segments. Segments without an entry — dynamic
 * ids such as `PR-2026-0117` — render as-is.
 */
export const breadcrumbLabels: Record<string, string> = {
  dashboard: "Dashboard",
  "purchase-requests": "Purchase Requests",
  new: "New",
  canvassing: "Canvassing",
  "pending-purchase-requests": "Pending Purchase Requests",
  quotes: "Quotes",
  reports: "Reports",
  departments: "Departments",
  vendors: "Vendors",
  "payment-terms": "Payment Terms",
  roles: "Roles & Permissions",
  settings: "Settings",
  account: "My Account",
  users: "Users",
};

/**
 * Segments that exist only to nest routes and should not appear as a crumb.
 * `settings` is one of them now that it holds a single page: the crumb would
 * link to a route that redirects straight back to where the user already is.
 */
export const hiddenBreadcrumbSegments = new Set(["quotes", "settings"]);
