import { CardFooter } from "@/components/ui/card";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
// Aliased only because shadcn's `Pagination` component shares the name.
import type { Pagination as PaginationEnvelope } from "@/lib/api/pagination";

const ELLIPSIS = "ellipsis";
type PageItem = number | typeof ELLIPSIS;

/**
 * Page numbers to render: always the first and last page, plus a small
 * window around the current page, with an ellipsis filling any gap between
 * them — so a result set with e.g. 120 pages reads as `1 … 46 47 48 … 120`
 * instead of either a 3-page window or 120 unusable links.
 */
function pageItems(current: number, total: number): PageItem[] {
  const siblingCount = 1;
  const pages = new Set(
    [1, total, current - siblingCount, current, current + siblingCount].filter(
      (page) => page >= 1 && page <= total,
    ),
  );
  const sorted = [...pages].sort((a, b) => a - b);

  const items: PageItem[] = [];
  let previous = 0;
  for (const page of sorted) {
    if (previous && page - previous > 1) {
      items.push(ELLIPSIS);
    }
    items.push(page);
    previous = page;
  }
  return items;
}

/**
 * Footer every paginated list card ends with: how much of the collection is on
 * screen, plus the page links when there is more than one page.
 *
 * Reads the backend's pagination envelope as it arrives — `total_items`,
 * `next_page` and the rest are the field names FastAPI sent.
 */
export function TablePagination({
  shown,
  page,
  buildPageHref,
}: {
  /** Rows currently rendered, which is the page size on all but the last page. */
  shown: number;
  page: PaginationEnvelope;
  /** Keeps any other URL state (e.g. the cards/table view) intact while paging. */
  buildPageHref: (page: number) => string;
}) {
  return (
    <CardFooter className="justify-between gap-2 text-xs text-muted-foreground">
      <span>
        Showing {shown} of {page.total_items}
      </span>
      {page.total_pages > 1 ? (
        <Pagination className="mx-0 w-auto">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href={buildPageHref(page.prev_page ?? 1)}
                aria-disabled={page.prev_page === null}
                className={
                  page.prev_page === null
                    ? "pointer-events-none opacity-50"
                    : undefined
                }
              />
            </PaginationItem>
            {pageItems(page.current_page, page.total_pages).map(
              (item, index) =>
                item === ELLIPSIS ? (
                  // biome-ignore lint/suspicious/noArrayIndexKey: at most two ellipses, each at a fixed position around the sibling window
                  <PaginationItem key={`ellipsis-${index}`}>
                    <PaginationEllipsis />
                  </PaginationItem>
                ) : (
                  <PaginationItem key={item}>
                    <PaginationLink
                      href={buildPageHref(item)}
                      isActive={item === page.current_page}
                    >
                      {item}
                    </PaginationLink>
                  </PaginationItem>
                ),
            )}
            <PaginationItem>
              <PaginationNext
                href={buildPageHref(page.next_page ?? page.total_pages)}
                aria-disabled={page.next_page === null}
                className={
                  page.next_page === null
                    ? "pointer-events-none opacity-50"
                    : undefined
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      ) : null}
    </CardFooter>
  );
}
