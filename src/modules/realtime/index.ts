/**
 * Realtime module — public surface.
 *
 * The DAL is deliberately left out: it signs JWTs with `ABLY_API_KEY` and
 * must be imported directly by the Route Handler (`@/modules/realtime/dal/...`)
 * so the key can never be pulled into a client bundle through this barrel.
 */

export { realtimeEndpoints } from "@/modules/realtime/api/endpoints";
