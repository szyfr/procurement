"use client";

import { useQuery } from "@tanstack/react-query";
import { FileTextIcon, PencilIcon } from "lucide-react";

import { ErrorAlert } from "@/components/shared/query-states";
import { SectionLabel } from "@/components/shared/section-label";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { formatShortDate } from "@/lib/date";
import { cn, formatCurrency } from "@/lib/utils";
import {
  quotationDetailQuery,
  quotationVendorLabel,
} from "@/modules/canvassing";

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}

/**
 * Read-only detail for one quotation. `GET /canvassing/quotations` — what the
 * comparison table renders from — carries no attachments, so this fetches
 * `GET /quotations/{id}` separately, and only once the sheet is open.
 *
 * The comparison owns the open state and mounts one of these per item card
 * rather than one per row, so a table of quotes doesn't stand up a query each.
 */
export function QuotationDetailSheet({
  quotationId,
  referenceNo,
  itemId,
  itemName,
  open,
  onOpenChange,
  canEdit,
  onEdit,
}: {
  /** Null while nothing is being viewed; the sheet renders nothing at all. */
  quotationId: string | null;
  /** Known from the row, so the header reads right before the fetch lands. */
  referenceNo: string;
  /** Which row in `item_pricing` is the one the sheet was opened from. */
  itemId: string;
  itemName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Hands this quote off to the edit dialog, which the comparison owns. */
  /** Editing a quote is a separate grant from reading one. */
  canEdit: boolean;
  onEdit: () => void;
}) {
  const { data, isPending, isError, error } = useQuery({
    ...quotationDetailQuery(quotationId ?? ""),
    enabled: open && Boolean(quotationId),
  });

  if (!quotationId) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      {/* The side-scoped widths have to be overridden on the same selector, or
          the base `data-[side=right]:w-3/4` outranks a plain `w-` utility. */}
      <SheetContent className="flex flex-col gap-0 p-0 data-[side=right]:w-[470px] data-[side=right]:sm:max-w-[470px]">
        <SheetHeader className="gap-1 border-b p-4 pr-24">
          <SheetDescription className="font-mono text-xs">
            {referenceNo}
          </SheetDescription>
          <SheetTitle>Quotation for {itemName}</SheetTitle>
        </SheetHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto p-4">
          {isError ? (
            <ErrorAlert title="Couldn't load this quotation" error={error} />
          ) : isPending ? (
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : (
            <>
              <section className="flex flex-col gap-3">
                <SectionLabel>Quote information</SectionLabel>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Reference No." value={data.reference_no} />
                  <Field
                    label="Vendor"
                    value={quotationVendorLabel(data) ?? "—"}
                  />
                  <Field
                    label="Quote Date"
                    value={formatShortDate(data.date) ?? "—"}
                  />
                  <Field
                    label="Delivery Date"
                    value={formatShortDate(data.delivery_date) ?? "—"}
                  />
                  <Field
                    label="Payment Term"
                    value={data.payment_term?.title || "—"}
                  />
                </div>
              </section>

              <section className="flex flex-col gap-2">
                <SectionLabel>Items priced</SectionLabel>
                <ul className="flex flex-col divide-y rounded-md border">
                  {data.item_pricing.map((pricing) => (
                    <li
                      key={pricing.item_id}
                      className={cn(
                        "flex items-center justify-between px-3 py-2",
                        pricing.item_id === itemId && "bg-accent",
                      )}
                    >
                      <span className="font-mono text-xs">
                        {pricing.item_id === itemId
                          ? itemName
                          : pricing.item_id}
                      </span>
                      <span>{formatCurrency(pricing.unit_price, true)}</span>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="flex flex-col gap-2">
                <SectionLabel>Attachments</SectionLabel>
                {data.documents.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    No files were attached to this quote.
                  </p>
                ) : (
                  <ul className="flex flex-col gap-1">
                    {data.documents.map((document) => (
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
                )}
              </section>
            </>
          )}
        </div>

        {canEdit ? (
          <div className="flex items-center gap-2 border-t p-4">
            <Button className="flex-1" onClick={onEdit}>
              <PencilIcon data-icon="inline-start" />
              Edit quote
            </Button>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
