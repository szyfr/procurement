import type { Metadata } from "next";

import { CanvassingListView } from "@/components/canvassing/canvassing-list-view";
import { NoAccess } from "@/components/shared/no-access";
import { PageHeader } from "@/components/shared/page-header";
import { PERMISSIONS } from "@/modules/auth/constants/permissions";
import { canAccess } from "@/modules/auth/dal/access";

export const metadata: Metadata = {
  title: "Canvassing",
};

/**
 * Search is the only working control here. Upstream `GET /canvassing` takes a
 * `search` term and matches it against the item's title and description, and
 * nothing else: there is no status filter (the row's status is derived by the
 * aggregation, not queried) and no department one (a canvassing row carries no
 * department), so the toolbar carries no dropdowns rather than presentational
 * ones — `DataToolbar` leaves a filter inert when handed no `value`.
 */
export default async function CanvassingPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string }>;
}) {
  const { page, search } = await searchParams;
  const activePage = Math.max(Number(page) || 1, 1);

  if (!(await canAccess(PERMISSIONS.canvassing.index))) {
    return <NoAccess title="Canvassing" resource="canvassing" />;
  }

  return (
    <>
      <PageHeader
        title="Canvassing"
        description="Items out for vendor quotation, grouped into batches"
      />

      <CanvassingListView page={activePage} search={search ?? ""} />
    </>
  );
}
