/**
 * Every BFF path the realtime plumbing calls. Relative and same-origin, like
 * every other module — the Ably client fetches this directly as its
 * `authUrl` rather than going through `bffRequest`, since Ably's SDK owns
 * that request and expects the raw response, not the `{ data }` envelope.
 */

const BASE = "/api/realtime";

export const realtimeEndpoints = {
  /** Signed JWT for the caller, as plain text. 401 when signed out. */
  token: `${BASE}/token`,
} as const;
