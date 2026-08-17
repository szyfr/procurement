import type { Metadata } from "next";

import { PaymentTermsPageContent } from "@/components/payment-terms/payment-terms-page-content";
import { NoAccess } from "@/components/shared/no-access";
import { PERMISSIONS } from "@/modules/auth/constants/permissions";
import { canAccess } from "@/modules/auth/dal/access";

export const metadata: Metadata = {
  title: "Payment Terms",
};

/** Create and edit happen inline via dialogs rather than dedicated routes. */
export default async function PaymentTermsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page } = await searchParams;
  const activePage = Math.max(Number(page) || 1, 1);

  if (!(await canAccess(PERMISSIONS.paymentTerm.index))) {
    return <NoAccess title="Payment Terms" resource="payment terms" />;
  }

  return <PaymentTermsPageContent page={activePage} />;
}
