"use client";

import { cn } from "@/lib/utils";

/**
 * Small pieces the roles list, the form dialog and the detail sheet all draw
 * the same way.
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
