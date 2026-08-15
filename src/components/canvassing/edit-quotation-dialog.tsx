"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileTextIcon } from "lucide-react";
import * as React from "react";

import {
  MAX_ATTACHMENT_BYTES,
  QuotationAttachmentsControl,
} from "@/components/canvassing/quotation-attachments-field";
import {
  QuotationItemPricingRows,
  QuotationPricingTotal,
} from "@/components/canvassing/quotation-item-pricing-table";
import { LookupPicker } from "@/components/shared/lookup-picker";
import { ErrorAlert } from "@/components/shared/query-states";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/toast";
import { toDateInputValue } from "@/lib/date";
import type { SelectedOption } from "@/lib/lookup";
import {
  canvassingKeys,
  type QuotationDetail,
  quotationDetailQuery,
  updateQuotation,
} from "@/modules/canvassing";
import { fetchPaymentTerms, paymentTermKeys } from "@/modules/payment-terms";
import {
  fetchVendorOptions,
  purchaseRequestDetailQuery,
  purchaseRequestKeys,
} from "@/modules/purchase-requests";

/**
 * Rewrites one vendor's quote, in place on the comparison screen.
 *
 * `PUT /quotations/{id}` reuses the create endpoint's parser upstream, so this
 * is a full replace and not a patch — every field the create form collects has
 * to go back up, which is why the dialog carries the whole form rather than a
 * narrower one.
 *
 * Two things it deliberately cannot do. The set of priced items is fixed to
 * what the quote already covers, because adding an item to an existing quote
 * is a different operation than repricing one. And attachments can only be
 * added: the upstream removes files from a query param whose handling only
 * runs when a new upload accompanies it, so a removal-only save would silently
 * do nothing.
 */

/** Both pickers page through the BFF; only their fetcher differs. */
const loadVendorPage = fetchVendorOptions;
const loadPaymentTermPage = fetchPaymentTerms;

interface FieldErrors {
  vendor?: string;
  referenceNo?: string;
  date?: string;
  deliveryDate?: string;
  paymentTerm?: string;
  pricing?: string;
  attachments?: string;
}

interface Draft {
  vendor: SelectedOption | null;
  paymentTerm: SelectedOption | null;
  referenceNo: string;
  date: string;
  deliveryDate: string;
  unitPrices: Record<string, string>;
  attachments: File[];
}

const EMPTY_DRAFT: Draft = {
  vendor: null,
  paymentTerm: null,
  referenceNo: "",
  date: "",
  deliveryDate: "",
  unitPrices: {},
  attachments: [],
};

function draftFrom(quotation: QuotationDetail): Draft {
  const { vendor, payment_term: paymentTerm } = quotation;

  return {
    // Both joins are preserved-null upstream, so a quote whose vendor or term
    // was deleted seeds an empty picker and has to be re-picked before saving.
    vendor: vendor
      ? { id: vendor._id, label: vendor.name?.trim() || vendor.no }
      : null,
    paymentTerm: paymentTerm
      ? {
          id: paymentTerm._id,
          label:
            paymentTerm.title?.trim() ||
            paymentTerm.description ||
            paymentTerm._id,
        }
      : null,
    referenceNo: quotation.reference_no,
    // The response carries full timestamps; a date input takes YYYY-MM-DD.
    date: toDateInputValue(quotation.date),
    deliveryDate: toDateInputValue(quotation.delivery_date),
    unitPrices: Object.fromEntries(
      quotation.item_pricing.map((pricing) => [
        pricing.item_id,
        String(pricing.unit_price),
      ]),
    ),
    // Only ever new uploads; the quote's existing files are listed read-only.
    attachments: [],
  };
}

export function EditQuotationDialog({
  purchaseRequestId,
  quotationId,
  open,
  onOpenChange,
}: {
  purchaseRequestId: string;
  /** Null while nothing is being edited; the dialog renders nothing at all. */
  quotationId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();

  const {
    data: quotation,
    isPending: loadingQuotation,
    isError: quotationFailed,
    error: quotationError,
  } = useQuery({
    ...quotationDetailQuery(quotationId ?? ""),
    enabled: open && Boolean(quotationId),
  });

  // The same entry the canvassing screen behind this dialog already holds.
  const { data: request } = useQuery({
    ...purchaseRequestDetailQuery(purchaseRequestId),
    enabled: open,
  });

  const [draft, setDraft] = React.useState<Draft>(EMPTY_DRAFT);
  const [fieldErrors, setFieldErrors] = React.useState<FieldErrors>({});

  /**
   * Seeds the form from the fetched quote, once per opening. Keying on the
   * quote's id rather than on `open` alone is what keeps a background refetch
   * from overwriting what the user has typed, while still re-seeding when the
   * dialog is closed and opened again.
   */
  const openedFor = open && quotation ? quotation._id : null;
  const [seededFor, setSeededFor] = React.useState<string | null>(null);

  if (openedFor !== seededFor) {
    setSeededFor(openedFor);
    if (openedFor && quotation) {
      setDraft(draftFrom(quotation));
      setFieldErrors({});
    }
  }

  const {
    mutate: save,
    isPending: saving,
    error: saveError,
  } = useMutation({
    mutationFn: updateQuotation,
    onSuccess: (updated) => {
      toast.add({
        title: "Quote updated",
        description: `${updated.reference_no} has been revised in the comparison.`,
        type: "success",
      });

      // `canvassingKeys.all` is `["canvassing"]`, so this covers the comparison,
      // the canvassing list and this quote's own detail entry in one.
      queryClient.invalidateQueries({ queryKey: canvassingKeys.all });
      queryClient.invalidateQueries({
        queryKey: purchaseRequestKeys.detail(purchaseRequestId),
      });

      onOpenChange(false);
    },
  });

  function patch(values: Partial<Draft>) {
    setDraft((current) => ({ ...current, ...values }));
  }

  function clearFieldError(field: keyof FieldErrors) {
    setFieldErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  /**
   * The quote decides which items are priced, in its own order; the request
   * supplies their names and quantities. A priced item the request doesn't
   * carry belongs to another request and is dropped rather than rendered
   * nameless.
   */
  const items =
    quotation && request
      ? quotation.item_pricing
          .map((pricing) =>
            request.items.find((item) => item._id === pricing.item_id),
          )
          .filter((item) => item !== undefined)
      : [];

  const total = items.reduce(
    (sum, item) =>
      sum + item.quantity * (Number(draft.unitPrices[item._id]) || 0),
    0,
  );

  function validate() {
    const nextErrors: FieldErrors = {};

    if (!draft.vendor)
      nextErrors.vendor = "Pick the vendor this quote came from.";
    if (!draft.referenceNo.trim())
      nextErrors.referenceNo = "Quote reference number is required.";
    if (!draft.date) nextErrors.date = "Quote date is required.";
    if (!draft.deliveryDate)
      nextErrors.deliveryDate = "Delivery date is required.";
    if (!draft.paymentTerm)
      nextErrors.paymentTerm = "Payment terms are required.";

    const priced = items.map((item) => ({
      item_id: item._id,
      unit_price: Number(draft.unitPrices[item._id]),
    }));

    if (priced.length === 0) {
      nextErrors.pricing = "This quote prices nothing on this request.";
    } else if (priced.some((price) => !Number.isFinite(price.unit_price))) {
      nextErrors.pricing = "Every item needs a unit price.";
    } else if (priced.some((price) => price.unit_price < 0)) {
      nextErrors.pricing = "Unit prices can't be negative.";
    }

    setFieldErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0 || !quotationId) return null;

    return {
      quotationId,
      payload: {
        reference_no: draft.referenceNo.trim(),
        date: draft.date,
        delivery_date: draft.deliveryDate,
        // The picker's id is the vendor's Mongo `_id`, which is what the
        // upstream `vendor_id` wants — not the ERP field of the same name.
        vendor_id: draft.vendor?.id ?? "",
        payment_term_id: draft.paymentTerm?.id ?? "",
        item_pricing: priced,
      },
      attachments: draft.attachments,
    };
  }

  function submit() {
    const input = validate();
    if (input) save(input);
  }

  function addAttachments(files: FileList | null) {
    if (!files || files.length === 0) return;

    const picked = Array.from(files);
    const oversized = picked.filter((file) => file.size > MAX_ATTACHMENT_BYTES);

    patch({
      attachments: [
        ...draft.attachments,
        ...picked.filter((file) => file.size <= MAX_ATTACHMENT_BYTES),
      ],
    });

    setFieldErrors((current) => ({
      ...current,
      attachments:
        oversized.length > 0
          ? `${oversized.map((file) => file.name).join(", ")} — each file must be under 10 MB.`
          : undefined,
    }));
  }

  if (!quotationId) return null;

  const loading = loadingQuotation || !request;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!saving) onOpenChange(next);
      }}
    >
      <DialogContent
        className="flex max-h-[90vh] flex-col gap-0 p-0 sm:max-w-[720px]"
        showCloseButton={!saving}
      >
        <DialogHeader className="gap-1 border-b px-5 py-4 pr-12">
          <DialogTitle>Edit Vendor Quote</DialogTitle>
          <DialogDescription>
            {quotation
              ? `${quotation.reference_no} · ${items.length} ${
                  items.length === 1 ? "item" : "items"
                } priced by one vendor`
              : "Loading this quote…"}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {quotationFailed ? (
            <div className="px-5 py-4">
              <ErrorAlert
                title="Couldn't load this quote"
                error={quotationError}
              />
            </div>
          ) : loading ? (
            <div className="flex flex-col gap-2 px-5 py-4">
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : (
            <>
              {saveError ? (
                <div className="px-5 pt-4">
                  <ErrorAlert
                    title="Couldn't save this quote"
                    error={saveError}
                  />
                </div>
              ) : null}

              <div className="border-b px-5 py-4">
                <FieldGroup className="sm:grid sm:grid-cols-2 sm:gap-4">
                  <Field
                    className="sm:col-span-2"
                    data-invalid={fieldErrors.vendor ? true : undefined}
                  >
                    <FieldLabel>Vendor</FieldLabel>
                    <LookupPicker
                      value={draft.vendor}
                      queryKey={purchaseRequestKeys.vendorOptions()}
                      loadPage={loadVendorPage}
                      toOption={(record) => ({
                        id: record._id,
                        // Some synced vendors have a blank name; the number is
                        // the only other thing that identifies them.
                        label: record.name?.trim() || record.no,
                        hint: record.no,
                      })}
                      placeholder="Select vendor"
                      searchPlaceholder="Search vendors…"
                      ariaLabel="Vendor"
                      aria-invalid={fieldErrors.vendor ? true : undefined}
                      onSelect={(record) => {
                        patch({
                          vendor: {
                            id: record._id,
                            label: record.name?.trim() || record.no,
                          },
                        });
                        clearFieldError("vendor");
                      }}
                    />
                    <FieldDescription>
                      The saved vendor reads as an id until you pick one — the
                      backend joins no name onto a quote.
                    </FieldDescription>
                    {fieldErrors.vendor ? (
                      <FieldError>{fieldErrors.vendor}</FieldError>
                    ) : null}
                  </Field>

                  <Field
                    data-invalid={fieldErrors.referenceNo ? true : undefined}
                  >
                    <FieldLabel htmlFor="edit-quote-ref">
                      Quote Reference No.
                    </FieldLabel>
                    <Input
                      id="edit-quote-ref"
                      name="referenceNo"
                      value={draft.referenceNo}
                      placeholder="Vendor's quotation number"
                      aria-invalid={fieldErrors.referenceNo ? true : undefined}
                      onChange={(event) => {
                        patch({ referenceNo: event.target.value });
                        clearFieldError("referenceNo");
                      }}
                    />
                    {fieldErrors.referenceNo ? (
                      <FieldError>{fieldErrors.referenceNo}</FieldError>
                    ) : null}
                  </Field>

                  <Field
                    data-invalid={fieldErrors.paymentTerm ? true : undefined}
                  >
                    <FieldLabel>Payment Terms</FieldLabel>
                    <LookupPicker
                      value={draft.paymentTerm}
                      queryKey={paymentTermKeys.options()}
                      loadPage={loadPaymentTermPage}
                      toOption={(record) => ({
                        id: record._id,
                        // Seeded terms occasionally have a blank title; the
                        // description is the only other thing that names them.
                        label:
                          record.title?.trim() ||
                          record.description ||
                          record._id,
                        hint: record.description || undefined,
                      })}
                      placeholder="Select terms"
                      searchPlaceholder="Search payment terms…"
                      ariaLabel="Payment terms"
                      aria-invalid={fieldErrors.paymentTerm ? true : undefined}
                      onSelect={(record) => {
                        patch({
                          paymentTerm: {
                            id: record._id,
                            label:
                              record.title?.trim() ||
                              record.description ||
                              record._id,
                          },
                        });
                        clearFieldError("paymentTerm");
                      }}
                    />
                    <FieldDescription>
                      Also an id until reselected, for the same reason.
                    </FieldDescription>
                    {fieldErrors.paymentTerm ? (
                      <FieldError>{fieldErrors.paymentTerm}</FieldError>
                    ) : null}
                  </Field>

                  <Field data-invalid={fieldErrors.date ? true : undefined}>
                    <FieldLabel htmlFor="edit-quote-date">
                      Quote Date
                    </FieldLabel>
                    <Input
                      id="edit-quote-date"
                      name="date"
                      type="date"
                      value={draft.date}
                      aria-invalid={fieldErrors.date ? true : undefined}
                      onChange={(event) => {
                        patch({ date: event.target.value });
                        clearFieldError("date");
                      }}
                    />
                    {fieldErrors.date ? (
                      <FieldError>{fieldErrors.date}</FieldError>
                    ) : null}
                  </Field>

                  <Field
                    data-invalid={fieldErrors.deliveryDate ? true : undefined}
                  >
                    <FieldLabel htmlFor="edit-delivery-date">
                      Delivery Date
                    </FieldLabel>
                    <Input
                      id="edit-delivery-date"
                      name="deliveryDate"
                      type="date"
                      value={draft.deliveryDate}
                      aria-invalid={fieldErrors.deliveryDate ? true : undefined}
                      onChange={(event) => {
                        patch({ deliveryDate: event.target.value });
                        clearFieldError("deliveryDate");
                      }}
                    />
                    <FieldDescription>
                      A date, not a lead time — the backend stores no estimate.
                    </FieldDescription>
                    {fieldErrors.deliveryDate ? (
                      <FieldError>{fieldErrors.deliveryDate}</FieldError>
                    ) : null}
                  </Field>
                </FieldGroup>
              </div>

              <div className="flex flex-col gap-3 border-b py-4">
                <div className="flex items-center justify-between gap-2 px-5">
                  <p className="font-medium">Item Pricing</p>
                  <span className="text-xs text-muted-foreground">
                    {items.length === 1
                      ? "The item this quote covers"
                      : "Every item this quote covers"}
                  </span>
                </div>
                <QuotationItemPricingRows
                  items={items}
                  unitPrices={draft.unitPrices}
                  pricingError={fieldErrors.pricing}
                  onPriceChange={(itemId, value) => {
                    patch({
                      unitPrices: { ...draft.unitPrices, [itemId]: value },
                    });
                    clearFieldError("pricing");
                  }}
                />
                <div className="flex items-center justify-between gap-2 px-5">
                  <QuotationPricingTotal
                    pricingError={fieldErrors.pricing}
                    total={total}
                  />
                </div>
              </div>

              {quotation.documents.length > 0 ? (
                <div className="flex flex-col gap-2 border-b px-5 py-4">
                  <p className="font-medium">Existing Documents</p>
                  <ul className="flex flex-col gap-1">
                    {quotation.documents.map((document) => (
                      <li key={document._id}>
                        <a
                          href={document.url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-2 text-xs text-primary hover:underline"
                        >
                          <FileTextIcon
                            data-icon="inline-start"
                            className="size-3.5"
                          />
                          {document.filename}
                        </a>
                      </li>
                    ))}
                  </ul>
                  {/* The upstream reads its delete list from a query param and
                      only acts on it when a new file is uploaded in the same
                      request, so removal isn't offered rather than offered
                      unreliably. */}
                  <p className="text-xs text-muted-foreground">
                    Files already on this quote can&apos;t be removed here.
                    Anything added below is appended to them.
                  </p>
                </div>
              ) : null}

              <div className="flex flex-col gap-3 px-5 py-4">
                <p className="font-medium">Quotation Documents</p>
                <QuotationAttachmentsControl
                  attachments={draft.attachments}
                  error={fieldErrors.attachments}
                  onAdd={addAttachments}
                  onRemove={(index) =>
                    patch({
                      attachments: draft.attachments.filter(
                        (_, position) => position !== index,
                      ),
                    })
                  }
                />
              </div>
            </>
          )}
        </div>

        <div className="flex items-center gap-3 rounded-b-xl border-t bg-accent px-5 py-3.5">
          <p className="min-w-0 text-xs text-muted-foreground">
            Saving rewrites this quote wherever it appears in the comparison. It
            does not change which vendor is awarded.
          </p>
          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="outline"
              disabled={saving}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              disabled={saving || loading || quotationFailed}
              onClick={submit}
            >
              {saving ? "Saving…" : "Save Changes"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
