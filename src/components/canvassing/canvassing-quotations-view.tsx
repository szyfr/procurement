"use client";

import { useQuery } from "@tanstack/react-query";
import { InboxIcon, PlusIcon } from "lucide-react";
import Link from "next/link";
import * as React from "react";

import { AwardVendorDialog } from "@/components/canvassing/award-vendor-dialog";
import { EditQuotationDialog } from "@/components/canvassing/edit-quotation-dialog";
import { QuotationDetailSheet } from "@/components/canvassing/quotation-detail-sheet";
import { QuotationRowActions } from "@/components/canvassing/quotation-row-actions";
import { useCan } from "@/components/providers/permissions-provider";
import { ErrorAlert } from "@/components/shared/query-states";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  cellIdClass,
  dataTableClass,
  numericCellClass,
} from "@/components/shared/table-classes";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatShortDate } from "@/lib/date";
import { cn, formatCurrency } from "@/lib/utils";
import { PERMISSIONS } from "@/modules/auth/constants/permissions";
import {
  canvassingQuotationsQuery,
  type Quotation,
  quotationVendorLabel,
  useCanvassingUpdates,
} from "@/modules/canvassing";
import {
  type PurchaseRequestItem,
  purchaseRequestDetailQuery,
} from "@/modules/purchase-requests";

/** The price this quote puts on the item it was grouped under. */
function unitPriceFor(quotation: Quotation, itemId: string) {
  // The join attaches a quotation to an item only when it prices it, so this
  // should always hit; a missing price renders as unquoted rather than zero.
  return (
    quotation.item_pricing.find((pricing) => pricing.item_id === itemId)
      ?.unit_price ?? null
  );
}

/**
 * The quote comparison: one section per item out for canvassing, listing the
 * vendors that have quoted it.
 *
 * There are no batches here because the backend has no such concept — quotes
 * attach to a purchase request item, and a quote covering several items is
 * simply repeated under each one it prices.
 *
 * Awarding writes through `PATCH /canvassing/award/{quotation_id}`, which
 * stamps the winning quotation's id onto the item. `GET /canvassing/quotations`
 * echoes it back as `quotation_id`, so which row won survives a reload rather
 * than living only in this component's state.
 */
export function CanvassingQuotationsView({ id }: { id: string }) {
  useCanvassingUpdates(id);

  // The same query the items card runs, so this shares its cache entry rather
  // than fetching the request twice.
  const { data: request, isError: requestFailed } = useQuery(
    purchaseRequestDetailQuery(id),
  );

  // Only items routed to canvassing can be quoted; a direct-sourced item always
  // comes back with an empty list.
  const canvassingItems =
    request?.items.filter((item) => item.is_needs_canvass) ?? [];
  const itemIds = canvassingItems.map((item) => item._id);

  const {
    data: quoted,
    isPending,
    isError,
    error,
  } = useQuery(canvassingQuotationsQuery(itemIds));

  const [selected, setSelected] = React.useState<Record<string, string>>({});

  // The request itself failing is already reported by the items card above.
  if (requestFailed) return null;
  if (request && canvassingItems.length === 0) return null;

  if (isError) {
    return <ErrorAlert title="Couldn't load quotations" error={error} />;
  }

  if (!request || isPending) {
    return (
      <>
        <Skeleton className="h-5 w-72" />
        <Skeleton className="h-48 w-full" />
      </>
    );
  }

  const byItemId = new Map(quoted.map((entry) => [entry._id, entry]));

  return (
    <>
      {canvassingItems.map((item) => (
        <QuoteComparison
          key={item._id}
          purchaseRequestId={id}
          item={item}
          // An item the aggregation didn't return has simply never been quoted.
          quotations={byItemId.get(item._id)?.quotations ?? []}
          selected={selected[item._id] ?? null}
          onSelect={(quotationId) =>
            setSelected((current) => ({ ...current, [item._id]: quotationId }))
          }
          awardedQuotationId={byItemId.get(item._id)?.quotation_id ?? null}
        />
      ))}
    </>
  );
}

/**
 * Wraps the quote table in a radio group only when a winner can actually be
 * picked. Base UI's RadioGroup renders `role="radiogroup"`, and one with no
 * radios inside is announced as an empty set of choices.
 */
function ConditionalRadioGroup({
  enabled,
  value,
  onSelect,
  label,
  children,
}: {
  enabled: boolean;
  value: string | null;
  onSelect: (quotationId: string) => void;
  label: string;
  children: React.ReactNode;
}) {
  if (!enabled) return <>{children}</>;

  return (
    <RadioGroup
      value={value}
      onValueChange={(next) => onSelect(String(next))}
      aria-label={label}
      className="block"
    >
      {children}
    </RadioGroup>
  );
}

function QuoteComparison({
  purchaseRequestId,
  item,
  quotations,
  selected,
  onSelect,
  awardedQuotationId,
}: {
  purchaseRequestId: string;
  item: PurchaseRequestItem;
  quotations: Quotation[];
  selected: string | null;
  onSelect: (quotationId: string) => void;
  awardedQuotationId: string | null;
}) {
  // The detail pipeline joins the material; the ERP number, then the raw id,
  // stand in if the lookup missed.
  const name =
    item.material?.description?.trim() || item.material?.no || item.material_id;
  const unit = item.material?.uom || null;
  const quantity = `${item.quantity}${unit ? ` ${unit}` : ""}`;

  const canAddQuote = useCan(PERMISSIONS.quotation.store);
  const canViewQuote = useCan(PERMISSIONS.quotation.show);
  const canEditQuote = useCan(PERMISSIONS.quotation.update);
  const canAward = useCan(PERMISSIONS.canvassing.award);

  // One sheet and one dialog for the whole card rather than a pair per row, so
  // a table of quotes doesn't mount a detail query each. Viewing and editing
  // are mutually exclusive, so a single overlay holds both.
  const [overlay, setOverlay] = React.useState<{
    kind: "view" | "edit";
    quotation: Quotation;
  } | null>(null);

  if (awardedQuotationId) {
    const winner =
      quotations.find((quotation) => quotation._id === awardedQuotationId) ??
      null;
    const winningPrice = winner ? unitPriceFor(winner, item._id) : null;
    const winningVendor = quotationVendorLabel(winner);

    return (
      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-0.5">
            <h2 className="font-medium">{name}</h2>
            <p className="text-xs text-muted-foreground">
              Vendor already selected for this item
            </p>
          </div>
          <StatusBadge tone="success">
            Vendor Selected{winningVendor ? ` — ${winningVendor}` : ""}
          </StatusBadge>
        </div>

        <Card>
          <CardContent className="grid gap-4 text-xs sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-muted-foreground">Winning Price</p>
              <p>
                {winningPrice === null
                  ? "—"
                  : formatCurrency(winningPrice, true)}
                {winningVendor ? ` · ${winningVendor}` : ""}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Delivery Estimate</p>
              <p>{formatShortDate(winner?.delivery_date) ?? "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Quotes Received</p>
              <p>
                {quotations.length}{" "}
                {quotations.length === 1 ? "quote" : "quotes"}
              </p>
            </div>
            {/* The backend has no award timestamp — only the item's ordinary
                `updated_at`, which nothing distinguishes from any other write. */}
            <div>
              <p className="text-muted-foreground">Selected On</p>
              <p>—</p>
            </div>
          </CardContent>
        </Card>
      </section>
    );
  }

  const selectedQuotation =
    quotations.find((quotation) => quotation._id === selected) ?? null;

  // The cheapest quote is the one the comparison exists to surface. Ties keep
  // the first row, which is the order the backend returned.
  const lowestPrice = quotations.reduce<number | null>((lowest, quotation) => {
    const price = unitPriceFor(quotation, item._id);

    return price !== null && (lowest === null || price < lowest)
      ? price
      : lowest;
  }, null);

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-0.5">
          <h2 className="font-medium">{name}</h2>
          <p className="text-xs text-muted-foreground">
            {quantity} out for quotation
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* The count is all that's real — the backend enforces no quote minimum. */}
          <StatusBadge tone={quotations.length > 0 ? "success" : "neutral"}>
            {quotations.length} {quotations.length === 1 ? "quote" : "quotes"}{" "}
            received
          </StatusBadge>
          {canAddQuote ? (
            <Button
              variant="outline"
              size="sm"
              nativeButton={false}
              render={
                <Link
                  href={`/purchase-requests/${purchaseRequestId}/canvassing/quotes/new?items=${item._id}`}
                />
              }
            >
              <PlusIcon data-icon="inline-start" />
              Add Vendor Quote
            </Button>
          ) : null}
        </div>
      </div>

      {quotations.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
            <InboxIcon className="size-6 text-muted-foreground" />
            <p className="font-medium text-sm">No quotes yet</p>
            <p className="max-w-sm text-xs text-muted-foreground">
              No quotes have been entered for this item yet.
              {canAddQuote
                ? " Add a vendor quote to start the comparison."
                : null}
            </p>
            {canAddQuote ? (
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                nativeButton={false}
                render={
                  <Link
                    href={`/purchase-requests/${purchaseRequestId}/canvassing/quotes/new?items=${item._id}`}
                  />
                }
              >
                <PlusIcon data-icon="inline-start" />
                Add Vendor Quote
              </Button>
            ) : null}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="px-0">
            {/* The radio group only exists to pick a winner, so without the
                award grant the table stands on its own rather than sitting in
                a radiogroup with no options in it. */}
            <ConditionalRadioGroup
              enabled={canAward}
              value={selected}
              onSelect={onSelect}
              label={`Select winning vendor for ${name}`}
            >
              <Table className={dataTableClass}>
                <TableHeader>
                  <TableRow>
                    {canAward ? (
                      <TableHead scope="col" className="w-8">
                        <span className="sr-only">Select</span>
                      </TableHead>
                    ) : null}
                    <TableHead scope="col">Vendor</TableHead>
                    <TableHead scope="col">Reference</TableHead>
                    <TableHead scope="col" className={numericCellClass}>
                      Unit Price
                    </TableHead>
                    <TableHead scope="col" className={numericCellClass}>
                      Total
                    </TableHead>
                    <TableHead scope="col">Delivery</TableHead>
                    <TableHead scope="col">Quote Date</TableHead>
                    <TableHead scope="col">
                      <span className="sr-only">Actions</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {quotations.map((quotation) => {
                    const unitPrice = unitPriceFor(quotation, item._id);
                    const isLowest =
                      unitPrice !== null && unitPrice === lowestPrice;
                    const vendorName = quotationVendorLabel(quotation);

                    return (
                      <TableRow
                        key={quotation._id}
                        className={cn(isLowest && "bg-status-success-subtle")}
                      >
                        {canAward ? (
                          <TableCell>
                            <RadioGroupItem
                              value={quotation._id}
                              aria-label={`Select vendor ${vendorName ?? "unknown"}`}
                            />
                          </TableCell>
                        ) : null}
                        <TableCell
                          className={cn(
                            isLowest && "font-semibold text-status-success-fg",
                          )}
                        >
                          {vendorName ?? "—"}
                        </TableCell>
                        <TableCell className={cellIdClass}>
                          {quotation.reference_no}
                        </TableCell>
                        <TableCell
                          className={cn(
                            numericCellClass,
                            isLowest && "font-semibold text-status-success-fg",
                          )}
                        >
                          {unitPrice === null
                            ? "—"
                            : formatCurrency(unitPrice, true)}
                        </TableCell>
                        <TableCell
                          className={cn(
                            numericCellClass,
                            isLowest && "font-semibold text-status-success-fg",
                          )}
                        >
                          {unitPrice === null
                            ? "—"
                            : formatCurrency(unitPrice * item.quantity, true)}
                        </TableCell>
                        <TableCell>
                          {formatShortDate(quotation.delivery_date) ?? "—"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatShortDate(quotation.date) ?? "—"}
                        </TableCell>
                        <TableCell>
                          <QuotationRowActions
                            vendorName={vendorName}
                            canView={canViewQuote}
                            canEdit={canEditQuote}
                            onView={() =>
                              setOverlay({ kind: "view", quotation })
                            }
                            onEdit={() =>
                              setOverlay({ kind: "edit", quotation })
                            }
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </ConditionalRadioGroup>
          </CardContent>
          {canAward ? (
            <CardFooter className="justify-between gap-2">
              <span className="text-xs text-muted-foreground">
                Pick the winning quote, then confirm the vendor.
              </span>
              <AwardVendorDialog
                quotationId={selected}
                itemId={item._id}
                itemName={name}
                vendorName={quotationVendorLabel(selectedQuotation)}
                unitPrice={
                  selectedQuotation
                    ? unitPriceFor(selectedQuotation, item._id)
                    : null
                }
                quantity={quantity}
              />
            </CardFooter>
          ) : null}
        </Card>
      )}

      <QuotationDetailSheet
        quotationId={overlay?.quotation._id ?? null}
        referenceNo={overlay?.quotation.reference_no ?? ""}
        itemId={item._id}
        itemName={name}
        canEdit={canEditQuote}
        open={overlay?.kind === "view"}
        onOpenChange={(open) => {
          if (!open) setOverlay(null);
        }}
        onEdit={() =>
          setOverlay((current) =>
            current ? { kind: "edit", quotation: current.quotation } : null,
          )
        }
      />

      <EditQuotationDialog
        purchaseRequestId={purchaseRequestId}
        quotationId={overlay?.quotation._id ?? null}
        open={overlay?.kind === "edit"}
        onOpenChange={(open) => {
          if (!open) setOverlay(null);
        }}
      />
    </section>
  );
}
