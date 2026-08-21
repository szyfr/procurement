import { ApiError } from "@/lib/api/errors";
import { isObjectId } from "@/lib/api/object-id";
import type { Priority } from "@/lib/types";
import type {
  CreatePurchaseRequestInput,
  MarkPurchaseRequestDeliveredDto,
  ProcessItemDecision,
  ProcessPurchaseRequestItemDto,
  ProcessPurchaseRequestItemsDto,
  RecordPartialDeliveryDto,
  UpdatePurchaseRequestDto,
} from "@/modules/purchase-requests/dto";
import type { SettablePurchaseRequestStatus } from "@/modules/purchase-requests/models/purchase-request";

/**
 * Request-body validation for the purchase request BFF routes.
 *
 * The browser sends the FastAPI shape already, so there is no camelCase to
 * translate here — only checking. FastAPI is lenient about these fields, so the
 * checks happen where a failure can be reported as a proper 422.
 */

const SETTABLE_STATUSES: SettablePurchaseRequestStatus[] = [
  "pending",
  "canceled",
  "completed",
];

const PRIORITIES: Priority[] = ["low", "normal", "high"];

/**
 * Guards the status path segment. The backend's enum is much wider, but every
 * other transition is owned by canvassing and PO processing, so anything else
 * arriving here is a bug or a hand-crafted request rather than a user error.
 */
export function parseSettableStatus(
  value: string,
): SettablePurchaseRequestStatus {
  const status = SETTABLE_STATUSES.find((allowed) => allowed === value);

  if (!status) {
    throw new ApiError(
      422,
      "validation_failed",
      `Status must be one of: ${SETTABLE_STATUSES.join(", ")}.`,
    );
  }

  return status;
}

function invalid(message: string) {
  return new ApiError(422, "validation_failed", message);
}

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/**
 * A `YYYY-MM-DD` string that is also a real calendar day. Shared with the proof
 * validator, which needs the identical check.
 *
 * The round trip is what rejects `2025-02-30`: a date-only string parses as
 * UTC, and out-of-range components roll forward — that one becomes March 2 —
 * so `Date.parse` alone would let it through.
 */
export function assertDateOnly(value: string, label: string): string {
  const parsed = new Date(value);

  if (
    !DATE_PATTERN.test(value) ||
    Number.isNaN(parsed.getTime()) ||
    parsed.toISOString().slice(0, 10) !== value
  ) {
    throw invalid(`${label} must be a valid date.`);
  }

  return value;
}

const ITEM_STATUSES = ["draft", "pending", "pending-assessment"] as const;

type ItemStatus = (typeof ITEM_STATUSES)[number];

/**
 * Shared by create and update: every item needs a material and a quantity.
 *
 * `defaultStatus` stamps every item that didn't carry its own status. Create
 * passes `pending-assessment` for a submitted request, so its items land in
 * the state the backend's assessment pass has yet to look at; update passes
 * `draft` because it has to pass something — see `parseUpdatePayload`.
 */
function parseItems(items: unknown, defaultStatus?: ItemStatus) {
  if (!Array.isArray(items) || items.length === 0) {
    throw invalid("Add at least one item.");
  }

  return items.map((entry, index) => {
    const item = entry as {
      material_id?: string;
      quantity?: number;
      vendor_id?: string | null;
      status?: string;
    } | null;

    if (!item?.material_id)
      throw invalid(`Item ${index + 1} needs an item selected.`);
    if (!Number.isFinite(item.quantity) || (item.quantity as number) <= 0) {
      throw invalid(`Item ${index + 1} needs a quantity greater than zero.`);
    }

    const status = ITEM_STATUSES.includes(item.status as ItemStatus)
      ? (item.status as ItemStatus)
      : defaultStatus;

    return {
      material_id: item.material_id,
      quantity: item.quantity as number,
      vendor_id: item.vendor_id ?? null,
      ...(status ? { status } : {}),
    };
  });
}

export function parseCreatePayload(body: unknown): CreatePurchaseRequestInput {
  if (!body || typeof body !== "object")
    throw invalid("Request body is missing.");

  const payload = body as Partial<CreatePurchaseRequestInput>;

  const title = payload.title?.trim();
  if (!title) throw invalid("Title is required.");
  if (!payload.department_id) throw invalid("Department is required.");
  if (!payload.date_needed) throw invalid("Date needed is required.");
  if (!payload.justification?.trim())
    throw invalid("Justification is required.");

  const priority = payload.priority ?? "normal";
  if (!PRIORITIES.includes(priority)) {
    throw invalid("Priority must be low, normal, or high.");
  }

  // Undefined is a legitimate value here — the create form omits it for
  // "Save as Draft" and leans on the backend's own draft default.
  if (
    payload.status !== undefined &&
    payload.status !== "draft" &&
    payload.status !== "pending"
  ) {
    throw invalid('Status must be "draft" or "pending" when creating.');
  }

  return {
    title,
    department_id: payload.department_id,
    date_needed: payload.date_needed,
    priority,
    justification: payload.justification.trim(),
    items: parseItems(
      payload.items,
      payload.status === "pending" ? "pending-assessment" : "draft",
    ),
    status: payload.status,
  };
}

/**
 * Every field on an update is optional; only what was sent is forwarded.
 *
 * The request's own `status` is not among them. FastAPI would accept it here,
 * but only the dedicated status endpoint cascades the change onto the
 * request's items, so that transition has one path and this one carries edits
 * alone.
 *
 * Item status is a different matter, and `draft` is not a choice we get to
 * skip. The upstream PUT deletes and recreates every item, passing
 * `status=item["status"]` straight into `PurchaseRequestItemCreate`, whose
 * `status` is a non-optional enum. Leaving it off a request body does not
 * reach the backend as "absent" — its own `itemRequest.status` defaults to
 * `None`, which then fails validation and surfaces as a 500. Editing is only
 * offered on a draft, and submitting still goes through the status endpoint
 * afterwards, so stamping `draft` here recreates the items as they were.
 */
export function parseUpdatePayload(body: unknown): UpdatePurchaseRequestDto {
  if (!body || typeof body !== "object") return {};

  const payload = body as Partial<UpdatePurchaseRequestDto>;

  return {
    ...(payload.title === undefined ? {} : { title: payload.title }),
    ...(payload.department_id === undefined
      ? {}
      : { department_id: payload.department_id }),
    ...(payload.date_needed === undefined
      ? {}
      : { date_needed: payload.date_needed }),
    ...(payload.priority === undefined ? {} : { priority: payload.priority }),
    ...(payload.justification === undefined
      ? {}
      : { justification: payload.justification }),
    ...(payload.items === undefined
      ? {}
      : { items: parseItems(payload.items, "draft") }),
  };
}

/**
 * The bulk delivery body. `delivery_date` is optional upstream, but its default
 * is `datetime.now` — the function object rather than a call — so a missing
 * date is stored as the method itself. It is required here instead.
 */
export function parseMarkDeliveredPayload(
  body: unknown,
): MarkPurchaseRequestDeliveredDto {
  if (!body || typeof body !== "object")
    throw invalid("Request body is missing.");

  const payload = body as Partial<MarkPurchaseRequestDeliveredDto>;

  if (!Array.isArray(payload.item_ids) || payload.item_ids.length === 0) {
    throw invalid("Select at least one item.");
  }
  payload.item_ids.forEach((id, index) => {
    if (typeof id !== "string" || !isObjectId(id)) {
      throw invalid(`Item ${index + 1} is not valid.`);
    }
  });

  if (!payload.delivery_date) throw invalid("Delivery date is required.");

  return {
    item_ids: payload.item_ids,
    delivery_date: assertDateOnly(payload.delivery_date, "Delivery date"),
  };
}

/**
 * The delivered amount for one item. Upstream's `Field(..., gt=0)` rejects
 * zero and negatives, but a FastAPI 422 for a body field surfaces as a
 * `{detail: [...]}` list; catching it here names the field instead.
 *
 * Not checked here: whether the amount exceeds the item's ordered quantity.
 * That needs the item, which this route does not read — the dialog holds that
 * rule where the quantity is already on screen.
 */
export function parsePartialDeliveryPayload(
  body: unknown,
): RecordPartialDeliveryDto {
  if (!body || typeof body !== "object")
    throw invalid("Request body is missing.");

  const { amount } = body as Partial<RecordPartialDeliveryDto>;

  if (typeof amount !== "number" || !Number.isFinite(amount)) {
    throw invalid("Amount must be a number.");
  }
  if (amount <= 0) {
    throw invalid("Amount must be greater than zero.");
  }

  return { amount };
}

const ITEM_DECISIONS: ProcessItemDecision[] = ["approved", "rejected"];

/**
 * Shared by both process routes. The wire value is the decision, not the
 * status it produces — upstream reads anything that isn't `approved` as a
 * rejection, so an unrecognized value would silently reject the selection
 * rather than fail. Checking it here is what makes that a 422 instead.
 */
function parseDecision(value: unknown): ProcessItemDecision {
  const decision = ITEM_DECISIONS.find((allowed) => allowed === value);

  if (!decision) {
    throw invalid(`Decision must be one of: ${ITEM_DECISIONS.join(", ")}.`);
  }

  return decision;
}

export function parseProcessItemPayload(
  body: unknown,
): ProcessPurchaseRequestItemDto {
  if (!body || typeof body !== "object")
    throw invalid("Request body is missing.");

  return { status: parseDecision((body as { status?: unknown }).status) };
}

/**
 * The bulk body. Upstream declares `items: List[PyObjectId]` but then reads
 * each entry as a mapping, so a well-formed call still fails there today; the
 * ids are checked here regardless, so a malformed one is named rather than
 * arriving as an upstream 500.
 */
export function parseProcessItemsPayload(
  body: unknown,
): ProcessPurchaseRequestItemsDto {
  if (!body || typeof body !== "object")
    throw invalid("Request body is missing.");

  const payload = body as Partial<ProcessPurchaseRequestItemsDto>;

  if (!Array.isArray(payload.items) || payload.items.length === 0) {
    throw invalid("Select at least one item.");
  }
  payload.items.forEach((itemId, index) => {
    if (typeof itemId !== "string" || !isObjectId(itemId)) {
      throw invalid(`Item ${index + 1} is not valid.`);
    }
  });

  return { status: parseDecision(payload.status), items: payload.items };
}
