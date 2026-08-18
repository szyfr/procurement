"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowRightIcon, PackageXIcon } from "lucide-react";
import Link from "next/link";
import * as React from "react";

import { useCan } from "@/components/providers/permissions-provider";
import { PageHeader } from "@/components/shared/page-header";
import { ErrorAlert } from "@/components/shared/query-states";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  dataTableClass,
  numericCellClass,
} from "@/components/shared/table-classes";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { PERMISSIONS } from "@/modules/auth/constants/permissions";
import type { PurchaseRequestItem } from "@/modules/purchase-requests";
import {
  closedToQuotingItemStatuses,
  purchaseRequestDetailQuery,
  purchaseRequestItemStatusLabels,
  purchaseRequestItemTone,
  usePurchaseRequestUpdates,
} from "@/modules/purchase-requests";

/**
 * The live part of the canvassing screen: the request's own header and the
 * items available for quotation, read from the purchase request detail the BFF
 * already serves.
 *
 * There is no Batch column: no batch or grouping field exists on the item
 * model, its DTO, or the backend, so there is nothing to render. It returns
 * once items can actually be grouped.
 */
export function CanvassingItemsView({ id }: { id: string }) {
  // Selecting items here only builds the link to the quote form, so the whole
  // footer follows the grant that form needs.
  const canAddQuote = useCan(PERMISSIONS.quotation.store);

  usePurchaseRequestUpdates();

  const {
    data: request,
    isPending,
    isError,
    error,
  } = useQuery(purchaseRequestDetailQuery(id));

  /**
   * Selection is local: it only decides which items the quote form opens with,
   * which it reads back off the URL. Nothing about it is persisted.
   */
  const [selected, setSelected] = React.useState<string[]>([]);

  function toggle(itemId: string, checked: boolean) {
    setSelected((current) =>
      checked
        ? [...current, itemId]
        : current.filter((entry) => entry !== itemId),
    );
  }

  if (isError) {
    return (
      <>
        <PageHeader title="Canvassing" />
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
        <Skeleton className="h-64 w-full" />
      </>
    );
  }

  const itemCount = request.items.length;

  /**
   * Only items routed to canvassing can be quoted, and only while canvassing
   * is still open for them. A quote saved against a directly-sourced item
   * would store fine and then never appear anywhere — the comparison below
   * reads the same `sourcing` filter — and one saved against an item already
   * on a PO arrives too late to change anything.
   */
  const isQuotable = (item: PurchaseRequestItem) =>
    Boolean(item.is_needs_canvass) &&
    !closedToQuotingItemStatuses.includes(item.status);

  const quotableCount = request.items.filter(isQuotable).length;

  // Hide, don't disable: with every item already on a PO (or otherwise closed)
  // there is nothing to select and no quote to create, so the checkbox column
  // and the footer go rather than sitting there permanently inert.
  const canSelect = canAddQuote && quotableCount > 0;

  const quoteParams = new URLSearchParams();
  for (const itemId of selected) quoteParams.append("items", itemId);

  return (
    <>
      <PageHeader
        title={
          <span className="flex flex-wrap items-center gap-2">
            Canvassing —
            <span className="font-mono text-base">{request.no}</span>
          </span>
        }
        description={[
          request.department?.title,
          `${itemCount} ${itemCount === 1 ? "item" : "items"}`,
          "not all items need to go to the same vendor",
        ]
          .filter(Boolean)
          .join(" · ")}
      />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 border-b">
          <CardTitle>Items in this Purchase Request</CardTitle>
          <span className="text-xs text-muted-foreground">
            {quotableCount === 0
              ? "No items are open for quotation"
              : quotableCount === itemCount
                ? "Select items to quote together"
                : `${quotableCount} of ${itemCount} open for quotation — only those can be quoted`}
          </span>
        </CardHeader>

        {itemCount === 0 ? (
          <CardContent>
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <PackageXIcon />
                </EmptyMedia>
                <EmptyTitle>No items to canvass</EmptyTitle>
                <EmptyDescription>
                  This purchase request has no items available for quotation.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          </CardContent>
        ) : (
          <>
            <CardContent className="px-0">
              <Table className={dataTableClass}>
                <TableHeader>
                  <TableRow>
                    {canSelect ? (
                      <TableHead scope="col" className="w-8">
                        <span className="sr-only">Select</span>
                      </TableHead>
                    ) : null}
                    <TableHead scope="col">Item</TableHead>
                    <TableHead scope="col" className={numericCellClass}>
                      Qty
                    </TableHead>
                    <TableHead scope="col">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {request.items.map((item) => {
                    const isSelected = selected.includes(item._id);
                    const quotable = isQuotable(item);
                    // The detail pipeline joins the material; the raw id
                    // stands in if the lookup missed.
                    const name = item.material?.description || item.material_id;

                    return (
                      <TableRow
                        key={item._id}
                        className={cn(isSelected && "bg-status-info-subtle")}
                      >
                        {canSelect ? (
                          <TableCell>
                            <Checkbox
                              checked={isSelected}
                              disabled={!quotable}
                              aria-label={
                                quotable
                                  ? `Select ${name}`
                                  : item.is_needs_canvass
                                    ? `${name} is no longer open for quotation`
                                    : `${name} is sourced directly and can't be quoted`
                              }
                              onCheckedChange={(checked) =>
                                toggle(item._id, checked === true)
                              }
                            />
                          </TableCell>
                        ) : null}
                        <TableCell
                          className={cn(
                            "font-medium",
                            !quotable && "text-muted-foreground",
                          )}
                        >
                          {name}
                        </TableCell>
                        <TableCell className={numericCellClass}>
                          {item.quantity}
                        </TableCell>
                        <TableCell>
                          <StatusBadge
                            tone={purchaseRequestItemTone[item.status]}
                          >
                            {purchaseRequestItemStatusLabels[item.status]}
                          </StatusBadge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>

            {canAddQuote && quotableCount > 0 ? (
              <CardFooter className="justify-between gap-2">
                <span className="text-xs text-muted-foreground">
                  {selected.length} {selected.length === 1 ? "item" : "items"}{" "}
                  selected
                  {selected.length > 0
                    ? " — one quote will cover all of them"
                    : ""}
                </span>
                <Button
                  size="sm"
                  disabled={selected.length === 0}
                  render={
                    <Link
                      href={`/purchase-requests/${request._id}/canvassing/quotes/new?${quoteParams}`}
                    />
                  }
                  nativeButton={false}
                >
                  Create Quotation for Selected Items
                  <ArrowRightIcon data-icon="inline-end" />
                </Button>
              </CardFooter>
            ) : null}
          </>
        )}
      </Card>
    </>
  );
}
