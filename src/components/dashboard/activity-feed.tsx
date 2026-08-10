import { HistoryIcon } from "lucide-react";

import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import type { ActivityEntry } from "@/lib/types";

export function ActivityFeed({ entries }: { entries: ActivityEntry[] }) {
  if (entries.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia
            variant="icon"
            className="mb-4 size-11 rounded-xl [&_svg:not([class*='size-'])]:size-[22px]"
          >
            <HistoryIcon />
          </EmptyMedia>
          <EmptyTitle className="text-base font-bold">
            No recent activity
          </EmptyTitle>
          <EmptyDescription className="max-w-[400px] text-[13px] leading-normal">
            Activity will appear here as requests move through the workflow.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <ul className="divide-y">
      {entries.map((entry) => (
        <li key={entry.id} className="flex gap-3 px-4 py-3">
          <span
            aria-hidden
            className="mt-1.5 size-2 shrink-0 rounded-full border border-muted-foreground/50"
          />
          <div className="flex flex-col gap-0.5">
            <p className="text-sm">{entry.description}</p>
            <p className="text-xs text-muted-foreground">{entry.timestamp}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
