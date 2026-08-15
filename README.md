# Purchasing UI

Procurement UI for the purchasing app — purchase requests, canvassing, vendors
and reporting. The FastAPI backend is a sibling repo at
`../purchasing-backend/`.

Next.js 16 (App Router), React 19, TanStack Query, shadcn on Base UI,
Tailwind v4. See `CLAUDE.md` for architecture and conventions.

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill it in, see below
npm run dev
```

The backend has to be running too; the UI reaches it through its own BFF and
never calls it from the browser.

## Environment

Both variables are **server-only** and must never be read from a Client
Component. `src/instrumentation.ts` asserts both at boot, so a missing one
fails the process on start rather than surfacing later as an odd runtime error.

| Variable | What it is |
|---|---|
| `FASTAPI_BASE_URL` | Where the BFF reaches FastAPI, e.g. `http://localhost:8000`. |
| `ABLY_API_KEY` | `keyId:keySecret` — the **same key the backend publishes with**. `/api/realtime/token` signs short-lived, subscribe-only client JWTs with the secret half; the key itself never leaves the server. |

## Scripts

```bash
npm run dev      # next dev
npm run build    # next build — also the type check; there is no separate tsc script
npm run lint     # biome check
npm run format   # biome format --write
```

There is no test runner. `npm run lint && npm run build` is the definition of
done, and CI runs both plus `tsc --noEmit` and `npm audit`.

## Deploying

**FastAPI must not be reachable by users.** Bind it to a private network or a
container-internal address and let this app be the only public entry point.
Route Handlers here gate every request with `requireUser()`, but FastAPI
authenticates only its own `/auth/*` routes — anything that can reach it
directly can read and write everything, without signing in.

Beyond that:

- Set `NODE_ENV=production`. Auth cookies opt *out* of `Secure` only when
  `NODE_ENV === "development"`, so an unset value is safe, but the rest of the
  Next.js production path depends on it.
- Serve over HTTPS. The session and CSRF cookies are `Secure` and `SameSite=Lax`,
  and `SameSite=Lax` is what defends the BFF against cross-site writes.
- Security headers (`X-Frame-Options`, HSTS, `nosniff`, `Referrer-Policy`) are
  set in `next.config.ts`. A Content-Security-Policy is **not** yet enforced —
  it needs a nonce for Next's inline bootstrap scripts.
- If you containerize, consider `output: "standalone"` in `next.config.ts`;
  it is currently unset, so the deploy needs the full `node_modules`.

## Known gaps

`DASHBOARD_BACKEND_GAPS.md` is the punch list of screens whose backend does not
exist yet. Those render an empty or "not available" state on purpose — the rule
in this codebase is to never invent data to fill a gap.
