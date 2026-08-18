import type { Metadata } from "next";

import { PurchaseRequestDetailView } from "@/components/purchase-requests/pr-detail-view";
import { NoAccess } from "@/components/shared/no-access";
import { PERMISSIONS } from "@/modules/auth/constants/permissions";
import { canAccess } from "@/modules/auth/dal/access";

/**
 * The request is fetched in the browser, so the title can't reflect it — the
 * set of requests is also unbounded, which is why there's no
 * `generateStaticParams` here any more.
 */
export const metadata: Metadata = {
  title: "Purchase Request",
};

export default async function PurchaseRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!(await canAccess(PERMISSIONS.purchaseRequest.show))) {
    return (
      <NoAccess title="Purchase Request" resource="this purchase request" />
    );
  }

  return <PurchaseRequestDetailView id={id} />;
}
