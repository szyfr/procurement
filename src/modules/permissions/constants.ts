/**
 * How a permission's module prefix is presented, and in what order the modules
 * appear.
 *
 * There is no module concept upstream — `title` is a flat `module.action` key
 * and nothing else — so the prefix is the only thing to group on. That makes
 * this a display table, not a schema: the grouping itself works for any prefix
 * the backend sends, and this only decides what a known one is *called* and
 * where it sits.
 *
 * The order follows the app's own navigation (procurement before
 * administration) rather than the alphabet, so the list reads the way the
 * sidebar does. A prefix that isn't listed still groups correctly — it takes a
 * title-cased version of the prefix and sorts after everything here, so a new
 * module added upstream shows up rather than disappearing.
 */
export const PERMISSION_MODULES: readonly { prefix: string; label: string }[] =
  [
    { prefix: "purchase_request", label: "Purchase Requests" },
    { prefix: "purchase_request_item", label: "Purchase Request Items" },
    { prefix: "purchase_request_proof", label: "Proofs of Order" },
    { prefix: "canvassing", label: "Canvassing" },
    { prefix: "quotation", label: "Quotations" },
    { prefix: "material", label: "Materials" },
    { prefix: "report", label: "Reports" },
    { prefix: "department", label: "Departments" },
    { prefix: "payment_term", label: "Payment Terms" },
    { prefix: "role", label: "Roles" },
    { prefix: "user", label: "Users" },
    { prefix: "user-role", label: "User Roles" },
    { prefix: "user-permission", label: "User Permissions" },
    { prefix: "sync", label: "Business Central Sync" },
  ];

/** Where a permission with no `module.action` shape is collected. */
export const UNGROUPED_MODULE_KEY = "other";
export const UNGROUPED_MODULE_LABEL = "Other";
