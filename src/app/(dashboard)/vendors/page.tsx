import type { Metadata } from "next";

import { PageHeader } from "@/components/shared/page-header";
import { VendorListView } from "@/components/vendors/vendor-list-view";

export const metadata: Metadata = {
  title: "Vendors",
};

/** Read-only — vendors are maintained upstream. */
export default async function VendorsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page } = await searchParams;
  const activePage = Math.max(Number(page) || 1, 1);

  return (
    <>
      <PageHeader
        title="Vendors"
        description="Suppliers available for canvassing and directly-sourced items"
      />

      <VendorListView page={activePage} />
    </>
  );
}
