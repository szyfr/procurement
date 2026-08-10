"use client";

import { cn } from "@/lib/utils";

/**
 * Small pieces the roles list, the form dialog and the detail sheet all draw
 * the same way. Kept here so a grant count reads identically wherever it
 * appears.
 */

export function SectionLabel({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p
      className={cn(
        "text-xs font-semibold tracking-[0.06em] text-muted-foreground uppercase",
        className,
      )}
      {...props}
    />
  );
}

/**
 * `3 / 5` grant counter. Tinted once anything is granted, so a module's state
 * is readable without expanding it.
 */
export function GrantChip({
  granted,
  total,
  highlight = granted > 0,
  className,
}: {
  granted: number;
  total: number;
  /** The sheet tints only fully granted modules; the dialog tints any grant. */
  highlight?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-5 shrink-0 items-center rounded-md border px-1.5 text-xs font-semibold tabular-nums",
        highlight
          ? "border-status-success-border bg-status-success-bg text-status-success-fg"
          : "border-border bg-muted text-muted-foreground",
        className,
      )}
    >
      {granted} / {total}
    </span>
  );
}
