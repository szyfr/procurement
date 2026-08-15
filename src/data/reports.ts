import {
  ChartPieIcon,
  ClipboardCheckIcon,
  GaugeIcon,
  type LucideIcon,
  StarIcon,
  UserCheckIcon,
} from "lucide-react";

/**
 * The report catalogue: which reports the page offers and what each card says.
 *
 * Results are not here. Every wired report renders from its own live query in
 * `components/reports/`, so this file used to carry a `chart` and `table` of
 * fabricated numbers per entry that nothing displayed — plus one entry,
 * Purchaser Performance, whose invented figures *were* displayed and were
 * indistinguishable from the four real reports. Both are gone; `availability`
 * is what the workspace reads instead.
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
  /** Why it cannot be generated. Required when `availability` is `unavailable`. */
  unavailableReason?: string;
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
  },
  {
    id: "spend-by-department",
    title: "Spend by Department",
    description: "Ordered items grouped by the department that requested them",
    icon: GaugeIcon,
    availability: "live",
  },
  {
    id: "vendor-performance",
    title: "Vendor Performance",
    description:
      "Auto-scored from delivery & quality data — replaces manual vendor evaluations",
    icon: StarIcon,
    availability: "live",
  },
  {
    id: "canvassing-compliance",
    title: "Canvassing Compliance",
    description: "Canvassed items meeting the 3-quote minimum",
    icon: ClipboardCheckIcon,
    availability: "live",
  },
  {
    id: "purchaser-performance",
    title: "Purchaser Performance",
    description:
      "PRs processed, cycle time, and compliance per procurement officer",
    icon: UserCheckIcon,
    availability: "unavailable",
    unavailableReason:
      "Purchase requests carry no record of which procurement officer handled them, so there is nothing to attribute this to yet.",
  },
];

/** The report shown when the page loads. Must be a `live` one. */
export const defaultReportId = "spend-by-department";
