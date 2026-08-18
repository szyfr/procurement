import type { Metadata } from "next";

import { ReportsView } from "@/components/reports/reports-view";
import { NoAccess } from "@/components/shared/no-access";
import { PageHeader } from "@/components/shared/page-header";
import { reportPermissions } from "@/data/reports";
import { canAccess } from "@/modules/auth/dal/access";
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

  // One grant is enough to open the page; the workspace then shows only the
  // reports that grant covers.
  if (!(await canAccess(...reportPermissions))) {
    return <NoAccess title="Reports" resource="any procurement report" />;
  }

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
