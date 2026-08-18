"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { CheckIcon, ChevronsUpDownIcon, SearchIcon } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Spinner } from "@/components/ui/spinner";
import type { Paginated } from "@/lib/api/pagination";
import { LOOKUP_PAGE_SIZE, type SelectedOption } from "@/lib/lookup";
import { cn, errorMessage } from "@/lib/utils";

/**
 * Reference-data picker for collections too large to put in a `<Select>` —
 * the material catalog runs to roughly 1,900 rows and vendors to nearly 300.
 *
 * Results are pulled a page at a time from the BFF and appended as the list is
 * scrolled, with a debounced search box to narrow them. Paging, caching and
 * request cancellation are TanStack Query's `useInfiniteQuery`.
 *
 * It is generic over the record the lookup returns, and the caller says which
 * fields read as the label and the hint. That is what lets a department, a
 * material and a payment term go through the same picker without any of them
 * being reshaped into a shared option type first.
 */

/** How one backend record reads in the list. */
export interface OptionView {
  id: string;
  label: string;
  /** Secondary line, e.g. a material or vendor number. */
  hint?: string;
}

export interface LookupPickerProps<T> {
  value: SelectedOption | null;
  onSelect: (record: T) => void;
  /**
   * Cache key for this picker's collection, e.g. the materials lookup. The
   * search term is appended to it, so each term caches separately.
   */
  queryKey: readonly unknown[];
  /** Fetches one page of results. Provided by the caller so the picker stays generic. */
  loadPage: (params: {
    page: number;
    pageSize: number;
    search: string;
    signal: AbortSignal;
  }) => Promise<Paginated<T>>;
  /** Reads a record's id, label and optional hint straight off the response. */
  toOption: (record: T) => OptionView;
  placeholder: string;
  searchPlaceholder: string;
  ariaLabel: string;
  disabled?: boolean;
  className?: string;
  "aria-invalid"?: boolean;
}

const SEARCH_DEBOUNCE_MS = 300;

export function LookupPicker<T>({
  value,
  onSelect,
  queryKey,
  loadPage,
  toOption,
  placeholder,
  searchPlaceholder,
  ariaLabel,
  disabled,
  className,
  "aria-invalid": ariaInvalid,
}: LookupPickerProps<T>) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");

  React.useEffect(() => {
    const timer = setTimeout(
      () => setDebouncedSearch(search),
      SEARCH_DEBOUNCE_MS,
    );

    return () => clearTimeout(timer);
  }, [search]);

  /**
   * Settling on a new search term puts it in the key, so paging restarts from
   * the top on its own — no list to clear by hand, and no guard against
   * double-fetching a page, since the cache is keyed per term and page.
   */
  const { data, isFetching, hasNextPage, fetchNextPage, isError, error } =
    useInfiniteQuery({
      queryKey: [...queryKey, debouncedSearch],
      // Nothing is loaded until the popover is opened.
      enabled: open,
      // Catalogs change rarely, and refetching an infinite query re-runs every
      // page it holds — so keep reopening the picker on the cache rather than
      // replaying five requests to rebuild a list the user just scrolled.
      staleTime: 5 * 60 * 1000,
      initialPageParam: 1,
      queryFn: ({ pageParam, signal }) =>
        loadPage({
          page: pageParam,
          pageSize: LOOKUP_PAGE_SIZE,
          search: debouncedSearch,
          signal,
        }),
      getNextPageParam: (lastPage, allPages) =>
        allPages.length < lastPage.pagination.total_pages
          ? allPages.length + 1
          : undefined,
    });

  const records = React.useMemo(
    () => data?.pages.flatMap((page) => page.data) ?? [],
    [data],
  );

  function handleScroll(event: React.UIEvent<HTMLDivElement>) {
    if (isFetching || !hasNextPage) return;

    const { scrollTop, scrollHeight, clientHeight } = event.currentTarget;

    // An empty or short list sits at the bottom by definition, which would
    // otherwise read as "scrolled to the end" and pull a page too early.
    if (scrollHeight <= clientHeight) return;

    if (scrollHeight - scrollTop - clientHeight < 48) {
      fetchNextPage();
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            role="combobox"
            aria-expanded={open}
            aria-label={ariaLabel}
            aria-invalid={ariaInvalid}
            disabled={disabled}
            className={cn("w-full justify-between font-normal", className)}
          >
            <span className={cn("truncate", !value && "text-muted-foreground")}>
              {value?.label ?? placeholder}
            </span>
            <ChevronsUpDownIcon className="shrink-0 opacity-50" />
          </Button>
        }
      />
      <PopoverContent align="start" className="w-80 gap-0 p-0">
        <div className="border-b p-2">
          <InputGroup className="h-8">
            <InputGroupInput
              type="search"
              value={search}
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
              onChange={(event) => setSearch(event.target.value)}
            />
            <InputGroupAddon>
              <SearchIcon />
            </InputGroupAddon>
          </InputGroup>
        </div>

        <div
          role="listbox"
          aria-label={ariaLabel}
          className="max-h-64 overflow-y-auto p-1"
          onScroll={handleScroll}
        >
          {isError ? (
            <p className="px-2 py-6 text-center text-xs text-destructive">
              {errorMessage(error, "Couldn't load options.")}
            </p>
          ) : records.length === 0 && !isFetching ? (
            <p className="px-2 py-6 text-center text-xs text-muted-foreground">
              No matches.
            </p>
          ) : (
            records.map((record) => {
              const option = toOption(record);
              const selected = option.id === value?.id;

              return (
                <button
                  key={option.id}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs hover:bg-muted"
                  onClick={() => {
                    onSelect(record);
                    setOpen(false);
                  }}
                >
                  <CheckIcon
                    className={cn(
                      "size-3.5 shrink-0",
                      !selected && "opacity-0",
                    )}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate">{option.label}</span>
                    {option.hint ? (
                      <span className="block truncate text-muted-foreground">
                        {option.hint}
                      </span>
                    ) : null}
                  </span>
                </button>
              );
            })
          )}

          {isFetching ? (
            <p className="flex items-center justify-center gap-2 px-2 py-3 text-xs text-muted-foreground">
              <Spinner className="size-3.5" />
              Loading…
            </p>
          ) : null}
        </div>
      </PopoverContent>
    </Popover>
  );
}
