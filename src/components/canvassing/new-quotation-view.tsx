"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PackageXIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState, ErrorAlert } from "@/components/shared/query-states";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/toast";
import { canvassingKeys, createQuotation } from "@/modules/canvassing";
import {
  purchaseRequestDetailQuery,
  purchaseRequestKeys,
} from "@/modules/purchase-requests";

/**
 * Captures one vendor's quote for the items selected on the canvassing screen.
 *
 * A quote is per-vendor, not per-item: one reference number, one delivery
 * date and one set of payment terms cover every item it prices, which is why
 * the items arrive as a list and only their unit prices vary.
 *
 * Saving records the quote and nothing more; awarding a vendor is a separate
 * step on the comparison screen.
 */

export function NewQuotationView({
  purchaseRequestId,
  itemIds,
}: {
  purchaseRequestId: string;
  itemIds: string[];
}) {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Already cached by the canvassing screen the user came from.
  const {
    data: request,
    isPending,
    isError,
    error,
  } = useQuery(purchaseRequestDetailQuery(purchaseRequestId));

  const [draft, setDraft] = React.useState<QuotationDraft>(emptyQuotationDraft);
  const [attachments, setAttachments] = React.useState<File[]>([]);
  const [fieldErrors, setFieldErrors] = React.useState<QuotationFieldErrors>(
    {},
  );

  const canvassingHref = `/purchase-requests/${purchaseRequestId}/canvassing`;

  const {
    mutate: save,
    isPending: saving,
    error: saveError,
  } = useMutation({
    mutationFn: createQuotation,
    onSuccess: (created) => {
      toast.add({
        title: "Quote saved",
        description: `${created.reference_no} is now in the comparison. Selecting a winner is a separate step.`,
        type: "success",
      });

      // Covers both the comparison and the canvassing list, whose status is
      // derived from whether an item has any quotes at all.
      queryClient.invalidateQueries({ queryKey: canvassingKeys.all });
      queryClient.invalidateQueries({
        queryKey: purchaseRequestKeys.detail(purchaseRequestId),
      });

      router.push(canvassingHref);
    },
  });

  function patchDraft(patch: Partial<QuotationDraft>) {
    setDraft((current) => ({ ...current, ...patch }));
    setFieldErrors((current) => clearPatchedErrors(current, patch));
  }

  if (isError) {
    return (
      <>
        <PageHeader title="Add Vendor Quote" />
        <ErrorAlert title="Couldn't load this purchase request" error={error} />
      </>
    );
  }

  if (isPending) {
    return (
      <>
        <div className="flex flex-col gap-2">
          <Skeleton className="h-7 w-64" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>
        <Skeleton className="h-96 w-full" />
      </>
    );
  }

  /**
   * The URL only proposes items; the request decides. Anything sourced
   * directly is dropped, because a quote against it would save and then never
   * appear in the comparison.
   */
  const items = request.items.filter(
    (item) => itemIds.includes(item._id) && item.is_needs_canvass,
  );

  if (items.length === 0) {
    return (
      <>
        <PageHeader
          title="Add Vendor Quote"
          description={request.no}
          actions={
            <Button
              variant="outline"
              render={<Link href={canvassingHref} />}
              nativeButton={false}
            >
              Back to canvassing
            </Button>
          }
        />
        <EmptyState
          icon={<PackageXIcon />}
          title="Nothing to quote"
          description="Pick one or more items routed to canvassing on the canvassing screen, then start a quote from there."
        />
      </>
    );
  }

  function submit() {
    const result = validateQuotationDraft(
      draft,
      items.map((item) => item._id),
    );

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
    save({ payload: result.payload, attachments });
  }

  function addAttachments(files: FileList | null) {
    const { accepted, error: rejected } = acceptAttachments(files);

    setAttachments((current) => [...current, ...accepted]);
    setFieldErrors((current) => ({ ...current, attachments: rejected }));
  }

  return (
    <>
      <PageHeader
        title="Add Vendor Quote"
        description={`${request.no} · ${items.length} ${
          items.length === 1 ? "item" : "items"
        } priced by one vendor`}
        actions={
          <>
            <Button
              variant="outline"
              disabled={saving}
              render={<Link href={canvassingHref} />}
              nativeButton={false}
            >
              Cancel
            </Button>
            <Button onClick={submit} disabled={saving}>
              {saving ? "Saving…" : "Save Quote"}
            </Button>
          </>
        }
      />

      {saveError ? (
        <ErrorAlert title="Couldn't save this quote" error={saveError} />
      ) : null}

      <Card>
        <CardHeader className="border-b">
          <CardTitle>Vendor &amp; Quote Details</CardTitle>
        </CardHeader>
        <CardContent>
          <QuotationFormFields
            draft={draft}
            errors={fieldErrors}
            onChange={patchDraft}
            disabled={saving}
          />
        </CardContent>
      </Card>

      <QuotationItemPricingTable
        items={items}
        unitPrices={draft.unitPrices}
        pricingError={fieldErrors.pricing}
        total={quotationTotal(items, draft.unitPrices)}
        onPriceChange={(itemId, value) =>
          patchDraft({ unitPrices: { ...draft.unitPrices, [itemId]: value } })
        }
      />

      <QuotationAttachmentsField
        attachments={attachments}
        error={fieldErrors.attachments}
        onAdd={addAttachments}
        onRemove={(index) =>
          setAttachments((current) =>
            current.filter((_, position) => position !== index),
          )
        }
      />

      <Card>
        <CardContent className="text-xs text-muted-foreground">
          Saving adds this quote to the comparison for each item above. It does
          not pick a winner — awarding a vendor is a separate step.
        </CardContent>
      </Card>
    </>
  );
}
