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

- **Notifications** (the bell in the site header, on every page). Nothing exists upstream — no model, no collection, no delivery mechanism. The menu renders an empty state. This one has a realtime half too: the bell should light up without a poll, and FastAPI already publishes PR status transitions to Ably, so a per-user channel (`user:{id}:*` is already granted to every token and unused) would carry it once there is something to send. Needs a notification record with a read flag, `GET /notifications`, and a way to mark one or all read.

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

**Canvassing Compliance** is wired to `GET /reports/canvassing-compliance?start_date=&end_date=`. The minimum itself is now evaluated upstream (an item is compliant at ≥3 quotations), but the unit is not what the field names suggest:

- `pr_canvassed` counts **canvassing request items, not purchase requests** — the controller sums `len(items)` over every matching request, so a request with four items canvassed counts four times. The columns are labelled "Items Canvassed" for that reason. A per-request rollup would need the count done on the request rather than its items.
- Only items sitting at `canvassing` are considered, and only inside a request that drew at least one quotation. The filter is applied to the *request*, so `below_minimum` can include items with **no quotation at all** — it is "not compliant", not "canvassed but short".
- **Exemptions still have no server-side representation.** A request excused from the three-quote rule is indistinguishable from one that fell short, so the wireframe's "Exempted" bar and column are gone rather than faked. Restoring them needs an exemption flag (and ideally a reason) on the request or its items.
- The range matches the request's own `created_at`. No parameters beyond the dates — no department, no search.
- Like `department-spending`, the route registers `""` rather than `"/"`, so it must be called **without** a trailing slash. Every department comes back, all-zero rows included; the UI drops them.

**Purchaser Performance** is wired to `GET /reports/purchaser-assessment?start_date=&end_date=`, gated on `report.purchaser-assessment`. It previously rendered invented officers ("S. Galvis (you)", "P. Ocampo", "L. Bautista") with invented cycle times and compliance scores, presented identically to the real reports; those are gone and the endpoint answers three fields, two of which say less than their names suggest:

- `PRs Processed` counts purchase request **items, not requests** — the pipeline sums the item list of every delivery proof the purchaser filed, so a proof covering four items counts four times. The column is labelled "Items Processed" for that reason, the same way canvassing compliance is.
- **There is no cycle time**, so the wireframe's cycle-time column is absent rather than derived from something else. Adding it needs per-stage timestamps the schema still lacks.
- `Delivery Accuracy` is a 0-100 float with no rounding upstream, so expect values like `66.66666666666666`; the UI rounds at the render site. An item counts as on time when `delivered_at <= delivery_date` on its proof — and **BSON sorts null below every date, so an item with no delivery recorded passes the test** and raises the figure. A stored delivery status would remove the ambiguity.
- "Purchaser" is the user who filed the proof, not a purchaser recorded on the request itself. It arrives as `$concat: [firstname, " ", lastname]`, which Mongo returns as **null** if either half is missing, and `_id` is projected out — so rows carry **no id**, two purchasers with the same name are indistinguishable, and the UI keys rows by position.
- The date range matches the request **item's** `created_at`, but the outer filter only requires that the user has at least one proof — so a purchaser whose items all fall outside the range still comes back at zero items and zero percent. The UI drops those rows rather than showing them as 0% on time.
- Like `department-spending`, the route registers `""` rather than `"/"`, so it must be called **without** a trailing slash.
