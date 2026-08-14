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

**PR Status Breakdown** is wired to `GET /reports/pr-cycle?start_date=&end_date=`. The endpoint is named for cycle time but does not answer it:

- It counts purchase requests per status — the controller loops the `Status` enum and returns `{category, value}` for all eight, zeros included. The range matches the request's own `created_at`, which is the right meaning here.
- **Actual cycle time has no source.** Days from submission to PO needs per-stage timestamps on a purchase request (submitted → canvassed → PO → delivered); the schema carries only `created_at`/`updated_at` and a current status. The card is titled for what the data is until that exists.
- `category` arrives pre-titled by the backend (`"Po Created"`, `"Pending"`), which is not this app's copy. The UI maps it back to a status slug and uses `purchaseRequestStatusLabels`/`purchaseRequestTone`.
- No parameters beyond the dates — no department, no vendor, no search.

**Spend by Department** is wired to `GET /reports/department-spending?start_date=&end_date=`. Note what the amounts are made of:

- There is still no stored PO or PR amount. Spend is derived upstream as Σ `quantity × material.last_cost` over `po-created` request items, so **an item whose material synced without a `last_cost` contributes nothing** — the totals are spend on priced lines, not on everything ordered. A stored amount on the PO would remove the guesswork.
- The `po` field counts `po-created` request *items*, not distinct purchase orders. The column is labelled "Ordered Items" for that reason.
- Unlike the other two reports this one answers an object (`{total, data}`) with the grand total computed upstream, and its route registers `""` rather than `"/"` — so it must be called **without** a trailing slash.
- Every department comes back, including those that raised nothing; the UI drops the empty ones.

The other two reports have **no endpoint at all** and remain mock-driven (`src/data/reports.ts`):

- **Purchaser Performance** — needs PRs attributable to the procurement officer who handled them.
- **Canvassing Compliance** — needs the 3-quote minimum and its exemptions represented server-side.
