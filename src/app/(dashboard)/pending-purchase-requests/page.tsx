import type { Metadata } from "next";

import { PendingPurchaseRequestsListView } from "@/components/purchaser/pending-purchase-requests-list-view";
import { NoAccess } from "@/components/shared/no-access";
import { PageHeader } from "@/components/shared/page-header";
import { PERMISSIONS } from "@/modules/auth/constants/permissions";
import { canAccess } from "@/modules/auth/dal/access";

export const metadata: Metadata = {
  title: "Pending Purchase Requests",
};

/**
 * The purchaser's queue: every requester's request still awaiting a vendor,
 * not just the signed-in user's own. `GET /purchaser` is a separate,
 * dedicated endpoint gated on `purchaser.index` — distinct from
 * `purchase_request.index`, which `/purchase-requests` now scopes to its
 * caller's own requests.
 */
export default async function PendingPurchaseRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    search?: string;
    priority?: string;
    departments?: string;
  }>;
}) {
  const { page, search, priority, departments } = await searchParams;
  const activePage = Math.max(Number(page) || 1, 1);

  if (!(await canAccess(PERMISSIONS.purchaser.index))) {
    return (
      <NoAccess
        title="Pending Purchase Requests"
        resource="pending purchase requests"
      />
    );
  }

  return (
    <>
      <PageHeader
        title="Pending Purchase Requests"
        description="Every request awaiting a vendor, across all requesters"
      />

      <PendingPurchaseRequestsListView
        page={activePage}
        search={search ?? ""}
        priority={priority ?? ""}
        departments={departments ?? ""}
      />
    </>
  );
}
