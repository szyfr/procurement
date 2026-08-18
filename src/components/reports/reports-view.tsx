"use client";

import * as React from "react";

import { usePermissions } from "@/components/providers/permissions-provider";
import { ReportFilters } from "@/components/reports/report-filters";
import { ReportWorkspace } from "@/components/reports/report-workspace";
import { defaultReportId, visibleReports } from "@/data/reports";
import { hasPermission } from "@/modules/auth/models/access";
import type { ReportDateRange } from "@/modules/reports";

/**
 * Owns which report is active so `ReportFilters` can show the vendor-name
 * search only for Vendor Performance — the only report `GET /reports/vendor`
 * backs, and the only one that field filters.
 *
 * It also narrows the catalogue to the reports this user can actually run.
 * Each one is a separate endpoint with a separate grant, so a user who holds
 * only `report.vendor` gets a page with Vendor Performance on it rather than
 * four cards, three of which would 403 on Generate.
 */
export function ReportsView({
  range,
  search,
}: {
  range: ReportDateRange;
  search: string;
}) {
  const granted = usePermissions();

  const allowedReports = React.useMemo(
    () =>
      visibleReports.filter(
        // A report with no `permission` has no endpoint behind it either; it
        // stays as the "unavailable" card it already was.
        (report) =>
          !report.permission || hasPermission(granted, report.permission),
      ),
    [granted],
  );

  // The catalogue's default is only a preference — it may be one this user
  // can't run, so the first report they can becomes the landing one instead.
  const [activeId, setActiveId] = React.useState(
    () =>
      allowedReports.find((report) => report.id === defaultReportId)?.id ??
      allowedReports[0]?.id ??
      defaultReportId,
  );

  return (
    <>
      <ReportFilters
        range={range}
        search={search}
        showVendorFilter={activeId === "vendor-performance"}
      />

      <ReportWorkspace
        reports={allowedReports}
        startDate={range.startDate}
        endDate={range.endDate}
        search={search}
        activeId={activeId}
        onActiveIdChange={setActiveId}
      />
    </>
  );
}
