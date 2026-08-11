"use client";

import { LookupPicker } from "@/components/shared/lookup-picker";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { SelectedOption } from "@/lib/lookup";
import type { CreateQuotationDto } from "@/modules/canvassing";
import { fetchPaymentTerms, paymentTermKeys } from "@/modules/payment-terms";
import {
  fetchVendorOptions,
  purchaseRequestKeys,
} from "@/modules/purchase-requests";

/**
 * The scalar fields of a quote, shared by the new-quote page and the edit
 * dialog. The upstream declares one form dependency for the create and the
 * update alike, so both surfaces submit the same shape and have to agree on
 * the error copy too.
 */

/** Both pickers page through the BFF; only their fetcher differs. */
const loadVendorPage = fetchVendorOptions;
const loadPaymentTermPage = fetchPaymentTerms;

export interface QuotationDraft {
  vendor: SelectedOption | null;
  paymentTerm: SelectedOption | null;
  referenceNo: string;
  date: string;
  deliveryDate: string;
  /** Keyed by purchase request item id; strings, because they come off inputs. */
  unitPrices: Record<string, string>;
}

export interface QuotationFieldErrors {
  vendor?: string;
  referenceNo?: string;
  date?: string;
  deliveryDate?: string;
  paymentTerm?: string;
  pricing?: string;
  attachments?: string;
}

export function emptyQuotationDraft(): QuotationDraft {
  return {
    vendor: null,
    paymentTerm: null,
    referenceNo: "",
    date: "",
    deliveryDate: "",
    unitPrices: {},
  };
}

/** Draft and error keys line up, bar the pricing grid, so a patch says which errors it resolves. */
export function clearPatchedErrors(
  errors: QuotationFieldErrors,
  patch: Partial<QuotationDraft>,
): QuotationFieldErrors {
  const next = { ...errors };

  for (const key of Object.keys(patch)) {
    if (key === "unitPrices") delete next.pricing;
    else delete next[key as keyof QuotationFieldErrors];
  }

  return next;
}

export function quotationTotal(
  items: { _id: string; quantity: number }[],
  unitPrices: Record<string, string>,
) {
  return items.reduce(
    (sum, item) => sum + item.quantity * (Number(unitPrices[item._id]) || 0),
    0,
  );
}

/**
 * `itemIds` has to be every item the quote prices, not just the ones on
 * screen: the update replaces the quote upstream, so an id left out here
 * loses its price.
 */
export function validateQuotationDraft(
  draft: QuotationDraft,
  itemIds: string[],
): { errors: QuotationFieldErrors } | { payload: CreateQuotationDto } {
  const errors: QuotationFieldErrors = {};

  if (!draft.vendor) errors.vendor = "Pick the vendor this quote came from.";
  if (!draft.referenceNo.trim())
    errors.referenceNo = "Quote reference number is required.";
  if (!draft.date) errors.date = "Quote date is required.";
  if (!draft.deliveryDate) errors.deliveryDate = "Delivery date is required.";
  if (!draft.paymentTerm) errors.paymentTerm = "Payment terms are required.";

  const priced = itemIds.map((itemId) => ({
    item_id: itemId,
    unit_price: Number(draft.unitPrices[itemId]),
  }));

  if (priced.length === 0) {
    errors.pricing = "Price at least one item.";
  } else if (priced.some((price) => !Number.isFinite(price.unit_price))) {
    errors.pricing = "Every item needs a unit price.";
  } else if (priced.some((price) => price.unit_price < 0)) {
    errors.pricing = "Unit prices can't be negative.";
  }

  if (Object.keys(errors).length > 0) return { errors };

  return {
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
  };
}

export function QuotationFormFields({
  draft,
  errors,
  onChange,
  disabled,
}: {
  draft: QuotationDraft;
  errors: QuotationFieldErrors;
  /** Merged into the draft; clearing the errors it resolves is the caller's. */
  onChange: (patch: Partial<QuotationDraft>) => void;
  disabled?: boolean;
}) {
  return (
    <FieldGroup className="sm:grid sm:grid-cols-2 sm:gap-4">
      <Field
        className="sm:col-span-2"
        data-invalid={errors.vendor ? true : undefined}
      >
        <FieldLabel>Vendor</FieldLabel>
        <LookupPicker
          value={draft.vendor}
          queryKey={purchaseRequestKeys.vendorOptions()}
          loadPage={loadVendorPage}
          toOption={(record) => ({
            id: record._id,
            // Some synced vendors have a blank name; the number is the
            // only other thing that identifies them.
            label: record.name?.trim() || record.no,
            hint: record.no,
          })}
          placeholder="Select vendor"
          searchPlaceholder="Search vendors…"
          ariaLabel="Vendor"
          disabled={disabled}
          aria-invalid={errors.vendor ? true : undefined}
          onSelect={(record) =>
            onChange({
              vendor: {
                id: record._id,
                label: record.name?.trim() || record.no,
              },
            })
          }
        />
        {errors.vendor ? <FieldError>{errors.vendor}</FieldError> : null}
      </Field>

      <Field data-invalid={errors.referenceNo ? true : undefined}>
        <FieldLabel htmlFor="quote-ref">Quote Reference No.</FieldLabel>
        <Input
          id="quote-ref"
          name="referenceNo"
          value={draft.referenceNo}
          placeholder="Vendor's quotation number"
          disabled={disabled}
          aria-invalid={errors.referenceNo ? true : undefined}
          onChange={(event) => onChange({ referenceNo: event.target.value })}
        />
        {errors.referenceNo ? (
          <FieldError>{errors.referenceNo}</FieldError>
        ) : null}
      </Field>

      <Field data-invalid={errors.paymentTerm ? true : undefined}>
        <FieldLabel>Payment Terms</FieldLabel>
        <LookupPicker
          value={draft.paymentTerm}
          queryKey={paymentTermKeys.options()}
          loadPage={loadPaymentTermPage}
          toOption={(record) => ({
            id: record._id,
            // Seeded terms occasionally have a blank title; the
            // description is the only other thing that names them.
            label: record.title?.trim() || record.description || record._id,
            hint: record.description || undefined,
          })}
          placeholder="Select terms"
          searchPlaceholder="Search payment terms…"
          ariaLabel="Payment terms"
          disabled={disabled}
          aria-invalid={errors.paymentTerm ? true : undefined}
          onSelect={(record) =>
            onChange({
              paymentTerm: {
                id: record._id,
                label: record.title?.trim() || record.description || record._id,
              },
            })
          }
        />
        {errors.paymentTerm ? (
          <FieldError>{errors.paymentTerm}</FieldError>
        ) : null}
      </Field>

      <Field data-invalid={errors.date ? true : undefined}>
        <FieldLabel htmlFor="quote-date">Quote Date</FieldLabel>
        <Input
          id="quote-date"
          name="date"
          type="date"
          value={draft.date}
          disabled={disabled}
          aria-invalid={errors.date ? true : undefined}
          onChange={(event) => onChange({ date: event.target.value })}
        />
        {errors.date ? <FieldError>{errors.date}</FieldError> : null}
      </Field>

      <Field data-invalid={errors.deliveryDate ? true : undefined}>
        <FieldLabel htmlFor="delivery-date">Delivery Date</FieldLabel>
        <Input
          id="delivery-date"
          name="deliveryDate"
          type="date"
          value={draft.deliveryDate}
          disabled={disabled}
          aria-invalid={errors.deliveryDate ? true : undefined}
          onChange={(event) => onChange({ deliveryDate: event.target.value })}
        />
        <FieldDescription>
          A date, not a lead time — the backend stores no estimate.
        </FieldDescription>
        {errors.deliveryDate ? (
          <FieldError>{errors.deliveryDate}</FieldError>
        ) : null}
      </Field>
    </FieldGroup>
  );
}
