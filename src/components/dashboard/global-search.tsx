"use client";

import { useQuery } from "@tanstack/react-query";
import { SearchIcon, XIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";

import { useCan } from "@/components/providers/permissions-provider";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { PERMISSIONS } from "@/modules/auth/constants/permissions";
import {
  fetchPurchaseRequests,
  purchaseRequestKeys,
  purchaseRequestStatusLabels,
} from "@/modules/purchase-requests";

const SEARCH_DEBOUNCE_MS = 300;
const MIN_QUERY_LENGTH = 2;
const MAX_RESULTS = 5;

/**
 * Global search. Scoped to Purchase Requests: the query goes straight to the
 * PR list endpoint's `search` param, which only matches `title` and
 * `justification` today — not PR number or requester/department name. That's
 * backend behavior, not something to fake here.
 *
 * Being scoped to that one endpoint, it disappears entirely without the grant
 * for it — a search box that can only ever answer "couldn't load results" is
 * worse than no search box.
 */
export function GlobalSearch({ className }: { className?: string }) {
  const canSearchRequests = useCan(PERMISSIONS.purchaseRequest.index);
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [debouncedQuery, setDebouncedQuery] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedQuery(query);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [query]);

  const trimmedQuery = debouncedQuery.trim();
  const searchEnabled = trimmedQuery.length >= MIN_QUERY_LENGTH;

  const { data, isFetching, isError } = useQuery({
    queryKey: [...purchaseRequestKeys.all, "nav-search", trimmedQuery],
    queryFn: ({ signal }) =>
      fetchPurchaseRequests({
        search: trimmedQuery,
        pageSize: MAX_RESULTS,
        signal,
      }),
    enabled: searchEnabled && canSearchRequests,
  });

  const results = data?.data ?? [];

  // Close when focus or a click lands outside the search box.
  React.useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  function clear() {
    setQuery("");
    setDebouncedQuery("");
    setOpen(false);
    inputRef.current?.focus();
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      clear();
    }
    if (event.key === "Enter" && results.length > 0) {
      event.preventDefault();
      router.push(`/purchase-requests/${results[0]._id}`);
      setOpen(false);
    }
  }

  const showDropdown = open && query.trim().length >= MIN_QUERY_LENGTH;

  if (!canSearchRequests) return null;

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <InputGroup className="h-8 rounded-md bg-accent text-[13px]">
        <InputGroupInput
          ref={inputRef}
          // Not type="search" — the native clear affordance would sit beside
          // our own clear button.
          type="text"
          value={query}
          placeholder="Search purchase requests..."
          aria-label="Search purchase requests"
          aria-expanded={showDropdown}
          aria-controls="global-search-results"
          role="combobox"
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
        />
        <InputGroupAddon>
          <SearchIcon />
        </InputGroupAddon>
        {query ? (
          <InputGroupAddon align="inline-end">
            <InputGroupButton
              size="icon-xs"
              aria-label="Clear search"
              onClick={clear}
            >
              <XIcon />
            </InputGroupButton>
          </InputGroupAddon>
        ) : null}
      </InputGroup>

      {showDropdown ? (
        <div
          id="global-search-results"
          className="absolute top-full right-0 left-0 z-50 mt-1 overflow-hidden rounded-lg border bg-popover text-popover-foreground shadow-md"
        >
          {isFetching ? (
            <div className="flex items-center justify-center gap-2 px-4 py-6 text-xs text-muted-foreground">
              <Spinner className="size-3.5" />
              Searching…
            </div>
          ) : isError ? (
            <div className="px-4 py-6 text-center text-xs text-muted-foreground">
              Couldn&apos;t load results. Try again.
            </div>
          ) : results.length === 0 ? (
            <div className="px-4 py-6 text-center">
              <p className="text-xs text-foreground">
                No results for &ldquo;{query}&rdquo;
              </p>
              <p className="text-xs text-muted-foreground">
                Try a purchase request title or justification keyword
              </p>
            </div>
          ) : (
            <>
              <p className="px-3 py-2 text-xs text-muted-foreground">
                Purchase Requests
              </p>
              <ul>
                {results.map((request) => (
                  <li key={request._id}>
                    <Link
                      href={`/purchase-requests/${request._id}`}
                      onClick={() => setOpen(false)}
                      className="flex flex-col gap-0.5 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                    >
                      <span className="truncate font-medium">{request.no}</span>
                      <span className="truncate text-muted-foreground">
                        {request.title}
                      </span>
                      <span className="truncate text-xs text-muted-foreground">
                        {request.department_name ?? "—"} ·{" "}
                        {request.requester_name ?? "—"} ·{" "}
                        {purchaseRequestStatusLabels[request.status]}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
