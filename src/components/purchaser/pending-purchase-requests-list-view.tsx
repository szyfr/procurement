"use client";

import { useQuery } from "@tanstack/react-query";
import { ClipboardCheckIcon, SearchIcon } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import * as React from "react";

import { PurchaseRequestTable } from "@/components/purchase-requests/pr-table";
import { DataToolbar } from "@/components/shared/data-toolbar";
import { EmptyState, ErrorAlert } from "@/components/shared/query-states";
import { TableSkeleton } from "@/components/shared/table-skeleton";
import { buildPageHref } from "@/lib/page-href";
import { departmentOptionsQuery } from "@/modules/purchase-requests";
import { pendingPurchaseRequestsQuery } from "@/modules/purchaser";

/**
 * `GET /purchaser`, fixed to pending status upstream — there is no status
 * dropdown here the way the main Purchase Requests list has one. Search,
 * priority and department are wired to the `search`, `priority` and
 * `departments` URL params, same convention as that list, so this queue stays
 * linkable and survives reload.
 */

const priorityOptions = [
  { label: "High", value: "high" },
  { label: "Normal", value: "normal" },
  { label: "Low", value: "low" },
];

const SEARCH_DEBOUNCE_MS = 300;

export function PendingPurchaseRequestsListView({
  page,
  search,
  priority,
  departments,
}: {
  page: number;
  search: string;
  priority: string;
  departments: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [searchInput, setSearchInput] = React.useState(search);

  // Keeps the field in sync when the URL changes from elsewhere, e.g. back
  // navigation or a page link.
  React.useEffect(() => {
    setSearchInput(search);
  }, [search]);

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

  const filters = {
    search: search || undefined,
    priority: priority || undefined,
    departments: departments || undefined,
  };
  const hasActiveFilters = Boolean(search || priority || departments);

  const { data, isPending, isError, error } = useQuery(
    pendingPurchaseRequestsQuery(page, filters),
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
  ];

  const pageHref = React.useCallback(
    (targetPage: number) => {
      const params = new URLSearchParams(searchParams);
      params.delete("page");
      return buildPageHref(pathname, targetPage, params);
    },
    [pathname, searchParams],
  );

  return (
    <>
      <DataToolbar
        placeholder="Filter pending purchase requests…"
        filters={toolbarFilters}
        searchValue={searchInput}
        onSearchChange={setSearchInput}
      />

      {isError ? (
        <ErrorAlert
          title="Couldn't load pending purchase requests"
          error={error}
        />
      ) : isPending ? (
        <TableSkeleton columns={9} />
      ) : data.data.length === 0 ? (
        hasActiveFilters ? (
          <EmptyState
            variant="no-results"
            icon={<SearchIcon />}
            title="No matching pending purchase requests"
            description="Try a different search term or clear the filters."
          />
        ) : (
          <EmptyState
            icon={<ClipboardCheckIcon />}
            title="Nothing pending"
            description="Requests awaiting a vendor appear here once they're submitted."
          />
        )
      ) : (
        <PurchaseRequestTable
          requests={data.data}
          page={data.pagination}
          buildPageHref={pageHref}
        />
      )}
    </>
  );
}
