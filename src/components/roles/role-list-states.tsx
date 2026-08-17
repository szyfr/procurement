"use client";

import {
  CircleXIcon,
  PlusIcon,
  SearchIcon,
  ShieldCheckIcon,
} from "lucide-react";

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
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * The four non-default states of the roles list. Nothing here fetches — the
 * page selects one with `?state=` so each can be reviewed on its own.
 */

/** Widths matching the real row: tile, name, description, last updated. */
const skeletonRow = ["w-[150px]", "flex-1", "w-20"] as const;

export function RolesLoading() {
  return (
    <Card aria-busy="true">
      {/* Absolutely positioned by `sr-only`, so it announces without taking space. */}
      <output className="sr-only">Loading roles…</output>
      <CardContent className="px-0">
        <div className="flex items-center gap-3 border-b bg-accent px-3 py-2.5">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-24" />
          <Skeleton className="ml-auto h-3 w-16" />
        </div>
        {Array.from({ length: 6 }, (_, row) => (
          <div
            // biome-ignore lint/suspicious/noArrayIndexKey: fixed-length placeholder rows
            key={row}
            className="flex items-center gap-3 border-b px-3 py-3 last:border-0"
          >
            <Skeleton className="size-6.5 shrink-0 rounded-md" />
            {skeletonRow.map((width) => (
              <Skeleton
                key={width}
                className={cn("h-2.5", width)}
                // Rows fade in sequence, which reads as loading rather than as
                // one block flashing.
                style={{ animationDelay: `${row * 90}ms` }}
              />
            ))}
          </div>
        ))}
      </CardContent>
      <div className="px-3 pt-3 text-xs text-muted-foreground">
        Loading roles…
      </div>
    </Card>
  );
}

/** `onCreate` is null when the user can't create roles — the call to action goes with it. */
export function RolesEmpty({ onCreate }: { onCreate: (() => void) | null }) {
  return (
    <Card>
      <CardContent className="px-0">
        <Empty className="px-8 py-14">
          <EmptyHeader>
            <EmptyMedia variant="icon" className="size-11 rounded-xl">
              <ShieldCheckIcon className="size-5" />
            </EmptyMedia>
            <EmptyTitle className="text-base font-semibold">
              No roles yet
            </EmptyTitle>
            <EmptyDescription className="max-w-[400px]">
              Roles group the permissions a person needs to work in Procura.
              {onCreate
                ? " Create the first one and assign it to users afterwards."
                : " None have been created yet."}
            </EmptyDescription>
          </EmptyHeader>
          {onCreate ? (
            <EmptyContent>
              <Button onClick={onCreate}>
                <PlusIcon data-icon="inline-start" />
                New role
              </Button>
            </EmptyContent>
          ) : null}
        </Empty>
      </CardContent>
    </Card>
  );
}

export function RolesNoResults({
  query,
  totalRoles,
  onClear,
}: {
  query: string;
  totalRoles: number;
  onClear: () => void;
}) {
  return (
    <Card>
      <CardContent className="px-0">
        <Empty className="px-8 py-12">
          <EmptyHeader>
            <EmptyMedia variant="icon" className="size-10 rounded-xl">
              <SearchIcon className="size-4.5" />
            </EmptyMedia>
            <EmptyTitle className="text-base font-semibold">
              {query
                ? `No roles match “${query}”`
                : "No roles match these filters"}
            </EmptyTitle>
            <EmptyDescription className="max-w-[400px]">
              Check the spelling, or clear the filters to see all {totalRoles}{" "}
              roles.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button variant="outline" onClick={onClear}>
              Clear search &amp; filters
            </Button>
          </EmptyContent>
        </Empty>
      </CardContent>
    </Card>
  );
}

export function RolesError({ onRetry }: { onRetry: () => void }) {
  return (
    <Card className="border-status-danger-border bg-status-danger-subtle">
      <CardContent className="px-0">
        <Empty className="px-8 py-12">
          <EmptyHeader>
            <EmptyMedia
              variant="icon"
              className="size-10 rounded-xl bg-status-danger-bg text-destructive"
            >
              <CircleXIcon className="size-4.5" />
            </EmptyMedia>
            <EmptyTitle className="text-base font-semibold text-destructive">
              Roles could not be loaded
            </EmptyTitle>
            <EmptyDescription className="max-w-[400px] text-status-danger-subtle-fg">
              The permissions service did not respond. Nothing was changed — try
              again in a moment.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button
              variant="outline"
              className="border-status-danger-border bg-background"
              onClick={onRetry}
            >
              Retry
            </Button>
          </EmptyContent>
        </Empty>
      </CardContent>
    </Card>
  );
}
