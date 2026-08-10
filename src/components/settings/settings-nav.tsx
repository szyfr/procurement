"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { settingsNav } from "@/data/navigation";
import { cn } from "@/lib/utils";

export function SettingsNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Settings">
      <ul className="flex gap-1 rounded-lg bg-muted p-1 lg:flex-col">
        {settingsNav.map((entry) => {
          const isActive = pathname === entry.url;

          return (
            <li key={entry.url}>
              <Link
                href={entry.url}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "block rounded-md px-3 py-1.5 text-[13px] transition-colors",
                  isActive
                    ? "bg-background font-medium text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {entry.title}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
