"use client";

import { LayoutGridIcon, TableIcon } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import {
  type ListView,
  rememberListView,
} from "@/components/purchase-requests/view-preference";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";

/**
 * Switches the purchase request list between card and table views. Backed by
 * the URL so the choice survives reload and can be linked to, and mirrored
 * into a cookie so arriving at the bare `/purchase-requests` — from the
 * sidebar, a bookmark, a new tab — reopens the view last chosen.
 *
 * Both buttons name the view explicitly, cards included. Cards used to be the
 * view the URL expressed by omission, but that now means "ask the cookie", and
 * a click has to beat its own navigation to the cookie for that to land on the
 * right view. An explicit param decides it in the URL, where the server reads
 * it first.
 */
export function ViewToggle({ view }: { view: ListView }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function hrefFor(next: ListView) {
    const params = new URLSearchParams(searchParams);
    params.set("view", next);

    return `${pathname}?${params.toString()}`;
  }

  return (
    <ButtonGroup aria-label="List view">
      <Button
        variant={view === "cards" ? "secondary" : "outline"}
        size="sm"
        aria-current={view === "cards" ? "true" : undefined}
        onClick={() => rememberListView("cards")}
        render={<Link href={hrefFor("cards")} />}
        nativeButton={false}
      >
        <LayoutGridIcon data-icon="inline-start" />
        Cards
      </Button>
      <Button
        variant={view === "table" ? "secondary" : "outline"}
        size="sm"
        aria-current={view === "table" ? "true" : undefined}
        onClick={() => rememberListView("table")}
        render={<Link href={hrefFor("table")} />}
        nativeButton={false}
      >
        <TableIcon data-icon="inline-start" />
        Table
      </Button>
    </ButtonGroup>
  );
}
