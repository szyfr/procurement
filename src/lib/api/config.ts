/**
 * Server-side configuration for reaching FastAPI.
 *
 * Nothing here may be imported from a Client Component — the base URL is the
 * one detail the BFF exists to keep off the browser.
 */

/** Where the BFF reaches FastAPI. Trailing slashes are stripped. */
export function getApiBaseUrl() {
  const baseUrl = process.env.FASTAPI_BASE_URL;

  if (!baseUrl) {
    throw new Error("FASTAPI_BASE_URL is not set");
  }

  return baseUrl.replace(/\/+$/, "");
}

export const REQUEST_TIMEOUT_MS = 15_000;
