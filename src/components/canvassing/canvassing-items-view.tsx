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
import {
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
   * Only items routed to canvassing can be quoted. A quote saved against a
   * directly-sourced item would store fine and then never appear anywhere —
   * the comparison below reads the same `sourcing` filter.
   */
  const quotableCount = request.items.filter(
    (item) => item.is_needs_canvass,
  ).length;

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
            {quotableCount === itemCount
              ? "Select items to quote together"
              : `${quotableCount} of ${itemCount} routed to canvassing — only those can be quoted`}
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
                    {canAddQuote ? (
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
                    const quotable = Boolean(item.is_needs_canvass);
                    // The detail pipeline joins the material; the raw id
                    // stands in if the lookup missed.
                    const name = item.material?.description || item.material_id;

                    return (
                      <TableRow
                        key={item._id}
                        className={cn(isSelected && "bg-status-info-subtle")}
                      >
                        {canAddQuote ? (
                          <TableCell>
                            <Checkbox
                              checked={isSelected}
                              disabled={!quotable}
                              aria-label={
                                quotable
                                  ? `Select ${name}`
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

            {canAddQuote ? (
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
