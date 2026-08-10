"use client";

import { useQuery } from "@tanstack/react-query";
import { SearchXIcon } from "lucide-react";
import Link from "next/link";

import { CanvassingTable } from "@/components/canvassing/canvassing-table";
import { ErrorAlert } from "@/components/shared/query-states";
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
import { buildPageHref } from "@/lib/page-href";
import { canvassingListQuery } from "@/modules/canvassing";

export function CanvassingListView({ page }: { page: number }) {
  const { data, isPending, isError, error } = useQuery(
    canvassingListQuery(page),
  );

  if (isError) {
    return <ErrorAlert title="Couldn't load canvassing" error={error} />;
  }

  if (isPending) {
    // Eight columns, matching the table it stands in for.
    return <TableSkeleton columns={8} />;
  }

  const { data: entries, pagination } = data;

  if (entries.length === 0) {
    // Richer than the shared `EmptyState` on purpose: there is a next step to
    // point at, since canvassing is only ever started from a request.
    return (
      <Card>
        <CardContent>
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <SearchXIcon />
              </EmptyMedia>
              <EmptyTitle>No canvassing in progress</EmptyTitle>
              <EmptyDescription>
                Canvassing cases appear here once a Purchase Request reaches the
                sourcing stage. There&apos;s nothing awaiting vendor quotes
                right now.
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
    );
  }

  return (
    <CanvassingTable
      entries={entries}
      page={pagination}
      buildPageHref={(next) => buildPageHref("/canvassing", next)}
    />
  );
}
