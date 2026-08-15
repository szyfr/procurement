import { DownloadIcon } from "lucide-react";
import type { Metadata } from "next";

import { ReportFilters } from "@/components/reports/report-filters";
import { ReportWorkspace } from "@/components/reports/report-workspace";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { resolveDateRange } from "@/modules/reports";

export const metadata: Metadata = {
  title: "Reports",
};

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{
    range?: string;
    start?: string;
    end?: string;
    search?: string;
  }>;
}) {
  const { range, start, end, search } = await searchParams;

  // Resolved here rather than in the client view: a preset is relative to
  // "today", and resolving it once on the server keeps the dates identical
  // across the hydration boundary.
  const dateRange = resolveDateRange(range, start, end);

  return (
    <>
      <PageHeader
        title="Reports"
        description="Procurement performance across the selected period"
        actions={
          // Disabled rather than removed, same as the other not-yet-built
          // actions in the app: no report endpoint returns a file, and the
          // three that answer an array have no pagination to export around.
          // It rendered enabled and did nothing at all before.
          <Button variant="outline" size="sm" disabled>
            <DownloadIcon data-icon="inline-start" />
            Export
          </Button>
        }
      />

      <ReportFilters range={dateRange} search={search ?? ""} />

      <ReportWorkspace
        startDate={dateRange.startDate}
        endDate={dateRange.endDate}
        search={search ?? ""}
      />
    </>
  );
}
