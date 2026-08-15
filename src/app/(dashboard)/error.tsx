"use client";

import { RotateCcwIcon, TriangleAlertIcon } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

/**
 * Catches anything a dashboard page throws while rendering on the server —
 * most likely `getCurrentUser()` on an expired session, which throws rather
 * than returning `null`.
 *
 * The digest is surfaced deliberately: it is the only handle support has to
 * match a user's report against the server log, since the message itself is
 * withheld from the browser in production.
 */
export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <Card className="p-0">
      <Empty className="gap-0 px-8 py-14">
        <EmptyHeader className="max-w-none gap-2">
          <EmptyMedia
            variant="icon"
            className="mb-4 size-11 rounded-xl bg-status-danger-subtle text-destructive [&_svg:not([class*='size-'])]:size-[22px]"
          >
            <TriangleAlertIcon />
          </EmptyMedia>
          <EmptyTitle className="text-base font-bold">
            Something went wrong
          </EmptyTitle>
          <EmptyDescription className="max-w-[400px] text-[13px] leading-normal">
            This page couldn&apos;t be loaded. Try again — if it keeps
            happening, sign out and back in.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent className="mt-6 gap-3">
          <div className="flex items-center justify-center gap-2">
            <Button size="sm" onClick={reset}>
              <RotateCcwIcon data-icon="inline-start" />
              Try again
            </Button>
            <Button
              variant="outline"
              size="sm"
              render={<Link href="/dashboard" />}
              nativeButton={false}
            >
              Back to dashboard
            </Button>
          </div>
          {error.digest ? (
            <p className="font-mono text-xs text-muted-foreground">
              Reference: {error.digest}
            </p>
          ) : null}
        </EmptyContent>
      </Empty>
    </Card>
  );
}
