import { BellIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Popover,
  PopoverContent,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";

/**
 * Notification bell.
 *
 * There is no notifications endpoint on the backend — no model, no collection,
 * no delivery mechanism. This previously rendered five hardcoded entries from
 * `src/data/notifications.ts`: every user saw the same invented messages and
 * the same unread count of 2, "mark as read" was lost on reload, and each item
 * linked to a PR number like `PR-2026-0114` while the detail route keys on a
 * Mongo `_id`, so every click 404'd.
 *
 * The bell stays so the affordance does not move once there is something to
 * put behind it; the panel says what is true today. Same treatment as the
 * Recent Activity feed on the dashboard.
 */
export function NotificationsMenu() {
  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button variant="ghost" size="icon" aria-label="Notifications" />
        }
      >
        <BellIcon />
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center px-4 py-2.5">
          <PopoverTitle className="text-xs font-medium">
            Notifications
          </PopoverTitle>
        </div>
        <Separator />
        <Empty className="gap-0 px-6 py-10">
          <EmptyHeader className="max-w-none gap-2">
            <EmptyMedia
              variant="icon"
              className="mb-3 size-10 rounded-xl [&_svg:not([class*='size-'])]:size-5"
            >
              <BellIcon />
            </EmptyMedia>
            <EmptyTitle className="text-sm font-semibold">
              No notifications
            </EmptyTitle>
            <EmptyDescription className="text-xs leading-normal">
              You&apos;ll be notified here as requests move through the
              workflow.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </PopoverContent>
    </Popover>
  );
}
