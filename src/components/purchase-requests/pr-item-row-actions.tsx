"use client";

import { MoreVerticalIcon, PackageIcon } from "lucide-react";

import {
  dropdownContentClass,
  dropdownItemClass,
} from "@/components/shared/menu-classes";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

/**
 * Per-row menu for one item on the request. Only actions that apply to a
 * single line live here — the checkbox column above owns everything that
 * operates on a selection.
 *
 * The dialog it opens is owned by the section, not by this.
 */
export function PurchaseRequestItemRowActions({
  itemLabel,
  onRecordPartialDelivery,
}: {
  /** Falls back to the material id when the join missed, as the table does. */
  itemLabel: string;
  onRecordPartialDelivery: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Actions for ${itemLabel}`}
          />
        }
      >
        <MoreVerticalIcon />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className={cn(dropdownContentClass, "min-w-[196px]")}
      >
        <DropdownMenuItem
          className={dropdownItemClass}
          onClick={onRecordPartialDelivery}
        >
          <PackageIcon />
          Record partial delivery
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
