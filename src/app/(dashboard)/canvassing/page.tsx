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
 * No toolbar. There was one, and every control on it was inert: the search box
 * accepted typing and filtered nothing, and the Status dropdown selected and
 * did nothing — `DataToolbar` leaves a filter presentational when it is handed
 * no `value`/`onValueChange`, so both looked exactly like the working ones on
 * Purchase Requests.
 *
 * Nothing is plumbed for it yet: `listCanvassing` takes only `page`/`pageSize`,
 * and neither the client nor the Route Handler carries a search or status term.
 * Restoring it means threading those through the DAL first. There is no
 * Department filter either — a canvassing row carries no department.
 */
export default async function CanvassingPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page } = await searchParams;
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

      <CanvassingListView page={activePage} />
    </>
  );
}
