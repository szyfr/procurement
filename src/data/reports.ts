import {
  ChartPieIcon,
  ClipboardCheckIcon,
  GaugeIcon,
  type LucideIcon,
  StarIcon,
  UserCheckIcon,
} from "lucide-react";

import {
  PERMISSIONS,
  type PermissionSlug,
} from "@/modules/auth/constants/permissions";

/**
 * The report catalogue: which reports the page offers and what each card says.
 *
 * Results are not here. Every wired report renders from its own live query in
 * `components/reports/`, so this file used to carry a `chart` and `table` of
 * fabricated numbers per entry that nothing displayed — plus one entry,
 * Purchaser Performance, whose invented figures *were* displayed and were
 * indistinguishable from the real reports. Both are gone; `availability` is
 * what the workspace reads instead, and every entry is now `live`.
 */

export interface ReportChartDatum {
  category: string;
  value: number;
  /** Per-bar colour. Omit for the default monochrome treatment. */
  fill?: string;
}

export interface ReportDefinition {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  /**
   * `unavailable` means there is no endpoint behind it. The card stays on the
   * page so the gap is visible rather than silently missing; selecting it says
   * so instead of showing numbers.
   */
  availability: "live" | "unavailable";
  /**
   * The grant its endpoint requires. Each report is a separate endpoint with a
   * separate permission upstream, so the page shows the user's own subset
   * rather than all-or-nothing. An `unavailable` report has no endpoint and so
   * no grant to check.
   */
  permission?: PermissionSlug;
  /** Why it cannot be generated. Required when `availability` is `unavailable`. */
  unavailableReason?: string;
  /**
   * Keeps the entry in the catalogue but off the page. Use it when the gap is
   * real but showing an unavailable card is more noise than signal; drop the
   * flag to bring the card back once there is an endpoint behind it.
   */
  hidden?: boolean;
}

export const reports: ReportDefinition[] = [
  {
    // The id is the workspace key and stays as it is; the title says what the
    // endpoint can answer, which is a status distribution rather than cycle
    // time. Actual cycle time needs per-stage timestamps the schema lacks.
    id: "pr-cycle-time",
    title: "PR Status Breakdown",
    description: "Purchase requests created in the period, grouped by status",
    icon: ChartPieIcon,
    availability: "live",
    permission: PERMISSIONS.report.prCycle,
  },
  {
    id: "spend-by-department",
    title: "Spend by Department",
    description: "Ordered items grouped by the department that requested them",
    icon: GaugeIcon,
    availability: "live",
    permission: PERMISSIONS.report.departmentSpending,
  },
  {
    id: "vendor-performance",
    title: "Vendor Performance",
    description:
      "Auto-scored from delivery & quality data — replaces manual vendor evaluations",
    icon: StarIcon,
    availability: "live",
    permission: PERMISSIONS.report.vendor,
  },
  {
    id: "canvassing-compliance",
    title: "Canvassing Compliance",
    description: "Canvassed items meeting the 3-quote minimum",
    icon: ClipboardCheckIcon,
    availability: "live",
    permission: PERMISSIONS.report.canvassingCompliance,
  },
  {
    // Cycle time is not in the endpoint's three fields, so the description
    // says what it can actually answer.
    id: "purchaser-performance",
    title: "Purchaser Performance",
    description: "Request items processed and delivered on time, per purchaser",
    icon: UserCheckIcon,
    availability: "live",
    permission: PERMISSIONS.report.purchaserAssessment,
  },
];

/** What the Reports page renders. Definitions marked `hidden` stay out. */
export const visibleReports = reports.filter((report) => !report.hidden);

/**
 * Every grant that opens at least one report. The Reports page and its sidebar
 * entry both gate on holding any of them, derived here so a new report can't be
 * added to the catalogue and left out of the nav rule.
 */
export const reportPermissions: readonly PermissionSlug[] = [
  ...new Set(
    visibleReports
      .map((report) => report.permission)
      .filter((permission): permission is PermissionSlug =>
        Boolean(permission),
      ),
  ),
];

/**
 * The report shown when the page loads. Must be a `live` one — and only when
 * the user can run it; `ReportsView` falls back to the first one they can.
 */
export const defaultReportId = "spend-by-department";
