/**
 * Realtime module — public surface.
 *
 * `services/ably-token.service.ts` is deliberately left out: it signs JWTs
 * with `ABLY_API_KEY` and must be imported directly by the Route Handler
 * (`@/modules/realtime/services/...`) so the key can never be pulled into a
 * client bundle through this barrel.
 *
 * The Ably client fetches `token` directly as its `authUrl` rather than going
 * through `bffRequest`, since Ably's SDK owns that request and expects the raw
 * response, not the `{ data }` envelope.
 */

export {
  PURCHASE_REQUEST_UPDATED_EVENT,
  PURCHASE_REQUESTS_CHANNEL,
} from "@/modules/realtime/constants";

export const realtimeEndpoints = {
  /** Signed JWT for the caller, as the bare body. 401 when signed out. */
  token: "/api/realtime/token",
} as const;
