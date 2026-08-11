import type { Metadata } from "next";

import { PaymentTermsPageContent } from "@/components/payment-terms/payment-terms-page-content";

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

  return <PaymentTermsPageContent page={activePage} />;
}
