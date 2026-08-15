import type { Metadata } from "next";

import { ReportsView } from "@/components/reports/reports-view";
import { PageHeader } from "@/components/shared/page-header";
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
      />

      <ReportsView range={dateRange} search={search ?? ""} />
    </>
  );
}
