import type { Metadata } from "next";

import { NewQuotationView } from "@/components/canvassing/new-quotation-view";
import { NoAccess } from "@/components/shared/no-access";
import { PERMISSIONS } from "@/modules/auth/constants/permissions";
import { canAccess } from "@/modules/auth/dal/access";

export const metadata: Metadata = {
  title: "Add Vendor Quote",
};

/**
 * Records one vendor's quote for the items picked on the canvassing screen.
 *
 * The items arrive as repeated `items` params rather than a single joined
 * value, matching how the quotations read spells the same list. Which of them
 * are actually quotable is settled in the view, against the purchase request
 * detail it already has cached.
 */
export default async function AddVendorQuotePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ items?: string | string[] }>;
}) {
  const [{ id }, { items }] = await Promise.all([params, searchParams]);

  if (!(await canAccess(PERMISSIONS.quotation.store))) {
    return (
      <NoAccess title="Add Vendor Quote" resource="the vendor quote form" />
    );
  }

  // A single `?items=` collapses to a string; anything absent to undefined.
  const itemIds = items === undefined ? [] : [items].flat();

  return <NewQuotationView purchaseRequestId={id} itemIds={itemIds} />;
}
