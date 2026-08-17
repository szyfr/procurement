# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev      # next dev
npm run build    # next build — also the type check; there is no separate tsc script
npm run lint     # biome check
npm run format   # biome format --write
```

There is no test runner in this project. `npm run lint && npm run build` is the definition of done for a change — both must be clean (TypeScript errors, Biome issues, hydration errors, build errors).

Env vars live in `.env.local`, which is gitignored; `.env.example` is committed and lists both:

- `FASTAPI_BASE_URL` — where the BFF reaches FastAPI.
- `ABLY_API_KEY` — `keyId:keySecret`, the same key the backend publishes with. `/api/realtime/token` signs client JWTs with the secret half; the key itself never leaves the server.

Both are server-only and must never be read from a Client Component. `src/instrumentation.ts` asserts both at boot, so a misconfigured deploy crashes on start instead of coming up green and behaving as though every user is signed out.

## What this is

Procurement UI for the purchasing app. The FastAPI backend lives in a sibling repo at `C:/projects/purchasing-app/purchasing-backend/`.

Standing constraints, carried over from the Purchase Requests integration brief:

- The browser never calls FastAPI directly — everything goes through the BFF (below).
- Integrate only endpoints that exist on the backend today. If the UI needs something that isn't implemented yet, don't fake it: keep the page functional with its existing empty state and document the gap.
- Reuse existing structure, utilities and shared types rather than duplicating them.
- Authorization, sorting and file uploads are out of scope. Authentication is not — see below.

## Architecture: the BFF boundary

The browser **never** calls FastAPI. Every request goes:

```
Component → module api/client.ts → Next Route Handler (/api/*) → module dal/*.dal.ts → FastAPI
```

Two layers are both called "client" — do not conflate them:

| Layer | Runs | Talks to | Never touches |
|---|---|---|---|
| `modules/*/api/client.ts` | browser | own-origin `/api/*` only | FastAPI's address, `serverFetch` |
| `modules/*/dal/*.dal.ts` | server, inside Route Handlers | FastAPI only | React |

Consequences that are easy to get wrong:

- **Module barrels (`modules/*/index.ts`) deliberately omit the DAL.** Route Handlers import DALs by full path (`@/modules/purchase-requests/dal/purchase-request.dal`) so a DAL can never be pulled into a client bundle through the barrel. Keep it that way when adding exports.
- `lib/api/fetcher.ts` (`serverFetch`) is the *only* place the server calls FastAPI; DALs use it and nothing else does.
- `lib/api/bff-client.ts` (`bffRequest`) is the *only* place the browser issues fetches.
- **The BFF is a proxy, not a translator.** A DAL hands back the FastAPI response as it arrived and the Route Handler wraps it in `{ data }` — nothing is renamed, reshaped or reformatted on the way through, so the browser works in `snake_case` and `_id` exactly as the backend does. The one deliberate exception is auth (below), where the upstream body carries secrets that must not leave the server.
- Route Handlers return `{ data }` on success and `{ error: { message } }` on failure. `bffRequest` unwraps `.data`; `toErrorResponse` builds the failure envelope.

## Module layout

Feature modules under `src/modules/<feature>/` follow **Module + DAL + DTO**:

```
api/client.ts        browser calls against the BFF
api/endpoints.ts     every BFF path the feature may call (relative, own origin)
dal/*.dal.ts         server-side FastAPI reads/writes
models/              the FastAPI response shape, verbatim — what components render
dto/                 request contracts only (create/update bodies)
validation/          request-body parsing for Route Handlers, throws ApiError(422)
queries/             TanStack Query keys + queryOptions factories
constants/           status labels, tones, page sizes
index.ts             public surface (no DAL)
```

There is no `mappers/`. A response has one shape and it is the backend's: `models/` declares it and every layer above reads it directly. `dto/` holds request bodies only — a resource whose writes take the same fields it returns needs no response DTO at all, and vendors (read-only) have no `dto/` directory.

`purchase-requests`, `departments`, `vendors`, `payment-terms`, `canvassing`, `realtime` and `auth` exist. New modules should mirror this. `auth` adds `hooks/` (the sign-in and sign-out mutations) and keeps its cookie writer beside the DAL, so both stay out of the barrel.

`realtime` has no DAL — it never reaches FastAPI. Its JWT signer sits in `services/` instead and is kept out of the barrel for the same reason a DAL would be: it reads `ABLY_API_KEY`.

Route Handlers stay thin: parse params → call DAL → wrap in `Response.json({ data })` → `catch` → `toErrorResponse(error)`.

Display concerns — date formatting, status labels, priority copy, "fall back to the id when a join missed" — belong at the render site or in the module's `constants/`, not in a layer between the response and the component. `lib/date.ts` (`formatDate`, `formatShortDate`, `toDateInputValue`) is what tables and detail panels call on a raw timestamp.

## Authentication

Cookie-based, and the BFF boundary is what makes it work: FastAPI's cookies are scoped to FastAPI and never reach the browser, so the `auth` module re-issues its own on this origin.

- `lib/api/fetcher.ts` forwards the caller's cookies upstream on **every** DAL call — that is how FastAPI sees the session.
- Route Handlers under `/api/auth/*` are the only place `Set-Cookie` is written, via `modules/auth/dal/auth-cookies.ts`. Both cookies are `HttpOnly`, `SameSite=Lax`, `Secure` in production.
- The JWT reaches the browser as a cookie and nothing else. Nothing is kept in `localStorage`, `sessionStorage` or any store, and no client code reads or parses a cookie.
- CSRF is a double submit completed **server-side**: the BFF holds the token in an HttpOnly cookie and echoes it in `X-XSRF-TOKEN`. `SameSite=Lax` is the actual cross-site defense at our own boundary.
- Route protection is two layers, per the Next.js auth guide. `src/proxy.ts` (Next 16's renamed middleware) does the cheap check — no session cookie, no protected page. The `(dashboard)` layout and the login page do the authoritative one via `getOptionalUser()`, because only FastAPI can say whether a token is still valid. Never bounce off cookie presence in both directions or the two layers will loop.
- **Every Route Handler outside `/api/auth/*` calls `await requireUser()` first.** `proxy.ts` deliberately skips `/api/*`, so this is the only thing standing between a BFF route and an unauthenticated caller — and it is not merely defense in depth: FastAPI applies `get_current_active_user` to `auth_controller.py` and *nothing else*, with no global middleware, so upstream will happily serve an anonymous request. Adding a route means adding the gate. The three DALs that need the caller's id (`purchase-request.dal.ts`, `quotation.dal.ts`) call `getCurrentUser()` themselves and are safe either way.
- **Authorization is still not enforced anywhere**, here or upstream. `AuthenticatedUser.permissions` is carried and never read for a decision, so any signed-in user can reach `POST /api/roles` and `PATCH /api/users/[id]/roles`. Permission slugs are data-driven (`GET /permissions`, titles like `purchase_request.store`) and nothing in the UI hardcodes one — pick them from the seeded catalogue rather than guessing when this is implemented.
- The BFF gate only closes the hole if **FastAPI is not independently reachable** by users. It must be bound to a private network or container-internal address, never published.
- "Am I signed in?" is always a question for the backend (`GET /api/auth/session` → `/auth/me`), never a decoded token.
- A 401 from any query or mutation triggers a hard navigation to `/login` from `components/query-provider.tsx`, which discards the client cache. `fetchSession` handles its own 401 and never reaches it.
- `/auth/me` returns the stored user document, hashed password included, and `/auth/login` returns the raw JWT. These are the **only** two responses the BFF does not pass through: `getCurrentUser` drops `password` before returning, and `signIn` splits the token off so it can go into an HttpOnly cookie and nowhere else. Keep both projections; they are a security boundary, not a mapping layer.

## Errors

`lib/api/errors.ts` is the single normalization path. FastAPI reports failures in four different shapes (`{message}`, `{detail}`, `{detail: [...]}`, `{error}`); `normalizeBackendError` funnels all of them into `ApiError`. `toPublicMessage` then decides what the browser sees — upstream text is only surfaced for `validation_failed`, everything else gets fixed user-safe copy. Never pass an upstream message through by hand.

`assertObjectId` (`lib/api/object-id.ts`) rejects non-24-hex ids as a local 404 rather than a round trip.

## Data fetching in the UI

Pages under `src/app/(dashboard)/` are thin **server** shells: they own `metadata`, `await searchParams`, and hand off to a `"use client"` view that runs the queries. The URL is the source of truth for list state (view, page, search, filters) — filters write to search params via `router.replace`, and any filter change drops `page`.

Query definitions live in the module's `queries/`, not the component, so keys and fetchers stay together. Global defaults are in `components/query-provider.tsx` (30s `staleTime`, one retry, no refetch on focus) — the QueryClient is per-render on the server and a singleton only in the browser.

## Mock data still in play

Almost none. `src/data/` holds two files and neither is fake data: `navigation.ts` (nav labels, breadcrumb copy, app identity) and `reports.ts` (the report catalogue — id, title, description, icon, and whether an endpoint exists behind it). Purchase Requests, Departments, Vendors, Payment Terms, Dashboard, Users, Roles, global search and four of the five reports are wired to the real backend.

What genuinely has no backend, and renders an empty or unavailable state rather than invented data: **notifications** (no model or endpoint at all), the dashboard's **Recent Activity**, **Upcoming Deadlines**, **Requiring Your Action** and **Overdue Deliveries** tiles, and the **Purchaser Performance** report. See `DASHBOARD_BACKEND_GAPS.md` for what each one needs.

The user's role and department have no backend source — `/auth/me` carries a permission list and no organizational placement — so the My Account panel shows name and email and drops the two fields entirely rather than keeping them as inputs that can never be filled. When a backend endpoint doesn't exist yet, keep the page functional with its existing empty state — do not invent data, and document the gap. Columns with no backend source are rendered as a literal em-dash at the call site rather than carried as a permanently-null field — a request has no stored amount and materials sync without a cost, so the Amount column is empty everywhere and the comment beside it says why.

## UI conventions

shadcn on **Base UI** (`@base-ui/react`), style `base-nova`, Tailwind v4 (CSS-first config in `src/app/globals.css`, no tailwind.config). Use the `shadcn` MCP server for component work.

Base UI composition differs from Radix: render a Button as a link with `render={<Link href="…" />} nativeButton={false}` rather than `asChild`. Icons take `data-icon="inline-start"` for spacing.

`src/components/ui/` is generated and **excluded from Biome** — don't hand-edit it or expect it to be linted. Cross-feature building blocks (`data-toolbar`, `page-header`, `status-badge`, `priority-badge`, `table-pagination`, `table-skeleton`, `query-states`) live in `src/components/shared/`; check there before writing a new one.

## Comment style

Remove comments that are unnecessary, redundant, or only explain obvious mechanics. Shorten verbose comments when the context is still useful. Preserve comments that document important constraints, decisions, backend quirks, business rules, or deliberate omissions. Comments should add context that cannot be inferred from the code.
