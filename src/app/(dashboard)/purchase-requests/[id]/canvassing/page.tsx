import type { Metadata } from "next";

import { CanvassingItemsView } from "@/components/canvassing/canvassing-items-view";
import { CanvassingQuotationsView } from "@/components/canvassing/canvassing-quotations-view";
import { NoAccess } from "@/components/shared/no-access";
import { PERMISSIONS } from "@/modules/auth/constants/permissions";
import { canAccess } from "@/modules/auth/dal/access";

export const metadata: Metadata = {
  title: "Canvassing",
};

export default async function CanvassingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Both halves of this screen read the request's items and their quotes, so
  // the item read and the quote comparison are both required to make sense of
  // it.
  if (
    !(await canAccess(PERMISSIONS.purchaseRequest.show)) ||
    !(await canAccess(PERMISSIONS.canvassing.quotations))
  ) {
    return (
      <NoAccess title="Canvassing" resource="the quotes on this request" />
    );
  }

  return (
    <>
      <CanvassingItemsView id={id} />
      <CanvassingQuotationsView id={id} />
    </>
  );
}
