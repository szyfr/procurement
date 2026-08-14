# Dashboard — backend gaps

The Dashboard UI is now wired to every endpoint that exists on the backend today. This is a punch list of what's missing to finish it.

## Already covered, no backend change needed

- `GET /purchase-requests?pr_status=...` (repeatable) — powers the Pending Purchase Requests and Partially Completed PRs KPI tiles (`pagination.total_items`) and the Requests Requiring Action table.
- `GET /canvassing` — powers the Pending Quotations KPI tile (`pagination.total_items`) and the Pending Quotations widget list.

## Missing

- **Requiring Your Action** (KPI tile). No way to scope purchase requests to "requires action from the signed-in user" — this is role/assignment-dependent, not just a status filter. Needs either a new query param on `GET /purchase-requests` (e.g. `assigned_to_me=true`, resolved server-side from the session) or a dedicated endpoint.

- **Overdue Deliveries** (KPI tile). No delivery/PO entity exists in the schema. Quotations carry a `delivery_date`, but nothing tracks whether a delivery actually happened. Needs a delivery/PO model with a status, or at minimum a `GET /quotations?overdue=true` filter comparing `delivery_date` to now.

- **Upcoming Deadlines** (widget). Same gap as above — needs a queryable notion of "upcoming" delivery or quote deadlines, ideally sortable by due date with a small `limit`.

- **Recent Activity** (widget). No activity/audit log endpoint exists anywhere in the backend. Needs an audit trail (who did what, when), with at least a `GET /activity?limit=N` recent-events endpoint.

## Reports

**Vendor Performance** is wired to `GET /reports/vendor?start_date=&end_date=`. Caveats in what that endpoint can answer today:

- The date range matches on the **vendor's own `created_at`**, not on delivery dates. It decides which vendors are evaluated; every vendor's delivery counts still cover its full history. A delivery-date window would need the `$match` moved onto the joined proofs.
- No department parameter, so the page's Department filter stays presentational. The endpoint's `search` is a vendor-name regex only.
- No pagination and no total count — the response is a plain array, so the table renders it whole.
- `sort_by`/`sort_order` exist upstream but sorting is out of scope for the UI; rows arrive sorted by rating.

The other four reports have **no endpoint at all** and remain mock-driven (`src/data/reports.ts`):

- **PR Cycle Time** — needs per-stage timestamps on a purchase request (submitted → canvassed → PO → delivered).
- **Spend by Department** — needs a stored PO/PR amount; nothing in the schema carries one (`last_cost` is absent from every synced material).
- **Purchaser Performance** — needs PRs attributable to the procurement officer who handled them.
- **Canvassing Compliance** — needs the 3-quote minimum and its exemptions represented server-side.
