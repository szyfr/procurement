"use client";

import { useQuery } from "@tanstack/react-query";
import { SearchIcon, TruckIcon } from "lucide-react";

import { DataToolbar } from "@/components/shared/data-toolbar";
import { EmptyState, ErrorAlert } from "@/components/shared/query-states";
import { TableSkeleton } from "@/components/shared/table-skeleton";
import { VendorTable } from "@/components/vendors/vendor-table";
import { useListSearch } from "@/hooks/use-list-search";
import { vendorListQuery } from "@/modules/vendors";

/**
 * Vendor list, fetched from the BFF in the browser via TanStack Query.
 *
 * Upstream matches `search` against vendor name and number; there is nothing
 * else to filter on, so the toolbar carries no dropdowns.
 */
export function VendorListView({
  page,
  search,
}: {
  page: number;
  search: string;
}) {
  const { searchInput, setSearchInput, pageHref } = useListSearch(search);

  const { data, isPending, isError, error } = useQuery(
    vendorListQuery(page, { search: search || undefined }),
  );

  return (
    <>
      <DataToolbar
        placeholder="Filter vendors…"
        filters={[]}
        searchValue={searchInput}
        onSearchChange={setSearchInput}
      />

      {isError ? (
        <ErrorAlert title="Couldn't load vendors" error={error} />
      ) : isPending ? (
        <TableSkeleton />
      ) : data.data.length === 0 ? (
        search ? (
          <EmptyState
            variant="no-results"
            icon={<SearchIcon />}
            title="No matching vendors"
            description="Try a different vendor name or number."
          />
        ) : (
          <EmptyState
            icon={<TruckIcon />}
            title="No vendors yet"
            description="Vendors are synced from the ERP. Once they arrive they'll be listed here."
          />
        )
      ) : (
        <VendorTable
          vendors={data.data}
          page={data.pagination}
          buildPageHref={pageHref}
        />
      )}
    </>
  );
}
