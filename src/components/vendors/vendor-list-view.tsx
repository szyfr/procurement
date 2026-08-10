"use client";

import { useQuery } from "@tanstack/react-query";
import { TruckIcon } from "lucide-react";

import { EmptyState, ErrorAlert } from "@/components/shared/query-states";
import { TableSkeleton } from "@/components/shared/table-skeleton";
import { VendorTable } from "@/components/vendors/vendor-table";
import { buildPageHref } from "@/lib/page-href";
import { vendorListQuery } from "@/modules/vendors";

export function VendorListView({ page }: { page: number }) {
  const { data, isPending, isError, error } = useQuery(vendorListQuery(page));

  if (isError) {
    return <ErrorAlert title="Couldn't load vendors" error={error} />;
  }

  if (isPending) {
    return <TableSkeleton />;
  }

  const { data: vendors, pagination } = data;

  if (vendors.length === 0) {
    return (
      <EmptyState
        icon={<TruckIcon />}
        title="No vendors yet"
        description="Vendors are synced from the ERP. Once they arrive they'll be listed here."
      />
    );
  }

  return (
    <VendorTable
      vendors={vendors}
      page={pagination}
      buildPageHref={(next) => buildPageHref("/vendors", next)}
    />
  );
}
