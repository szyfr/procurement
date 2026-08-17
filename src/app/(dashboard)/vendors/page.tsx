import type { Metadata } from "next";

import { NoAccess } from "@/components/shared/no-access";
import { PageHeader } from "@/components/shared/page-header";
import { VendorListView } from "@/components/vendors/vendor-list-view";
import { PERMISSIONS } from "@/modules/auth/constants/permissions";
import { canAccess } from "@/modules/auth/dal/access";

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

  // `GET /vendors` requires the vendor *report* grant upstream, not a
  // `vendor.index` of its own — see PERMISSIONS.report.vendor.
  if (!(await canAccess(PERMISSIONS.report.vendor))) {
    return <NoAccess title="Vendors" resource="the vendor directory" />;
  }

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
