"use client";

import * as React from "react";

import { ReportFilters } from "@/components/reports/report-filters";
import { ReportWorkspace } from "@/components/reports/report-workspace";
import { defaultReportId } from "@/data/reports";
import type { ReportDateRange } from "@/modules/reports";

/**
 * Owns which report is active so `ReportFilters` can show the vendor-name
 * search only for Vendor Performance — the only report `GET /reports/vendor`
 * backs, and the only one that field filters.
 */
export function ReportsView({
  range,
  search,
}: {
  range: ReportDateRange;
  search: string;
}) {
  const [activeId, setActiveId] = React.useState(defaultReportId);

  return (
    <>
      <ReportFilters
        range={range}
        search={search}
        showVendorFilter={activeId === "vendor-performance"}
      />

      <ReportWorkspace
        startDate={range.startDate}
        endDate={range.endDate}
        search={search}
        activeId={activeId}
        onActiveIdChange={setActiveId}
      />
    </>
  );
}
