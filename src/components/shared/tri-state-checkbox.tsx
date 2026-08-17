"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

/**
 * A checkbox that reads as *partly* checked rather than checked.
 *
 * Base UI renders `Checkbox.Indicator` for the indeterminate state as well as
 * the checked one, and the generated `ui/checkbox` only knows how to draw a
 * tick — so a parent checkbox covering a half-selected group looked identical
 * to one covering a fully selected group. `ui/` is generated and not to be
 * hand-edited, so the partial state is drawn here instead: the tick is hidden
 * and a dash takes its place, which is what distinguishes "some of this group"
 * from "all of it".
 *
 * `indeterminate` wins over `checked` in Base UI, and sets `aria-checked="mixed"`,
 * so the announced state is right without anything extra here.
 */
export function TriStateCheckbox({
  className,
  ...props
}: React.ComponentProps<typeof Checkbox>) {
  return (
    <Checkbox
      className={cn(
        "data-indeterminate:border-primary data-indeterminate:bg-primary data-indeterminate:text-primary-foreground",
        "data-indeterminate:[&_[data-slot=checkbox-indicator]]:hidden",
        // `before` rather than `after`: the base component already spends
        // `after` on the enlarged pointer target.
        "data-indeterminate:before:absolute data-indeterminate:before:top-1/2 data-indeterminate:before:left-1/2 data-indeterminate:before:h-0.5 data-indeterminate:before:w-2 data-indeterminate:before:-translate-x-1/2 data-indeterminate:before:-translate-y-1/2 data-indeterminate:before:rounded-full data-indeterminate:before:bg-current",
        className,
      )}
      {...props}
    />
  );
}
