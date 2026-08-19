/**
 * Pagination is the one contract every FastAPI list endpoint shares — they are
 * all wrapped by `Helper.paginate` — so the envelope and the query-param
 * parsing live here rather than being restated per module.
 *
 * The envelope is passed through untouched: nothing re-spells `total_pages` as
 * `totalPages` on the way to a component, so what the table renders is what
 * the backend sent.
 */

export interface Pagination {
  total_items: number;
  total_pages: number;
  current_page: number;
  page_size: number;
  next_page: number | null;
  prev_page: number | null;
  /** Echoed back by the backend; list screens read the term off the URL instead. */
  search_term: string | null;
}

/** `Helper.paginate` wraps every list endpoint in this shape. */
export interface Paginated<T> {
  data: T[];
  pagination: Pagination;
}

/** FastAPI caps `page_size` at 100. */
export const MAX_PAGE_SIZE = 100;

export const DEFAULT_PAGE_SIZE = 10;

/** Keeps a caller-supplied page size inside what the backend accepts. */
export function clampPageSize(pageSize: number | undefined, fallback: number) {
  return Math.min(Math.max(pageSize ?? fallback, 1), MAX_PAGE_SIZE);
}

/** Reads a positive integer out of a query string, falling back when absent. */
export function readPageParam(value: string | null, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}

/** Free-text search is the one list filter every collection screen shares. */
export interface ListSearchFilters {
  search?: string;
}
