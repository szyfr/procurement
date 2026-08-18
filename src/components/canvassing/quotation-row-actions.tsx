"use client";

import { EyeIcon, MoreVerticalIcon, PencilIcon } from "lucide-react";

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

/** Per-row menu for one quote in the comparison. The detail sheet and edit
 *  dialog it opens are owned by the card, not by this. */
export function QuotationRowActions({
  vendorName,
  canView,
  canEdit,
  onView,
  onEdit,
}: {
  /** Null when the vendor join missed, which the label reads as "unknown". */
  vendorName: string | null;
  /** Reading one quote in full and editing it are separate grants upstream. */
  canView: boolean;
  canEdit: boolean;
  onView: () => void;
  onEdit: () => void;
}) {
  // With neither grant the menu would open empty, so the trigger goes too.
  if (!canView && !canEdit) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Actions for ${vendorName ?? "unknown vendor"} quote`}
          />
        }
      >
        <MoreVerticalIcon />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className={cn(dropdownContentClass, "min-w-[196px]")}
      >
        {canView ? (
          <DropdownMenuItem className={dropdownItemClass} onClick={onView}>
            <EyeIcon />
            View details
          </DropdownMenuItem>
        ) : null}
        {canEdit ? (
          <DropdownMenuItem className={dropdownItemClass} onClick={onEdit}>
            <PencilIcon />
            Edit quote
          </DropdownMenuItem>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
