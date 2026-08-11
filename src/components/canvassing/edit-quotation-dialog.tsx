"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as React from "react";

import {
  acceptAttachments,
  QuotationAttachmentsField,
} from "@/components/canvassing/quotation-attachments-field";
import {
  clearPatchedErrors,
  emptyQuotationDraft,
  type QuotationDraft,
  type QuotationFieldErrors,
  QuotationFormFields,
  quotationTotal,
  validateQuotationDraft,
} from "@/components/canvassing/quotation-form-fields";
import { QuotationItemPricingTable } from "@/components/canvassing/quotation-item-pricing-table";
import { flexScrollAreaClass } from "@/components/shared/scroll-area-classes";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/components/ui/toast";
import {
  canvassingKeys,
  type Quotation,
  quotationDetailQuery,
  updateQuotation,
} from "@/modules/canvassing";
import {
  type PurchaseRequestItem,
  purchaseRequestKeys,
} from "@/modules/purchase-requests";

/**
 * Corrects a quote already in the comparison. Two upstream constraints shape
 * it: the write is a full replace, so the form covers **every** item the quote
 * prices rather than the row it was opened from; and document deletion only
 * runs when a new file is uploaded in the same call, so attachments are
 * add-only rather than offering a Remove that sometimes does nothing.
 */

function draftFrom(quotation: Quotation | null): QuotationDraft {
  if (!quotation) return emptyQuotationDraft();

  return {
    // Neither collection has a by-id read upstream, so the raw id is the only
    // label there is until the user picks from the lookup.
    vendor: { id: quotation.vendor_id, label: quotation.vendor_id },
    paymentTerm: {
      id: quotation.payment_term_id,
      label: quotation.payment_term_id,
    },
    referenceNo: quotation.reference_no,
    // `<input type="date">` takes `YYYY-MM-DD`; the upstream encodes a
    // `datetime.date`, but the slice also covers a value carrying a time.
    date: quotation.date.slice(0, 10),
    deliveryDate: quotation.delivery_date.slice(0, 10),
    unitPrices: Object.fromEntries(
      quotation.item_pricing.map((pricing) => [
        pricing.item_id,
        String(pricing.unit_price),
      ]),
    ),
  };
}

export function EditQuotationDialog({
  quotation,
  open,
  onOpenChange,
  purchaseRequestId,
  items,
}: {
  quotation: Quotation | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  purchaseRequestId: string;
  /** Every item on the request — a quote may price more than one of them. */
  items: PurchaseRequestItem[];
}) {
  const queryClient = useQueryClient();

  const [draft, setDraft] = React.useState<QuotationDraft>(() =>
    draftFrom(quotation),
  );
  const [attachments, setAttachments] = React.useState<File[]>([]);
  const [fieldErrors, setFieldErrors] = React.useState<QuotationFieldErrors>(
    {},
  );

  // Reopening for a different quote has to reset the whole form, including the
  // files queued against the last one.
  const [lastOpenedFor, setLastOpenedFor] = React.useState<string | null>(null);
  const openedFor = open ? (quotation?._id ?? null) : null;
  if (openedFor !== lastOpenedFor) {
    setLastOpenedFor(openedFor);
    setDraft(draftFrom(quotation));
    setAttachments([]);
    setFieldErrors({});
  }

  // Only for the existing-documents list; every other field is on the row.
  const { data: detail, isPending: loadingDocuments } = useQuery({
    ...quotationDetailQuery(quotation?._id ?? ""),
    enabled: open && Boolean(quotation),
  });

  const { mutate: save, isPending: saving } = useMutation({
    mutationFn: updateQuotation,
    onSuccess: (_updated, variables) => {
      toast.add({
        title: `${variables.payload.reference_no} updated`,
        type: "success",
      });

      // Prefixed by `["canvassing"]`, so this also drops the cached detail the
      // sheet reads. The request detail carries the item statuses beside it.
      queryClient.invalidateQueries({ queryKey: canvassingKeys.all });
      queryClient.invalidateQueries({
        queryKey: purchaseRequestKeys.detail(purchaseRequestId),
      });

      onOpenChange(false);
    },
    onError: (mutationError) => {
      toast.add({
        title: "Couldn't update this quote",
        description:
          mutationError instanceof Error
            ? mutationError.message
            : "Something went wrong.",
        type: "error",
      });
    },
  });

  if (!quotation) return null;

  // A priced item the request no longer lists can't be rendered or repriced,
  // but its id still goes into the payload so the replacing write can't drop it.
  const quotationId = quotation._id;
  const itemIds = quotation.item_pricing.map((pricing) => pricing.item_id);
  const byId = new Map(items.map((item) => [item._id, item]));
  const pricedItems = itemIds
    .map((itemId) => byId.get(itemId))
    .filter((item): item is PurchaseRequestItem => Boolean(item));
  const unresolved = itemIds.length - pricedItems.length;

  function patchDraft(patch: Partial<QuotationDraft>) {
    setDraft((current) => ({ ...current, ...patch }));
    setFieldErrors((current) => clearPatchedErrors(current, patch));
  }

  function addAttachments(files: FileList | null) {
    const { accepted, error: rejected } = acceptAttachments(files);

    setAttachments((current) => [...current, ...accepted]);
    setFieldErrors((current) => ({ ...current, attachments: rejected }));
  }

  function submit() {
    const result = validateQuotationDraft(draft, itemIds);

    if ("errors" in result) {
      // An oversized-file warning is about the picker, not the draft, so it
      // survives a failed check of the fields.
      setFieldErrors({
        ...result.errors,
        attachments: fieldErrors.attachments,
      });
      return;
    }

    setFieldErrors({});
    save({ quotationId, payload: result.payload, attachments });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col gap-0 p-0 sm:max-w-[720px]">
        <DialogHeader className="gap-1 border-b px-5 py-4 pr-12">
          <DialogTitle>Edit quote {quotation.reference_no}</DialogTitle>
          <DialogDescription>
            Saving replaces the whole quote, every item it prices included. It
            doesn&apos;t change which vendor is awarded.
          </DialogDescription>
        </DialogHeader>

        {/* Not a plain `overflow-y-auto` column: `Card` is `overflow-hidden`,
            which drops a flex item's automatic min-height to zero, so the
            cards would be squeezed into clipping instead of scrolling. */}
        <ScrollArea className={flexScrollAreaClass}>
          <div className="flex flex-col gap-4 px-5 py-4">
            <QuotationFormFields
              draft={draft}
              errors={fieldErrors}
              onChange={patchDraft}
              disabled={saving}
            />

            <QuotationItemPricingTable
              items={pricedItems}
              unitPrices={draft.unitPrices}
              pricingError={fieldErrors.pricing}
              total={quotationTotal(pricedItems, draft.unitPrices)}
              onPriceChange={(itemId, value) =>
                patchDraft({
                  unitPrices: { ...draft.unitPrices, [itemId]: value },
                })
              }
            />

            {unresolved > 0 ? (
              <p className="text-xs text-muted-foreground">
                {unresolved} priced {unresolved === 1 ? "item is" : "items are"}{" "}
                no longer on this request and can&apos;t be edited here. Their
                prices are kept as they are.
              </p>
            ) : null}

            <QuotationAttachmentsField
              attachments={attachments}
              error={fieldErrors.attachments}
              onAdd={addAttachments}
              onRemove={(index) =>
                setAttachments((current) =>
                  current.filter((_, position) => position !== index),
                )
              }
              documents={detail?.documents}
              loadingDocuments={loadingDocuments}
            />
          </div>
        </ScrollArea>

        <div className="flex items-center justify-end gap-2 rounded-b-xl border-t bg-accent px-5 py-3.5">
          <Button
            variant="outline"
            disabled={saving}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button disabled={saving} onClick={submit}>
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
