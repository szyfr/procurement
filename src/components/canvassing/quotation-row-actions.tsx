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
  vendorId,
  onView,
  onEdit,
}: {
  /** No vendor join upstream, so the id is what names the quote in the label. */
  vendorId: string;
  onView: () => void;
  onEdit: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Actions for vendor ${vendorId} quote`}
          />
        }
      >
        <MoreVerticalIcon />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className={cn(dropdownContentClass, "min-w-[196px]")}
      >
        <DropdownMenuItem className={dropdownItemClass} onClick={onView}>
          <EyeIcon />
          View details
        </DropdownMenuItem>
        <DropdownMenuItem className={dropdownItemClass} onClick={onEdit}>
          <PencilIcon />
          Edit quote
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
