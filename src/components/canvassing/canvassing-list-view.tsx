"use client";

import { useQuery } from "@tanstack/react-query";
import { SearchIcon, SearchXIcon } from "lucide-react";
import Link from "next/link";

import { CanvassingTable } from "@/components/canvassing/canvassing-table";
import { DataToolbar } from "@/components/shared/data-toolbar";
import { EmptyState, ErrorAlert } from "@/components/shared/query-states";
import { TableSkeleton } from "@/components/shared/table-skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { useListSearch } from "@/hooks/use-list-search";
import { canvassingListQuery } from "@/modules/canvassing";

/**
 * Upstream matches `search` against the item's title and description, and
 * offers nothing else to narrow the list by, so the toolbar carries no
 * dropdowns.
 */
export function CanvassingListView({
  page,
  search,
}: {
  page: number;
  search: string;
}) {
  const { searchInput, setSearchInput, pageHref } = useListSearch(search);

  const { data, isPending, isError, error } = useQuery(
    canvassingListQuery(page, { search: search || undefined }),
  );

  return (
    <>
      <DataToolbar
        placeholder="Filter canvassing items…"
        filters={[]}
        searchValue={searchInput}
        onSearchChange={setSearchInput}
      />

      {isError ? (
        <ErrorAlert title="Couldn't load canvassing" error={error} />
      ) : isPending ? (
        // Eight columns, matching the table it stands in for.
        <TableSkeleton columns={8} />
      ) : data.data.length === 0 ? (
        search ? (
          <EmptyState
            variant="no-results"
            icon={<SearchIcon />}
            title="No matching canvassing items"
            description="Try a different item title or description."
          />
        ) : (
          // Richer than the shared `EmptyState` on purpose: there is a next
          // step to point at, since canvassing is only ever started from a
          // request.
          <Card>
            <CardContent>
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <SearchXIcon />
                  </EmptyMedia>
                  <EmptyTitle>No canvassing in progress</EmptyTitle>
                  <EmptyDescription>
                    Canvassing cases appear here once a Purchase Request reaches
                    the sourcing stage. There&apos;s nothing awaiting vendor
                    quotes right now.
                  </EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                  <Button
                    variant="outline"
                    size="sm"
                    render={<Link href="/purchase-requests" />}
                    nativeButton={false}
                  >
                    View Purchase Requests Awaiting Canvassing
                  </Button>
                </EmptyContent>
              </Empty>
            </CardContent>
          </Card>
        )
      ) : (
        <CanvassingTable
          entries={data.data}
          page={data.pagination}
          buildPageHref={pageHref}
        />
      )}
    </>
  );
}
