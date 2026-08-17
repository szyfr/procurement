import {
  Building2Icon,
  ChartColumnIcon,
  ClipboardListIcon,
  HandCoinsIcon,
  LayoutDashboardIcon,
  ShieldIcon,
  TruckIcon,
  UserCogIcon,
  UsersIcon,
} from "lucide-react";

export const appIdentity = {
  name: "Procurement",
  organization: "MK Themed Attractions Phils.",
};

export const mainNav = [
  {
    title: "PROCUREMENT",
    items: [
      { title: "Dashboard", url: "/dashboard", icon: LayoutDashboardIcon },
      {
        title: "Purchase Requests",
        url: "/purchase-requests",
        icon: ClipboardListIcon,
      },
      { title: "Canvassing", url: "/canvassing", icon: UsersIcon },
      { title: "Reports", url: "/reports", icon: ChartColumnIcon },
    ],
  },
  {
    title: "ADMINISTRATION",
    items: [
      { title: "Departments", url: "/departments", icon: Building2Icon },
      { title: "Vendors", url: "/vendors", icon: TruckIcon },
      {
        title: "Payment Terms",
        url: "/payment-terms",
        icon: HandCoinsIcon,
      },
      { title: "Roles & Permissions", url: "/roles", icon: ShieldIcon },
      { title: "Users", url: "/users", icon: UserCogIcon },
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
