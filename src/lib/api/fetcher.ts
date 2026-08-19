import { getApiBaseUrl, REQUEST_TIMEOUT_MS } from "@/lib/api/config";
import { forwardedCookieHeader, forwardedCsrfToken } from "@/lib/api/cookies";
import { ApiError, normalizeBackendError } from "@/lib/api/errors";
import { CSRF_HEADER } from "@/modules/auth/constants";

/**
 * The single place the server talks to FastAPI. Used only by DALs — Route
 * Handlers and components go through those, never here directly.
 *
 * Every call forwards the caller's cookies upstream — how FastAPI sees the
 * session it issued. There's no cookie jar on the server, so it's an explicit
 * header rather than a `credentials` flag. The CSRF token rides along in the
 * header upstream compares against its cookie, for the same reason: both
 * halves of the double submit have to arrive, and doing it here means no route
 * has to remember to.
 */

export interface ServerFetchOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  /**
   * Serialized as JSON, unless it is `FormData` — the quotation endpoints take
   * `multipart/form-data`, which has to go out untouched so the runtime can
   * generate the part boundary.
   */
  body?: unknown;
  /**
   * Appended as a query string; `undefined` and `null` entries are dropped. An
   * array repeats its key (`items=a&items=b`), which is how FastAPI spells a
   * `list[str] = Query(...)` parameter — a comma-joined value is rejected.
   */
  query?: Record<string, string | number | string[] | undefined | null>;
  /** Merged over the defaults, including the forwarded auth headers below. */
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

/** An upstream call with its `Set-Cookie` lines kept; see `serverFetchWithCookies`. */
export interface UpstreamResponse<T> {
  data: T;
  setCookies: string[];
}

function buildUrl(path: string, query: ServerFetchOptions["query"]): string {
  const url = new URL(`${getApiBaseUrl()}${path}`);

  for (const [key, value] of Object.entries(query ?? {})) {
    if (value === undefined || value === null) continue;

    if (Array.isArray(value)) {
      for (const entry of value) url.searchParams.append(key, entry);
      continue;
    }

    url.searchParams.set(key, String(value));
  }

  return url.toString();
}

async function readBody(response: Response): Promise<unknown> {
  if (response.status === 204) return null;

  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function request<T>(
  path: string,
  options: ServerFetchOptions,
): Promise<UpstreamResponse<T>> {
  const { method = "GET", body, query, headers, signal } = options;

  // Setting `Content-Type` by hand on a multipart body drops the boundary —
  // leave it to `fetch`.
  const multipart = body instanceof FormData;

  const cookie = await forwardedCookieHeader();
  const csrfToken = await forwardedCsrfToken();

  let response: Response;

  try {
    response = await fetch(buildUrl(path, query), {
      method,
      headers: {
        Accept: "application/json",
        ...(body === undefined || multipart
          ? {}
          : { "Content-Type": "application/json" }),
        ...(cookie ? { Cookie: cookie } : {}),
        ...(csrfToken ? { [CSRF_HEADER]: csrfToken } : {}),
        ...headers,
      },
      body:
        body === undefined
          ? undefined
          : multipart
            ? body
            : JSON.stringify(body),
      // Purchasing data changes constantly — never serve a stale copy from
      // the Next.js data cache.
      cache: "no-store",
      signal: signal ?? AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (cause) {
    throw new ApiError(
      503,
      "upstream_unavailable",
      cause instanceof Error ? cause.message : "Upstream request failed",
    );
  }

  const payload = await readBody(response);

  if (!response.ok) {
    throw normalizeBackendError(response.status, payload);
  }

  return { data: payload as T, setCookies: response.headers.getSetCookie() };
}

export async function serverFetch<T>(
  path: string,
  options: ServerFetchOptions = {},
): Promise<T> {
  return (await request<T>(path, options)).data;
}

/**
 * The same call, keeping the upstream `Set-Cookie` lines so a Route Handler can
 * relay them to the browser.
 *
 * Only the auth routes need them: sign-in, sign-out and the CSRF prime are the
 * three responses where FastAPI issues or expires a cookie. Everything else
 * uses `serverFetch`, which discards them — no other endpoint sets one, and
 * passing an unexpected upstream cookie through to the browser is not
 * something a data route should do silently.
 */
export async function serverFetchWithCookies<T>(
  path: string,
  options: ServerFetchOptions = {},
): Promise<UpstreamResponse<T>> {
  return request<T>(path, options);
}
