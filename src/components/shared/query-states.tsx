import { TriangleAlertIcon } from "lucide-react";
import type * as React from "react";

import { Card } from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { cn, errorMessage } from "@/lib/utils";

/**
 * The states every BFF-backed screen can land in besides rendering its data.
 * Kept together so each view reads as one query → one of a few outcomes.
 */

export function ErrorAlert({
  title,
  error,
}: {
  title: string;
  /** Whatever the query rejected with; anything unrecognized gets fallback copy. */
  error: unknown;
}) {
  return (
    // A panel rather than shadcn's `Alert`: a failed query takes the place of
    // the content it was going to render, so it reads as a surface, not as a
    // note attached to one.
    <div
      role="alert"
      className="flex gap-3 rounded-xl border border-status-danger-border bg-status-danger-subtle p-4"
    >
      <TriangleAlertIcon
        aria-hidden
        className="mt-px size-[18px] shrink-0 text-destructive"
      />
      <div className="flex flex-col gap-1">
        <p className="font-heading text-sm font-semibold text-status-danger-fg">
          {title}
        </p>
        <p className="text-[13px] text-status-danger-subtle-fg">
          {errorMessage(error)}
        </p>
      </div>
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  variant = "empty",
}: {
  icon: React.ReactNode;
  title: string;
  description: React.ReactNode;
  /**
   * `no-results` is the shorter card a list falls back to when filters
   * excluded everything — the collection exists, this view of it doesn't.
   */
  variant?: "empty" | "no-results";
}) {
  return (
    <Card className="p-0">
      <Empty
        className={cn("gap-0 px-8", variant === "empty" ? "py-14" : "py-12")}
      >
        <EmptyHeader className="max-w-none gap-2">
          <EmptyMedia
            variant="icon"
            className="mb-4 size-11 rounded-xl [&_svg:not([class*='size-'])]:size-[22px]"
          >
            {icon}
          </EmptyMedia>
          <EmptyTitle className="text-base font-bold">{title}</EmptyTitle>
          <EmptyDescription className="max-w-[400px] text-[13px] leading-normal">
            {description}
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    </Card>
  );
}
