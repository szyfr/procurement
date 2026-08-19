/**
 * The FAQ catalogue: every question the Help page offers, and its answer.
 *
 * Copy only — nothing here is fetched. Answers are written against what the
 * backend actually does and use the labels the screens actually show, so a
 * wording change on a button belongs here too. Where a capability is missing —
 * approval routing, notifications, purchase order management — the answer says
 * so rather than implying it exists.
 */

export interface FaqCategory {
  id: string;
  label: string;
}

/** A paragraph, a bulleted list, or a term/description list. */
export type FaqBlock =
  | { kind: "text"; text: string }
  | { kind: "list"; items: string[] }
  | { kind: "terms"; items: { term: string; description: string }[] };

export interface FaqEntry {
  id: string;
  /** Matches a `FaqCategory.id`. */
  category: string;
  question: string;
  answer: FaqBlock[];
}

/** Declaration order is the order the page renders the sections in. */
export const faqCategories: FaqCategory[] = [
  { id: "getting-started", label: "Getting Started" },
  { id: "statuses", label: "Statuses & Progress" },
  { id: "approvals", label: "Approvals & Changes" },
  { id: "canvassing", label: "Canvassing & Quotations" },
  { id: "orders", label: "Orders & Deliveries" },
  { id: "access", label: "Access & Accounts" },
  { id: "reference", label: "Catalog, Reports & Data" },
];

export const faqEntries: FaqEntry[] = [
  // Getting Started
  {
    id: "what-is-a-purchase-request",
    category: "getting-started",
    question: "What is a Purchase Request?",
    answer: [
      {
        kind: "text",
        text: "A Purchase Request — a PR — is how you ask for materials to be bought. It records what you need and how much, which department it is for, when you need it by, and why. Each request gets its own reference number, shown at the top of the request page.",
      },
      {
        kind: "text",
        text: "Everything else in the module hangs off a purchase request: vendor quotes, vendor selection, ordering and delivery are all tracked against the individual items on it.",
      },
    ],
  },
  {
    id: "how-do-i-create-a-request",
    category: "getting-started",
    question: "How do I create a Purchase Request?",
    answer: [
      {
        kind: "text",
        text: "Open Purchase Requests in the sidebar and choose New Purchase Request. The same button is on the Dashboard. Fill in the request details, add one line per item you need, then either Save as Draft to come back to it later, or Submit for Approval to send it in straight away.",
      },
      {
        kind: "text",
        text: "If you do not see the button, your account does not have permission to raise requests — ask an administrator for it.",
      },
    ],
  },
  {
    id: "what-do-i-need-to-submit",
    category: "getting-started",
    question: "What information do I need before I can submit a request?",
    answer: [
      {
        kind: "text",
        text: "Five things are required, and you will be told which one is missing if you try to submit without it:",
      },
      {
        kind: "list",
        items: [
          "Title — there is no automatic naming, so give the request one.",
          "Department — the department the purchase is for.",
          "Date Needed — when you need the items by.",
          "Justification — why the purchase is needed.",
          "At least one item picked from the catalog, with a quantity greater than zero.",
        ],
      },
      {
        kind: "text",
        text: "Priority is optional and defaults to Normal; the other choices are Low and High. On a line whose Sourcing reads Direct, pick the vendor on the form as well. A line that reads Needs Canvassing leaves its Vendor cell empty on purpose — that vendor is decided during canvassing.",
      },
    ],
  },
  {
    id: "what-happens-after-i-submit",
    category: "getting-started",
    question: "What happens after I submit a request?",
    answer: [
      {
        kind: "text",
        text: "Submitting moves the request to Pending Approval. The system then works through the line items one at a time and sends each one where it belongs:",
      },
      {
        kind: "list",
        items: [
          "An item that needs canvassing goes out for vendor quotes and reads Canvassing.",
          "An item that can be bought directly is ordered from its vendor and reads PO Created.",
          "An item that fails one of the automatic checks reads Rejected.",
        ],
      },
      {
        kind: "text",
        text: "The request's own status is then set from where its items ended up, so a request whose items went different ways shows the stage that still needs work. Nothing is assigned to a person to approve — see “Who approves my Purchase Request?” under Approvals & Changes.",
      },
    ],
  },
  {
    id: "where-do-i-track-requests",
    category: "getting-started",
    question: "Where do I track my requests?",
    answer: [
      {
        kind: "text",
        text: "Purchase Requests lists everything, as cards or as a table — use the view toggle beside the page title. You can filter by Status, Priority and Department, and the filter box narrows the list as you type.",
      },
      {
        kind: "text",
        text: "The search box in the top bar searches purchase requests from anywhere in the module. Both search boxes match a request's title and justification only — not its reference number, requester or department.",
      },
    ],
  },
  {
    id: "does-the-system-notify-me",
    category: "getting-started",
    question: "Does the system notify me when something changes?",
    answer: [
      {
        kind: "text",
        text: "No. There is no notification feature yet, so the bell in the top bar stays empty and nothing is emailed.",
      },
      {
        kind: "text",
        text: "What does happen is that the Purchase Requests and Canvassing screens refresh themselves when someone else makes a change, so a page you already have open stays current without reloading it.",
      },
    ],
  },

  // Statuses & Progress
  {
    id: "status-meanings",
    category: "statuses",
    question: "What do the Purchase Request statuses mean?",
    answer: [
      {
        kind: "terms",
        items: [
          {
            term: "Draft",
            description:
              "Saved but not submitted. Still editable, and nothing has been ordered.",
          },
          {
            term: "Pending Approval",
            description:
              "Submitted, and its items are being worked through by the automatic checks.",
          },
          {
            term: "Canvassing",
            description: "At least one item is out for vendor quotes.",
          },
          {
            term: "PO Created",
            description:
              "At least one item has been ordered from its vendor and is waiting to arrive.",
          },
          {
            term: "Partially Completed",
            description:
              "At least one item has had part of its quantity delivered.",
          },
          {
            term: "Completed",
            description:
              "Every item has been delivered and the request has been closed out.",
          },
          {
            term: "Rejected",
            description: "Every item on the request was rejected.",
          },
          {
            term: "Canceled",
            description:
              "The request was withdrawn. It and its items are no longer being processed.",
          },
        ],
      },
      {
        kind: "text",
        text: "The same legend sits above the request list, and each item on a request carries its own status from the same set.",
      },
    ],
  },
  {
    id: "request-vs-item-status",
    category: "statuses",
    question:
      "Why does my request show a different status from the items on it?",
    answer: [
      {
        kind: "text",
        text: "Because the request's status is a roll-up of its items, and items on one request can be at different stages. The roll-up works down this order:",
      },
      {
        kind: "list",
        items: [
          "Every item completed — the request reads Completed.",
          "Every item rejected — the request reads Rejected.",
          "Any item part-delivered — Partially Completed.",
          "Otherwise, any item still in canvassing — Canvassing.",
          "Otherwise, any item ordered — PO Created.",
        ],
      },
      {
        kind: "text",
        text: "The Items table on the request page is where you see exactly where each individual line has got to.",
      },
    ],
  },
  {
    id: "partially-completed",
    category: "statuses",
    question: "What does Partially Completed mean?",
    answer: [
      {
        kind: "text",
        text: "Only some of the ordered quantity has arrived. In the Items table the Qty column then shows received of ordered — for example 4 / 10 — instead of just the quantity.",
      },
      {
        kind: "text",
        text: "An item stays Partially Completed until the rest arrives and it is marked delivered, which is what moves it to Completed.",
      },
    ],
  },

  // Approvals & Changes
  {
    id: "who-approves",
    category: "approvals",
    question: "Who approves my Purchase Request?",
    answer: [
      {
        kind: "text",
        text: "Nobody is assigned as an approver. The module does not have approval routing, approval levels or approver roles — there is no queue a manager works through and no one to chase.",
      },
      {
        kind: "text",
        text: "Submitting hands the request to the automatic checks instead, and those decide each item's outcome. The Submit for Approval button and the Pending Approval status describe that hand-off, not a person's in-tray. The Approval Routing panel on the request form says the same.",
      },
    ],
  },
  {
    id: "why-rejected",
    category: "approvals",
    question: "Why was my request, or one of its items, rejected?",
    answer: [
      {
        kind: "text",
        text: "Rejections are automatic and applied per item. There are two reasons:",
      },
      {
        kind: "terms",
        items: [
          {
            term: "The material is already on another open request",
            description:
              "If the same catalog item sits on a different purchase request and that line is still waiting or already ordered, the new line is rejected as a duplicate.",
          },
          {
            term: "The material is over-consumed",
            description:
              "If the quantity already being consumed is higher than the stock on hand recorded for it, the line is rejected.",
          },
        ],
      },
      {
        kind: "text",
        text: "Other items on the same request carry on unaffected. Only when every item is rejected does the request itself read Rejected.",
      },
    ],
  },
  {
    id: "edit-after-submitting",
    category: "approvals",
    question: "Can I edit a Purchase Request after submitting it?",
    answer: [
      {
        kind: "text",
        text: "No. Continue Editing is offered only while the request is still a Draft. Once it is submitted its items are already being routed, quoted or ordered, so the button goes.",
      },
      {
        kind: "text",
        text: "While it is still a draft you can change anything — title, department, date needed, priority, justification and the item lines. Save Changes keeps it a draft; Submit for Approval saves your changes and submits in one step.",
      },
    ],
  },
  {
    id: "cancel-a-request",
    category: "approvals",
    question: "Can I cancel a request?",
    answer: [
      {
        kind: "text",
        text: "Yes, while there is still work to stop. Cancel Request appears on the request page for a draft, and for a submitted request that has not reached PO Created. Cancelling marks the request and every item on it as Canceled.",
      },
      {
        kind: "text",
        text: "Once a request reads PO Created the button is no longer offered, because the order has already gone to the vendor. Cancelling cannot be undone from the app, which is why it asks you to confirm.",
      },
    ],
  },
  {
    id: "rejected-what-next",
    category: "approvals",
    question: "What do I do if my request was rejected?",
    answer: [
      {
        kind: "text",
        text: "A rejected request cannot be reopened or resubmitted. The request page offers Revise & Resubmit, which starts a fresh purchase request.",
      },
      {
        kind: "text",
        text: "Fix whatever caused the rejection before you submit the new one — for example drop a material that is already on somebody else's open request, or wait for stock to be replenished.",
      },
    ],
  },
  {
    id: "close-out-a-request",
    category: "approvals",
    question: "Everything arrived — why does my request still say PO Created?",
    answer: [
      {
        kind: "text",
        text: "Recording deliveries closes out the individual items, but it does not close the request. That last step is deliberate and manual.",
      },
      {
        kind: "text",
        text: "Once every item on the request reads Completed, a Mark as Completed button appears on the request page. Use it to close the request out. Like cancelling, it cannot be undone from the app.",
      },
    ],
  },

  // Canvassing & Quotations
  {
    id: "what-is-canvassing",
    category: "canvassing",
    question: "What is canvassing?",
    answer: [
      {
        kind: "text",
        text: "Canvassing is collecting quotes from several vendors for an item before deciding who to buy it from. Items that need it are routed there automatically when the request is submitted.",
      },
      {
        kind: "text",
        text: "You record each vendor's quote against the item, compare the quotes side by side, and confirm one vendor. Confirming is what takes the item out of canvassing and on to ordering.",
      },
    ],
  },
  {
    id: "what-goes-to-canvassing",
    category: "canvassing",
    question: "What decides whether an item goes to canvassing?",
    answer: [
      {
        kind: "text",
        text: "The item itself, not the requester. Every entry in the item catalog is marked as either needing canvassing or able to be bought directly, and that setting comes with the catalog — it cannot be changed on the request form.",
      },
      {
        kind: "text",
        text: "The Sourcing column on the request form shows which each line is: Needs Canvassing or Direct. A Direct line lets you pick the vendor there and then; a canvassing line leaves the Vendor cell empty until a vendor is confirmed.",
      },
    ],
  },
  {
    id: "when-can-i-start-canvassing",
    category: "canvassing",
    question: "When can I start canvassing, and where do I do it?",
    answer: [
      {
        kind: "text",
        text: "As soon as the request has been submitted and its items have been routed. A draft has not been routed yet, so there is nothing to quote against.",
      },
      {
        kind: "text",
        text: "There are two ways in. From the request page, use View Canvassing in the Action Panel or on the item's row. Or open Canvassing in the sidebar, which lists every item currently out for quotes across all requests, and use Open on the row.",
      },
    ],
  },
  {
    id: "canvassing-row-statuses",
    category: "canvassing",
    question: "What do the statuses on the Canvassing list mean?",
    answer: [
      {
        kind: "terms",
        items: [
          {
            term: "Awaiting Quotation",
            description: "No vendor quote has been recorded for the item yet.",
          },
          {
            term: "Ready for Comparison",
            description:
              "At least one quote is on file, so the item can be compared and a vendor confirmed.",
          },
          {
            term: "Vendor Selected",
            description:
              "A vendor has been confirmed for the item and canvassing is finished for it.",
          },
        ],
      },
    ],
  },
  {
    id: "how-do-i-add-a-quotation",
    category: "canvassing",
    question: "How do I add a vendor quotation?",
    answer: [
      {
        kind: "text",
        text: "On the request's canvassing screen, tick the items the quote covers and choose Create Quotation for Selected Items. One quote is one vendor's offer and can cover several items at once, each with its own unit price.",
      },
      {
        kind: "text",
        text: "You can also use Add Vendor Quote on a single item in the comparison further down the same screen. Only items routed to canvassing can be quoted — directly-sourced items, and items already ordered, cannot be selected.",
      },
    ],
  },
  {
    id: "what-a-quote-needs",
    category: "canvassing",
    question: "What do I need to record a quote?",
    answer: [
      {
        kind: "text",
        text: "The vendor, a quote reference number, the quote date, the delivery date the vendor offered, the payment terms, and a unit price for every item the quote covers.",
      },
      {
        kind: "text",
        text: "You can attach the vendor's paperwork too — PDF, image, Word, Excel or CSV files, up to 10 files, 10 MB each and 25 MB in total. Saving records the quote and nothing more; picking a winner is a separate step.",
      },
    ],
  },
  {
    id: "how-is-the-vendor-chosen",
    category: "canvassing",
    question: "How is the selected vendor determined?",
    answer: [
      {
        kind: "text",
        text: "You determine it. Each item gets its own comparison table listing every vendor that has quoted it, with unit price, line total, delivery date and quote date. The lowest unit price is highlighted so it is easy to spot.",
      },
      {
        kind: "text",
        text: "Highlighted is not chosen: nothing is awarded automatically, and you are free to pick a dearer quote for a better delivery date. Select the quote you want, then use Confirm Vendor Selection.",
      },
    ],
  },
  {
    id: "different-vendors-per-item",
    category: "canvassing",
    question: "Can different items be awarded to different vendors?",
    answer: [
      {
        kind: "text",
        text: "Yes. A vendor is confirmed one item at a time, so each item on a request can go to whichever vendor quoted it best. The canvassing screen says as much at the top: not all items need to go to the same vendor.",
      },
      {
        kind: "text",
        text: "A single quote covering several items is fine too — confirm it separately against each item it prices.",
      },
    ],
  },
  {
    id: "change-a-vendor-selection",
    category: "canvassing",
    question: "Can I change a vendor selection after confirming it?",
    answer: [
      {
        kind: "text",
        text: "No. Confirming is final. The item is recorded as Vendor Selected against the winning quote, leaves canvassing, and moves on to PO Created.",
      },
      {
        kind: "text",
        text: "There is no way to reverse it or confirm a second vendor for the same item — a repeat attempt is refused. Check the quote before you confirm.",
      },
    ],
  },
  {
    id: "how-many-quotes",
    category: "canvassing",
    question: "How many quotes should I get before confirming a vendor?",
    answer: [
      {
        kind: "text",
        text: "Three is the target, but nothing blocks you: you can confirm a vendor with a single quote on file, and the module will not stop you.",
      },
      {
        kind: "text",
        text: "Three is what the Canvassing Compliance report measures against. It counts canvassed items with at least three quotes as meeting the minimum and the rest as below it, broken down by department.",
      },
    ],
  },

  // Orders & Deliveries
  {
    id: "when-is-a-po-created",
    category: "orders",
    question: "When is a Purchase Order created?",
    answer: [
      {
        kind: "text",
        text: "An item reaches the PO Created stage in one of two ways:",
      },
      {
        kind: "list",
        items: [
          "It was sourced directly, and the order was raised when the request was submitted. Items going to the same vendor are grouped, so that vendor gets one order rather than one per line.",
          "It went through canvassing, and you confirmed a winning vendor for it.",
        ],
      },
      {
        kind: "text",
        text: "From that point the item is tracked to delivery on the request page.",
      },
    ],
  },
  {
    id: "who-manages-pos",
    category: "orders",
    question: "Who can create or manage Purchase Orders?",
    answer: [
      {
        kind: "text",
        text: "Nobody, directly. There is no Purchase Order screen in this module and no action to create, edit or cancel one — ordering follows automatically from the two steps above.",
      },
      {
        kind: "text",
        text: "What you can do against an ordered item, on the request page, is record a proof of order and record its delivery.",
      },
    ],
  },
  {
    id: "record-a-delivery",
    category: "orders",
    question: "How do I record a delivery?",
    answer: [
      {
        kind: "text",
        text: "Open the request, tick the items that arrived in the Items table, and use Mark as Delivered. One delivery date applies to everything in the selection, and each item you selected becomes Completed.",
      },
      {
        kind: "text",
        text: "Only items that are PO Created or Partially Completed can be selected — an item that has not been ordered yet has nothing to receive. This cannot be undone from the app.",
      },
    ],
  },
  {
    id: "record-a-partial-delivery",
    category: "orders",
    question: "How do I record a partial delivery?",
    answer: [
      {
        kind: "text",
        text: "Use the actions menu at the end of the item's row and choose Record partial delivery. Enter the total received to date — the running total, not just what came in this time — and the item moves to Partially Completed.",
      },
      {
        kind: "text",
        text: "The figure has to be more than what is already recorded and less than the full ordered quantity. When the whole order has arrived, use Mark as Delivered instead: that is what closes the item out.",
      },
    ],
  },
  {
    id: "automatic-receipts",
    category: "orders",
    question: "Do deliveries ever get recorded on their own?",
    answer: [
      {
        kind: "text",
        text: "Sometimes. Receipts posted against an order in the company's inventory system are matched back to the item here, so it can move to Partially Completed or Completed without anyone touching it, with the posting date as its delivery date.",
      },
      {
        kind: "text",
        text: "That only reaches items the system ordered directly. An item that went through canvassing is never picked up this way, so its delivery always has to be recorded here by hand. Either way you do not have to wait — recording it yourself has the same effect.",
      },
    ],
  },
  {
    id: "proof-of-order",
    category: "orders",
    question: "What is a Proof of Order, and how do I add one?",
    answer: [
      {
        kind: "text",
        text: "It is the paperwork for an order placed with a vendor: their reference number, the delivery date they committed to, and any documents you want kept with it.",
      },
      {
        kind: "text",
        text: "Tick the ordered items in the Items table and use Add Proof of Order. The items are grouped by vendor, because one proof covers one vendor — a selection spanning two vendors is saved as two proofs. PDF, JPG and PNG files can be attached. Proofs can only be added to items at the PO Created stage, and they are listed under Proofs of Order on the request.",
      },
    ],
  },

  // Access & Accounts
  {
    id: "why-cant-i-see-something",
    category: "access",
    question: "Why can't I see a page, a button or an action?",
    answer: [
      {
        kind: "text",
        text: "Access is permission-based throughout. If your account does not hold the permission an action needs, the action is not shown at all rather than shown and disabled, and a page you cannot open tells you so instead of loading.",
      },
      {
        kind: "text",
        text: "A button that is visible but greyed out means something different: you are allowed to do it, just not to what you have currently selected. If something is missing that you need, ask an administrator to grant you the permission.",
      },
    ],
  },
  {
    id: "what-can-each-role-do",
    category: "access",
    question: "What can each user role do?",
    answer: [
      {
        kind: "text",
        text: "There is no fixed list of roles. A role is a name plus the set of permissions it grants, and roles are created by your own organization on the Roles & Permissions page — so what a role can do is whatever it was given.",
      },
      {
        kind: "text",
        text: "Your access is everything your roles grant, plus anything granted to your account individually. Open a role to see exactly which permissions it carries, grouped by area.",
      },
    ],
  },
  {
    id: "who-manages-roles",
    category: "access",
    question: "Who manages users, roles and permissions?",
    answer: [
      {
        kind: "text",
        text: "Anyone holding the matching administration permissions, from the Users and Roles & Permissions pages. From Users you can add a user, edit their details and assign roles; from Roles & Permissions you can create a role and change what it grants.",
      },
      {
        kind: "text",
        text: "Two limits worth knowing: users cannot currently be deleted or deactivated, and a role cannot be deleted once it has been created.",
      },
    ],
  },
  {
    id: "change-my-details",
    category: "access",
    question: "How do I change my password or my own details?",
    answer: [
      {
        kind: "text",
        text: "Open My Account from the menu under your name at the bottom of the sidebar. Your password can be changed there and must be at least 6 characters.",
      },
      {
        kind: "text",
        text: "Your name and email are managed by an administrator, so they are shown but not editable. Your account has no department of its own — the department is chosen on each request.",
      },
    ],
  },

  // Catalog, Reports & Data
  {
    id: "where-do-items-come-from",
    category: "reference",
    question: "Where do the items and vendors come from?",
    answer: [
      {
        kind: "text",
        text: "Both are synced from the company's inventory system and are read-only here — you pick from them, you do not add to them. An item brings its description, unit of measure, stock on hand and its canvassing flag with it.",
      },
      {
        kind: "text",
        text: "Vendors is a directory you can browse but not edit. Departments and Payment Terms, by contrast, are maintained inside this module.",
      },
    ],
  },
  {
    id: "why-no-amounts",
    category: "reference",
    question: "Why don't I see any amounts or costs on a request?",
    answer: [
      {
        kind: "text",
        text: "The item catalog does not carry a price and a request has no amount of its own, so the Amount column is empty everywhere it appears.",
      },
      {
        kind: "text",
        text: "The estimated unit costs and totals on the request form are on-screen working figures only — they are not saved with the request. Real prices enter the picture at canvassing, on the vendor quotes.",
      },
    ],
  },
  {
    id: "what-is-the-department-for",
    category: "reference",
    question: "What is the Department field for?",
    answer: [
      {
        kind: "text",
        text: "It attributes the request to a department. It is not taken from your account — accounts carry no department — so you choose it on the form each time.",
      },
      {
        kind: "text",
        text: "It is also what the Department filter on the request list uses, and what the Spend by Department and Canvassing Compliance reports group by. Departments themselves are maintained on the Departments page.",
      },
    ],
  },
  {
    id: "what-are-payment-terms",
    category: "reference",
    question: "What are Payment Terms used for?",
    answer: [
      {
        kind: "text",
        text: "They are the list you pick from when recording a vendor quote, so a quote captures the terms the vendor offered alongside its prices and delivery date.",
      },
      {
        kind: "text",
        text: "They are maintained on the Payment Terms page and are just a title and a description. Nothing in the module processes invoices or payments.",
      },
    ],
  },
  {
    id: "what-do-reports-show",
    category: "reference",
    question: "What do the reports show?",
    answer: [
      {
        kind: "text",
        text: "Five reports, each run over a date range you choose:",
      },
      {
        kind: "terms",
        items: [
          {
            term: "PR Status Breakdown",
            description:
              "Purchase requests raised in the period, grouped by status.",
          },
          {
            term: "Spend by Department",
            description:
              "Ordered items grouped by the department that requested them.",
          },
          {
            term: "Vendor Performance",
            description:
              "On-time delivery per vendor, and a 1–5 rating derived from it.",
          },
          {
            term: "Canvassing Compliance",
            description:
              "Canvassed items meeting the three-quote minimum, by department.",
          },
          {
            term: "Purchaser Performance",
            description:
              "Request items processed and delivered on time, per purchaser.",
          },
        ],
      },
      {
        kind: "text",
        text: "Each report is permissioned separately, so you see the ones your account covers rather than all or nothing.",
      },
    ],
  },
  {
    id: "dashboard-dashes",
    category: "reference",
    question: "Why do some Dashboard tiles show a dash?",
    answer: [
      {
        kind: "text",
        text: "A dash means the figure has no source yet. The Requiring Your Action and Overdue Deliveries tiles are not tracked, and the Recent Activity and Upcoming Deadlines panels stay empty for the same reason — rather than show invented numbers, they show nothing.",
      },
      {
        kind: "text",
        text: "The Pending Purchase Requests, Pending Quotations and Partially Completed PRs tiles are live, as are the Requests Requiring Action and Pending Quotations panels. A dash on one of those means your account cannot read that data.",
      },
    ],
  },
];

function blockText(block: FaqBlock): string {
  switch (block.kind) {
    case "text":
      return block.text;
    case "list":
      return block.items.join(" ");
    case "terms":
      return block.items
        .map((item) => `${item.term} ${item.description}`)
        .join(" ");
  }
}

/**
 * Lowercased question plus answer text, keyed by entry id. Built once at module
 * scope so filtering doesn't re-flatten every answer on each keystroke.
 */
export const faqSearchText: Record<string, string> = Object.fromEntries(
  faqEntries.map((entry) => [
    entry.id,
    [entry.question, ...entry.answer.map(blockText)].join(" ").toLowerCase(),
  ]),
);
