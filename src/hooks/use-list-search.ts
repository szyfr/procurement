"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import * as React from "react";

import { buildPageHref } from "@/lib/page-href";

/**
 * Free-text list search, wired to the `search` URL param.
 *
 * The URL stays the source of truth for list state, so a filtered list is
 * linkable and survives reload. The field is local so typing stays responsive
 * and only the debounced value reaches the router — which is also what keeps
 * the query from refiring per keystroke.
 */

const SEARCH_DEBOUNCE_MS = 300;

export function useListSearch(search: string) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [searchInput, setSearchInput] = React.useState(search);

  // Keeps the field in sync when the URL changes from elsewhere, e.g. back
  // navigation or a page link.
  React.useEffect(() => {
    setSearchInput(search);
  }, [search]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: only typing should reset the debounce timer — reacting to `search`, the router or the params here would restart it on every URL change.
  React.useEffect(() => {
    if (searchInput === search) return;

    const timeout = setTimeout(() => {
      const params = new URLSearchParams(searchParams);

      if (searchInput) {
        params.set("search", searchInput);
      } else {
        params.delete("search");
      }
      // A new term restarts pagination — page 4 of the old results means
      // nothing against the new ones.
      params.delete("page");

      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timeout);
  }, [searchInput]);

  /** Pagination href that carries the active search. */
  const pageHref = React.useCallback(
    (targetPage: number) => {
      const params = new URLSearchParams(searchParams);
      // `buildPageHref` only ever sets `page`, so the current one has to go or
      // it would survive a link back to page 1.
      params.delete("page");
      return buildPageHref(pathname, targetPage, params);
    },
    [pathname, searchParams],
  );

  return { searchInput, setSearchInput, pageHref };
}
