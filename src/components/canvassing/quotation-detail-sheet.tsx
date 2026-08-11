"use client";

import { useQuery } from "@tanstack/react-query";
import { FileTextIcon, PencilIcon } from "lucide-react";

import { ErrorAlert } from "@/components/shared/query-states";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, formatShortDate } from "@/lib/date";
import { cn, formatCurrency } from "@/lib/utils";
import { type Quotation, quotationDetailQuery } from "@/modules/canvassing";

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}

function SectionLabel(props: React.ComponentProps<"p">) {
  return (
    <p
      className="text-xs font-semibold tracking-[0.06em] text-muted-foreground uppercase"
      {...props}
    />
  );
}

/**
 * Read-only detail for one quotation. Everything but the attachments is
 * already on the comparison row, so the sheet renders from that immediately
 * and fetches `GET /quotations/{id}` — the only read that joins documents —
 * in the background, once opened.
 */
export function QuotationDetailSheet({
  quotation,
  open,
  onOpenChange,
  onEdit,
  itemId,
  itemName,
}: {
  quotation: Quotation | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (quotation: Quotation) => void;
  /** Which row in `item_pricing` is the one the sheet was opened from. */
  itemId: string;
  itemName: string;
}) {
  const { data, isPending, isError, error } = useQuery({
    ...quotationDetailQuery(quotation?._id ?? ""),
    enabled: open && Boolean(quotation),
  });

  if (!quotation) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      {/* The side-scoped widths have to be overridden on the same selector, or
          the base `data-[side=right]:w-3/4` outranks a plain `w-` utility. */}
      <SheetContent className="flex flex-col gap-0 p-0 data-[side=right]:w-[470px] data-[side=right]:sm:max-w-[470px]">
        <SheetHeader className="gap-1 border-b p-4 pr-24">
          {/* No vendor join upstream — the id stands in for the name. */}
          <SheetDescription className="font-mono text-xs">
            {quotation.vendor_id}
          </SheetDescription>
          <SheetTitle>Quotation {quotation.reference_no}</SheetTitle>
        </SheetHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto p-4 text-sm">
          {isError ? (
            <ErrorAlert title="Couldn't load this quotation" error={error} />
          ) : null}

          <section className="flex flex-col gap-3">
            <SectionLabel>Quote information</SectionLabel>
            <div className="grid grid-cols-2 gap-3">
              <Field
                label="Vendor ID"
                value={
                  <span className="font-mono text-xs">
                    {quotation.vendor_id}
                  </span>
                }
              />
              {/* Payment terms have their own module, but nothing here resolves this id to it. */}
              <Field
                label="Payment Term ID"
                value={
                  <span className="font-mono text-xs">
                    {quotation.payment_term_id}
                  </span>
                }
              />
              <Field
                label="Quote Date"
                value={formatShortDate(quotation.date) ?? "—"}
              />
              <Field
                label="Delivery Date"
                value={formatShortDate(quotation.delivery_date) ?? "—"}
              />
            </div>
          </section>

          <section className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <SectionLabel>Items priced</SectionLabel>
              <span className="text-xs text-muted-foreground tabular-nums">
                {quotation.item_pricing.length}
              </span>
            </div>
            <ul className="flex flex-col divide-y rounded-md border">
              {quotation.item_pricing.map((pricing) => (
                <li
                  key={pricing.item_id}
                  className={cn(
                    "flex items-center justify-between gap-2 px-3 py-2",
                    pricing.item_id === itemId && "bg-accent",
                  )}
                >
                  {/* Only the item the sheet was opened from has a name to
                      hand; the rest of the quote is ids. */}
                  <span className="min-w-0 truncate font-mono text-xs">
                    {pricing.item_id === itemId ? itemName : pricing.item_id}
                  </span>
                  <span className="shrink-0 tabular-nums">
                    {formatCurrency(pricing.unit_price, true)}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section className="flex flex-col gap-2">
            <SectionLabel>Attachments</SectionLabel>
            {isPending ? (
              <div className="flex flex-col gap-2">
                {Array.from({ length: 2 }, (_, row) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: fixed-length placeholder rows
                  <Skeleton key={row} className="h-5 w-full" />
                ))}
              </div>
            ) : data && data.documents.length > 0 ? (
              <ul className="flex flex-col gap-1">
                {data.documents.map((document) => (
                  <li key={document._id} className="min-w-0">
                    <a
                      href={document.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 text-xs text-primary hover:underline"
                    >
                      <FileTextIcon className="size-3.5 shrink-0" />
                      <span className="min-w-0 truncate">
                        {document.filename}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-muted-foreground">
                No files were attached to this quote.
              </p>
            )}
          </section>

          <section className="flex flex-col gap-2">
            <SectionLabel>Audit information</SectionLabel>
            <div className="grid grid-cols-2 gap-3">
              <Field
                label="Created"
                value={formatDate(quotation.created_at) ?? "—"}
              />
              {/* No author is recorded on a quotation upstream. */}
              <Field label="Created by" value="—" />
              <Field
                label="Last updated"
                value={formatDate(quotation.updated_at) ?? "—"}
              />
              <Field label="Updated by" value="—" />
            </div>
          </section>
        </div>

        <div className="flex items-center gap-2 border-t p-4">
          {/* No delete: FastAPI has one, but the BFF exposes no route for it. */}
          <Button className="flex-1" onClick={() => onEdit(quotation)}>
            <PencilIcon data-icon="inline-start" />
            Edit quote
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
