"use client";

import { useQuery } from "@tanstack/react-query";
import { InboxIcon, SearchIcon } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import * as React from "react";

import { PurchaseRequestCard } from "@/components/purchase-requests/pr-card";
import { PurchaseRequestCardsSkeleton } from "@/components/purchase-requests/pr-cards-skeleton";
import { StatusLegend } from "@/components/purchase-requests/pr-status-legend";
import { PurchaseRequestTable } from "@/components/purchase-requests/pr-table";
import type { ListView } from "@/components/purchase-requests/view-toggle";
import { DataToolbar } from "@/components/shared/data-toolbar";
import { EmptyState, ErrorAlert } from "@/components/shared/query-states";
import { TableSkeleton } from "@/components/shared/table-skeleton";
import { buildPageHref } from "@/lib/page-href";
import {
  departmentOptionsQuery,
  purchaseRequestListQuery,
  usePurchaseRequestUpdates,
} from "@/modules/purchase-requests";

/**
 * Purchase request list, fetched from the BFF in the browser via TanStack
 * Query.
 *
 * Search, priority and department are wired to the `search`, `priority` and
 * `departments` URL params — the URL is the source of truth, so the list
 * stays linkable/bookmarkable and survives reload. Status and Date stay
 * presentational until the backend supports filtering on them.
 */

const statusFilter = {
  label: "Status",
  options: [
    "Draft",
    "Canvassing",
    "PO Created",
    "Partially Completed",
    "Completed",
    "Rejected",
  ],
};

/** The backend's own values; the labels are the display copy for them. */
const priorityOptions = [
  { label: "High", value: "high" },
  { label: "Normal", value: "normal" },
  { label: "Low", value: "low" },
];

const dateFilter = {
  label: "Date",
  options: ["Last 7 days", "Last 30 days", "Last 90 days"],
};

const SEARCH_DEBOUNCE_MS = 300;

export function PurchaseRequestListView({
  view,
  page,
  search,
  priority,
  departments,
}: {
  view: ListView;
  page: number;
  search: string;
  priority: string;
  departments: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  usePurchaseRequestUpdates();

  const [searchInput, setSearchInput] = React.useState(search);

  // Keeps the field in sync when the URL changes from elsewhere, e.g. back
  // navigation or a page link.
  React.useEffect(() => {
    setSearchInput(search);
  }, [search]);

  /** Applies filter changes to the URL; any change restarts pagination. */
  const updateParams = React.useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams);

      for (const [key, value] of Object.entries(updates)) {
        if (value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      }
      params.delete("page");

      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  // biome-ignore lint/correctness/useExhaustiveDependencies: only typing should reset the debounce timer — reacting to `search` or `updateParams` here would restart it every URL change.
  React.useEffect(() => {
    if (searchInput === search) return;

    const timeout = setTimeout(() => {
      updateParams({ search: searchInput || null });
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timeout);
  }, [searchInput]);

  const filters = { search: search || undefined, priority, departments };
  const hasActiveFilters = Boolean(search || priority || departments);

  const { data, isPending, isError, error } = useQuery(
    purchaseRequestListQuery(page, filters),
  );

  // Department options only shape a presentational filter, so this query's
  // failure is deliberately swallowed — it must not take the list down with
  // it, and an empty option list is the same fallback as before.
  const departmentOptions = useQuery(departmentOptionsQuery());

  const departmentSelectOptions = React.useMemo(
    () =>
      departmentOptions.data?.data.map((department) => ({
        label: department.title,
        value: department._id,
      })) ?? [],
    [departmentOptions.data],
  );

  const toolbarFilters = [
    statusFilter,
    {
      label: "Priority",
      options: priorityOptions,
      value: priority || null,
      onValueChange: (value: string | null) =>
        updateParams({ priority: value }),
    },
    {
      label: "Department",
      options: departmentSelectOptions,
      value: departments || null,
      onValueChange: (value: string | null) =>
        updateParams({ departments: value }),
    },
    dateFilter,
  ];

  /** Keeps the current view (cards/table) and filters intact while changing pages. */
  const tablePageHref = React.useCallback(
    (targetPage: number) => {
      const params = new URLSearchParams(searchParams);
      params.set("view", "table");
      return buildPageHref(pathname, targetPage, params);
    },
    [pathname, searchParams],
  );

  return (
    <>
      <DataToolbar
        placeholder="Filter requests…"
        filters={toolbarFilters}
        searchValue={searchInput}
        onSearchChange={setSearchInput}
      />

      <StatusLegend />

      {isError ? (
        <ErrorAlert title="Couldn't load purchase requests" error={error} />
      ) : isPending ? (
        view === "table" ? (
          <TableSkeleton columns={9} />
        ) : (
          <PurchaseRequestCardsSkeleton />
        )
      ) : data.data.length === 0 ? (
        hasActiveFilters ? (
          <EmptyState
            variant="no-results"
            icon={<SearchIcon />}
            title="No matching purchase requests"
            description="Try a different search term or clear the filters."
          />
        ) : (
          <EmptyState
            icon={<InboxIcon />}
            title="No purchase requests yet"
            description="Create one to start tracking a purchase from draft through delivery."
          />
        )
      ) : view === "table" ? (
        <PurchaseRequestTable
          requests={data.data}
          page={data.pagination}
          buildPageHref={tablePageHref}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {data.data.map((request) => (
            <PurchaseRequestCard key={request._id} request={request} />
          ))}
        </div>
      )}
    </>
  );
}
